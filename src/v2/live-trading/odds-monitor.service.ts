import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Page } from 'playwright';
import { DataFileService } from '../core/data-file.service';
import { SharedBrowserService, BrowserConfig } from '../core/shared-browser.service';
import { DATA_FILE_SERVICE } from './tokens';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OddsMonitorService {
  private isRunning = false;
  private lastOddsData: any = null;
  private readonly logPrefix = '[OddsMonitor]';
  private readonly serviceName = 'OddsMonitor';

  constructor(
    private configService: ConfigService,
    @Inject(DATA_FILE_SERVICE) private dataFileService: DataFileService,
    private sharedBrowserService: SharedBrowserService
  ) {}

  async onModuleInit() {
    // Initialize with empty odds data
    this.lastOddsData = { timestamp: Date.now(), matches: [], source: 'hkjc' };
    await this.dataFileService.writeFile('odds-data.json', this.lastOddsData);
    
    // Start monitoring after short delay
    setTimeout(async () => {
      try {
        await this.initializeBrowser();
        await this.monitorOdds();
      } catch (error) {
        console.error(`${this.logPrefix} Initialization failed:`, error);
      }
    }, 2000);
  }

  async onModuleDestroy() {
    await this.sharedBrowserService.cleanupService(this.serviceName);
  }

  @Cron('0 */5 * * * *') // Every 5 minutes during trading hours
  async scheduledOddsMonitor() {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 8 && hour <= 23) { // 8 AM to 11 PM
      await this.monitorOdds();
    }
  }

  async monitorOdds(): Promise<any> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`${this.logPrefix} Scraping HKJC odds...`);
    
    try {
      await this.initializeBrowser();
      const oddsData = await this.scrapeCurrentOdds();
      
      if (oddsData?.matches?.length > 0) {
        this.lastOddsData = oddsData;
        await this.dataFileService.writeFile('odds-data.json', oddsData);
        console.log(`${this.logPrefix} Saved ${oddsData.matches.length} matches`);
      }
      
      return oddsData;
    } catch (error) {
      console.error(`${this.logPrefix} Failed:`, (error as Error).message);
      return null;
    } finally {
      this.isRunning = false;
    }
  }

  private async initializeBrowser() {
    const browserConfig = this.dataFileService.getBrowserConfig();
    const config: BrowserConfig = {
      headless: browserConfig.headless,
      timeout: 30000,
      userDataDir: './data/v2/browser-odds-monitor',
      debuggingPort: 9225,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    
    await this.sharedBrowserService.getPageInstance(this.serviceName, config);
  }

  private async scrapeCurrentOdds(): Promise<any> {
    // Get page instance from shared service
    const page = await this.sharedBrowserService.getPageInstance(this.serviceName, {
      headless: this.dataFileService.getBrowserConfig().headless,
      timeout: 30000,
      userDataDir: './data/v2/browser-odds-monitor',
      debuggingPort: 9225,
      userAgent: 'OddsMonitor-Process'
    });

    // Get HKJC URLs from injected data service (respects mock/real mode)
    const urlConfig = this.dataFileService.getHKJCUrls();
    const url = urlConfig.url;
    let pageLoaded = false;
    try {
      await page.goto(url, { 
        timeout: urlConfig.timeout || 30000,
        waitUntil: 'domcontentloaded'
      });
      pageLoaded = true;
    } catch (error) {
      // Failed to load page
    }
    
    if (!pageLoaded) {
      throw new Error('Could not load any HKJC URL');
    }
    
    // Wait for dynamic content to load and fixtures to appear
    await this.waitForFixturesToLoad(page);
    
    // Use improved DOM-based scraping method
    const matches = await this.scrapeMatchesFromDOM(page);

    // Return ALL matches, not just EPL (normalize team names for consistency)
    const allMatches = matches.map(match => ({
      ...match,
      homeTeam: this.normalizeTeamName(match.homeTeam) || match.homeTeam,
      awayTeam: this.normalizeTeamName(match.awayTeam) || match.awayTeam
    }));

    return {
      timestamp: Date.now(),
      matches: allMatches,
      source: 'hkjc',
      totalMatches: allMatches.length
    };
  }

  private async waitForFixturesToLoad(page: Page): Promise<void> {
    const maxWaitTime = 60000; // 1 minute max wait
    const checkInterval = 2000; // Check every 2 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if match rows exist
        const matchCount = await page.$$eval('.match-row', (elements) => elements.length);
        
        if (matchCount > 0) {
            // Wait a bit more for odds to load
          await page.waitForTimeout(3000);
          
          // Verify odds are loaded by checking for handicap data
          const oddsLoaded = await page.$$eval('.match-row', (elements) => {
            return elements.some(el => {
              const text = el.textContent || '';
              return text.includes('[') && text.includes(']') && /\d+\.\d+/.test(text);
            });
          });
          
          if (oddsLoaded) {
            return;
          }
        }
        
        await page.waitForTimeout(checkInterval);
      } catch (error) {
        await page.waitForTimeout(checkInterval);
      }
    }
    
    throw new Error('Fixtures did not appear within the expected time frame');
  }

  private async scrapeMatchesFromDOM(page: Page): Promise<any[]> {
    
    // Try multiple possible selectors for HKJC match rows
    const possibleSelectors = [
      '[id^="HDC_"]',  // Elements with ID starting with HDC_ (most specific)
      '.match-row',
      'tr[id^="HDC"]',
      'div[id^="HDC"]',
      'tr[id^="FB"]',
      'table tr',
      '.fixture',
      '.match',
      'tr'
    ];
    
    let matchElements = [];
    let usedSelector = '';
    
    for (const selector of possibleSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          // Check if these elements contain match-like data
          const hasMatchData = await page.$$eval(selector, (elements) => {
            return elements.some(el => {
              const text = el.textContent || '';
              return text.includes('[') && text.includes(']') && /\d+\.\d+/.test(text);
            });
          });
          
          if (hasMatchData) {
            matchElements = elements;
            usedSelector = selector;
            break;
          }
        }
      } catch (error) {
        // Selector failed, try next one
      }
    }
    
    if (matchElements.length === 0) {
      return [];
    }
    
    const matches = await page.$$eval(usedSelector, (elements) => {
      const results = [];
      
      // Helper functions defined within page context
      const parseHandicap = (handicapText: string): number => {
        if (handicapText.includes('/')) {
          const parts = handicapText.split('/');
          const val1 = parseFloat(parts[0]);
          const val2 = parseFloat(parts[1]);
          return (val1 + val2) / 2;
        }
        return parseFloat(handicapText);
      };
      
      const extractTeamName = (teamElement: any): string | null => {
        const methods = [
          () => teamElement.querySelector('.team-name')?.textContent?.trim(),
          () => teamElement.querySelector('div[title]')?.getAttribute('title'),
          () => teamElement.textContent?.trim(),
          () => teamElement.querySelector('div')?.textContent?.trim()
        ];
        
        for (const method of methods) {
          try {
            const result = method();
            if (result && result.length > 0) {
              return result;
            }
          } catch (e) {
            continue;
          }
        }
        return null;
      };
      
      const extractOddsFromElement = (element: any): any => {
        const text = element.textContent || '';
        
        // Look for handicap patterns like [+0.5] or [-1.5/+1.5]
        const handicapRegex = /\[([+\-]?\d+(?:\.\d+)?(?:\/[+\-]?\d+(?:\.\d+)?)?)\]/g;
        
        const handicapMatches = Array.from(text.matchAll(handicapRegex));
        
        if (handicapMatches.length >= 2) {
          // Parse handicap (take first team's handicap)
          const handicapText = handicapMatches[0][1];
          const handicap = parseHandicap(handicapText);
          
          // Extract odds by removing handicap text first, then finding decimal numbers
          let cleanText = text;
          handicapMatches.forEach(match => {
            cleanText = cleanText.replace(match[0], ''); // Remove [+0.5/+1] patterns
          });
          
          // Remove common broadcasting channels that might interfere
          cleanText = cleanText.replace(/\b(DAZN|ESPN|FOX|NBC|CBS|BBC|SKY)\b/gi, '');
          
          // Now find odds values (should be >= 1.0 for valid betting odds)
          const oddsRegex = /(\d+\.\d+)/g;
          const oddsMatches = Array.from(cleanText.matchAll(oddsRegex));
          const validOdds = oddsMatches
            .map(match => parseFloat(match[1]))
            .filter(odds => odds >= 1.0); // Filter out handicap values that leaked through
          
          if (validOdds.length >= 2) {
            // Get the last two valid odds values (home and away)
            const homeOdds = validOdds[validOdds.length - 2];
            const awayOdds = validOdds[validOdds.length - 1];
            
            return { handicap, homeOdds, awayOdds };
          }
        }
        
        return null;
      };
      
      const parseMatchElement = (element: any): any => {
        const match = {
          id: null,
          homeTeam: null,
          awayTeam: null,
          handicap: null,
          homeOdds: null,
          awayOdds: null,
          isLive: false,
          state: 'pre-match',
          date: null
        };
        
        // Extract match ID from element ID (HDC_FB3224 -> FB3224)
        const matchId = element.id;
        if (matchId && matchId.startsWith('HDC_')) {
          match.id = matchId.replace('HDC_', '');
        }
        
        // Extract date - look for date/time patterns
        const dateSelectors = ['.date', 'td:first-child', 'div:first-child'];
        for (const selector of dateSelectors) {
          const dateElement = element.querySelector(selector);
          if (dateElement) {
            const dateText = dateElement.textContent?.trim();
            if (dateText && /\d{2}\/\d{2}\/\d{4}/.test(dateText)) {
              match.date = dateText;
              break;
            }
          }
        }
        
        // Extract team names - Method 1: .team div[title="All Odds"] structure
        const teamContainer = element.querySelector('.team div[title="All Odds"]');
        if (teamContainer) {
          const teamDivs = teamContainer.querySelectorAll('div');
          if (teamDivs.length >= 2) {
            match.homeTeam = teamDivs[0].textContent?.trim() || null;
            match.awayTeam = teamDivs[1].textContent?.trim() || null;
          }
        }
        
        // Method 2: Look for any team-like content if method 1 failed
        if (!match.homeTeam || !match.awayTeam) {
          // Look for text content that might contain team names
          const fullText = element.textContent || '';
          
          // Try to find known team patterns
          const teamPatterns = [
            /Chelsea.*?Paris Saint Germain/,
            /Hacken.*?/,
            /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+\.\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
          ];
          
          for (const pattern of teamPatterns) {
            const match_pattern = fullText.match(pattern);
            if (match_pattern) {
              // This would need custom logic per pattern
            }
          }
        }
        
        // Extract handicap and odds from .oddsLine structure
        const oddsLine = element.querySelector('.oddsLine.HDC');
        if (oddsLine) {
          const oddsItems = oddsLine.querySelectorAll('.hdcOddsItem');
          
          if (oddsItems.length >= 2) {
            // First item is home team ([+0.5/+1] 1.95)
            const homeItem = oddsItems[0];
            const homeCondElement = homeItem.querySelector('.cond');
            const homeOddsElement = homeItem.querySelector('.add-to-slip');
            
            // Second item is away team ([-0.5/-1] 1.85)
            const awayItem = oddsItems[1];
            const awayOddsElement = awayItem.querySelector('.add-to-slip');
            
            if (homeCondElement && homeOddsElement && awayOddsElement) {
              // Parse handicap from home condition [+0.5/+1] -> 0.75
              const handicapText = homeCondElement.textContent?.trim();
              if (handicapText) {
                const cleanHandicap = handicapText.replace(/[\[\]]/g, '');
                match.handicap = parseHandicap(cleanHandicap);
              }
              
              // Parse odds
              const homeOddsText = homeOddsElement.textContent?.trim();
              const awayOddsText = awayOddsElement.textContent?.trim();
              
              if (homeOddsText && awayOddsText) {
                match.homeOdds = parseFloat(homeOddsText);
                match.awayOdds = parseFloat(awayOddsText);
              }
            }
          }
        } else {
          // Fallback: use the general odds extraction method
          const oddsData = extractOddsFromElement(element);
          if (oddsData) {
            match.handicap = oddsData.handicap;
            match.homeOdds = oddsData.homeOdds;
            match.awayOdds = oddsData.awayOdds;
          }
        }
        
        // Check for live match indicators
        const liveIndicators = element.querySelectorAll('.live-indicator, .in-play, [class*="live"]');
        match.isLive = liveIndicators.length > 0;
        
        // Check for suspended matches
        const suspendedText = element.textContent?.toLowerCase();
        if (suspendedText?.includes('suspended')) {
          match.state = 'suspended';
        } else if (match.isLive) {
          match.state = 'live';
        }
        
        // Validate match data - must have teams and odds
        if (match.homeTeam && match.awayTeam && match.homeOdds && match.awayOdds) {
          return match;
        }
        
        return null;
      };
      
      // Process each match element
      elements.forEach((element, index) => {
        try {
          // Skip invisible elements
          if (element.offsetParent === null) return;
          
          // Extract data using DOM structure instead of string splitting
          const match = parseMatchElement(element);
          
          if (match) {
            results.push({
              matchId: match.id,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              handicap: match.handicap,
              homeOdds: match.homeOdds,
              awayOdds: match.awayOdds,
              timestamp: Date.now(),
              source: 'hkjc',
              isLive: match.isLive,
              matchState: match.state,
              rawData: match
            });
          }
        } catch (error) {
          // Skip failed elements
        }
      });
      
      return results;
    });
    
    return matches;
  }

  private async saveOddsData(oddsData: any) {
    const timestamp = oddsData.timestamp;
    const filename = `${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'data', 'odds-movement', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await fs.promises.writeFile(filepath, JSON.stringify(oddsData, null, 2));
  }

  private async detectOddsChanges(newOddsData: any) {
    if (!this.lastOddsData) return;
    
    const changes = [];
    
    for (const newMatch of newOddsData.matches) {
      const lastMatch = this.lastOddsData.matches.find((m: any) => 
        m.homeTeam === newMatch.homeTeam && m.awayTeam === newMatch.awayTeam
      );
      
      if (lastMatch) {
        const homeOddsChange = Math.abs(newMatch.homeOdds - lastMatch.homeOdds);
        const awayOddsChange = Math.abs(newMatch.awayOdds - lastMatch.awayOdds);
        const handicapChange = Math.abs(newMatch.handicap - lastMatch.handicap);
        
        if (homeOddsChange > 0.05 || awayOddsChange > 0.05 || handicapChange > 0) {
          changes.push({
            match: `${newMatch.homeTeam} vs ${newMatch.awayTeam}`,
            homeOdds: { old: lastMatch.homeOdds, new: newMatch.homeOdds, change: newMatch.homeOdds - lastMatch.homeOdds },
            awayOdds: { old: lastMatch.awayOdds, new: newMatch.awayOdds, change: newMatch.awayOdds - lastMatch.awayOdds },
            handicap: { old: lastMatch.handicap, new: newMatch.handicap, change: newMatch.handicap - lastMatch.handicap },
            timestamp: newMatch.timestamp
          });
        }
      }
    }
    
    if (changes.length > 0) {
      // Emit odds change events (for strategy decision engine)
      // EventBus implementation would go here
    }
  }


  private normalizeTeamName(teamName: string): string {
    const teamMapping: { [key: string]: string } = {
      'Man City': 'Manchester City',
      'Man Utd': 'Manchester Utd',
      'Spurs': 'Tottenham',
      'Leicester City': 'Leicester',
      'Wolves': 'Wolves',
      'Brighton': 'Brighton',
      'Crystal Palace': 'Crystal Palace',
      'Nottm Forest': 'Nottingham Forest'
    };
    
    return teamMapping[teamName] || teamName;
  }

  async getLatestOdds(): Promise<any> {
    return this.lastOddsData;
  }

  async getMatchOdds(homeTeam: string, awayTeam: string): Promise<any> {
    if (!this.lastOddsData) {
      await this.monitorOdds();
    }
    
    const match = this.lastOddsData?.matches.find((m: any) => 
      m.homeTeam === homeTeam && m.awayTeam === awayTeam
    );
    
    return match || null;
  }

  /**
   * Get current odds for a match by ID
   */
  async getCurrentOdds(matchId: string): Promise<any> {
    if (!this.lastOddsData) {
      await this.monitorOdds();
    }
    
    // Try to find by matchId or fallback to first available match
    const match = this.lastOddsData?.matches?.find((m: any) => m.matchId === matchId) || 
                  this.lastOddsData?.matches?.[0];
    
    return match ? {
      homeOdds: match.homeOdds,
      awayOdds: match.awayOdds,
      asianHandicap: match.asianHandicap,
      timestamp: this.lastOddsData.timestamp
    } : null;
  }

  getMonitoringStatus(): any {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastOddsData?.timestamp || null,
      matchCount: this.lastOddsData?.matches?.length || 0,
      enabled: this.configService.get('ENABLE_ODDS_MONITORING', true)
    };
  }

}