import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { chromium, BrowserContext, Page } from 'playwright';
import { DataFileService } from '../core/data-file.service';
import { DATA_FILE_SERVICE } from './tokens';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

@Injectable()
export class OddsMonitorService {
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private isRunning = false;
  private lastOddsData: any = null;
  private fileWatcher: chokidar.FSWatcher;
  private readonly logPrefix = '[OddsMonitorService]';
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    @Inject(DATA_FILE_SERVICE) private dataFileService: DataFileService
  ) {}

  async onModuleInit() {
    console.log(`${this.logPrefix} 📊 Odds Monitor Service initialized - FILE-BASED MODE`);
    
    // Initialize with empty odds data first (immediate)
    this.lastOddsData = {
      timestamp: Date.now(),
      matches: [],
      source: 'hkjc',
      totalMatches: 0
    };
    
    // Write initial empty odds data to file
    await this.dataFileService.writeFile('odds-data.json', this.lastOddsData);
    
    console.log(`${this.logPrefix} 📊 Odds Monitor ready - will scrape real HKJC data`);
    
    // Initialize browser with delay to prevent startup conflicts, then start monitoring
    setTimeout(async () => {
      try {
        console.log(`${this.logPrefix} 📊 Starting odds monitor browser initialization...`);
        await this.initializeBrowser();
        
        // Start monitoring immediately after browser is ready
        const systemConfig = this.dataFileService.getSystemConfig();
        console.log(`${this.logPrefix} 📊 ${systemConfig.mockMode ? 'Mock' : 'Real'} mode detected - starting odds monitoring from HKJC`);
        await this.monitorOdds();
      } catch (error) {
        console.error(`${this.logPrefix} ❌ Delayed odds monitor initialization failed:`, error);
      }
    }, 1000); // 1 second delay to start first
    
    // Set up file watcher for triggers
    this.setupFileWatcher();
  }

  private setupFileWatcher() {
    // Watch for fixtures to determine when to monitor odds
    this.fileWatcher = chokidar.watch('./data/v2/fixtures.json');
    this.fileWatcher.on('change', async () => {
      console.log(`${this.logPrefix} 📊 Fixtures updated, checking for trading window matches...`);
      await this.checkTradingWindowMatches();
    });
  }

  private async checkTradingWindowMatches() {
    try {
      const fixtures = await this.dataFileService.getFixtures();
      const now = new Date();
      
      // Check for matches in trading window (5-10 minutes from kickoff)
      const tradingWindowMatches = fixtures.filter((fixture: any) => {
        const kickoff = new Date(fixture.kickoffTime);
        const timeDiff = kickoff.getTime() - now.getTime();
        const minutesUntilKickoff = timeDiff / (1000 * 60);
        return minutesUntilKickoff >= 5 && minutesUntilKickoff <= 10;
      });
      
      if (tradingWindowMatches.length > 0) {
        console.log(`${this.logPrefix} 📊 ${tradingWindowMatches.length} matches in trading window, monitoring odds...`);
        await this.monitorOdds();
      }
    } catch (error) {
      console.error(`${this.logPrefix} ❌ Error checking trading window matches:`, error);
    }
  }

  async onModuleDestroy() {
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
    // Don't close browser - let it persist for continuous operation
    console.log(`${this.logPrefix} 📊 Odds Monitor shutdown (browser kept alive)`);
  }

  @Cron('0 */1 * * * *') // Every minute during live trading hours
  async scheduledOddsMonitor() {
    const interval = this.configService.get('ODDS_MONITOR_INTERVAL', 60000);
    
    // Only run during trading hours (adjust as needed)
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 8 && hour <= 23) { // 8 AM to 11 PM
      await this.monitorOdds();
    }
  }

  async monitorOdds(): Promise<any> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`${this.logPrefix} 📊 Monitoring HKJC odds...`);
    
    try {
      await this.initializeBrowser();
      const oddsData = await this.scrapeCurrentOdds();
      
      if (oddsData && oddsData.matches.length > 0) {
        await this.saveOddsData(oddsData);
        await this.detectOddsChanges(oddsData);
        this.lastOddsData = oddsData;
        
        // Write updated odds to file for other services
        await this.dataFileService.writeFile('odds-data.json', oddsData);
      }
      
      return oddsData;
    } catch (error) {
      console.error(`${this.logPrefix} ❌ Odds monitoring failed:`, error);
      throw error;
    } finally {
      this.isRunning = false;
      // DON'T close browser - keep it persistent for continuous operation
      console.log(`${this.logPrefix} ✅ Odds monitoring completed, browser kept alive for next run`);
    }
  }

  private async initializeBrowser() {
    // Only initialize once to prevent multiple browser instances
    if (this.isInitialized && this.browser && this.page) {
      console.log(`${this.logPrefix} ♻️ Reusing existing odds monitor browser instance`);
      return;
    }
    
    if (this.isInitialized) {
      console.log(`${this.logPrefix} ⏳ Browser initialization already in progress, skipping...`);
      return;
    }
    
    this.isInitialized = true;
    
    // Get browser configuration from injected data service (respects mock mode)
    const browserConfig = this.dataFileService.getBrowserConfig();
    console.log(`${this.logPrefix} 📊 Odds Monitor Browser config: headless=${browserConfig.headless}`);
    
    // Use COMPLETELY ISOLATED browser context for odds monitoring
    const userDataDir = './data/v2/browser-odds-monitor';
    const fs = require('fs');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    
    console.log(`${this.logPrefix} 📊 Creating ISOLATED odds monitoring browser (separate process from betting)...`);
    
    try {
      this.browser = await chromium.launchPersistentContext(userDataDir, {
        headless: browserConfig.headless,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--remote-debugging-port=9225', // UNIQUE port for odds monitor (not 9222!)
          '--force-device-scale-factor=1',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--user-agent=OddsMonitor-Process'
        ],
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        acceptDownloads: false,
        bypassCSP: true
      });
      
      // Use the default page from persistent context
      const pages = this.browser.pages();
      this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();
      
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 OddsMonitor-Isolated'
      });
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      
      console.log(`${this.logPrefix} ✅ ISOLATED odds monitor browser initialized (port 9225, profile: browser-odds-monitor)`);
    } catch (error) {
      console.error(`${this.logPrefix} ❌ Browser initialization failed:`, error);
      this.isInitialized = false; // Reset flag so we can try again
      throw error;
    }
  }

  private async scrapeCurrentOdds(): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');

    // Get HKJC URLs from injected data service (respects mock/real mode)
    const urlConfig = this.dataFileService.getHKJCUrls();
    const url = urlConfig.url;
    console.log(`${this.logPrefix} 📊 Using ${urlConfig.mockMode ? 'MOCK' : 'REAL'} mode URL: ${url} URL configured`);
    console.log(`${this.logPrefix} 📊 Configuration: timeout=${urlConfig.timeout}ms, retryAttempts=${urlConfig.retryAttempts}`);
    
    let pageLoaded = false;
    try {
      console.log(`${this.logPrefix} 📊 Trying HKJC URL: ${url}`);
      await this.page.goto(url, { 
        timeout: urlConfig.timeout || 30000,
        waitUntil: 'networkidle'
      });
      pageLoaded = true;
      console.log(`${this.logPrefix} ✅ Successfully loaded: ${url}`);
    } catch (error) {
      console.log(`${this.logPrefix} ❌ Failed to load ${url}: ${(error as Error).message}`);
    }
    
    if (!pageLoaded) {
      throw new Error('Could not load any HKJC URL');
    }
    
    // Wait for dynamic content to load and fixtures to appear
    console.log(`${this.logPrefix} ⏳ Waiting for fixtures to appear...`);
    await this.waitForFixturesToLoad();
    
    // Use improved DOM-based scraping method
    const matches = await this.scrapeMatchesFromDOM();

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

  private async waitForFixturesToLoad(): Promise<void> {
    const maxWaitTime = 60000; // 1 minute max wait
    const checkInterval = 2000; // Check every 2 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if match rows exist
        const matchCount = await this.page.$$eval('.match-row', (elements) => elements.length);
        
        if (matchCount > 0) {
          console.log(`${this.logPrefix} ✅ Found ${matchCount} fixture rows`);
          
          // Wait a bit more for odds to load
          await this.page.waitForTimeout(3000);
          
          // Verify odds are loaded by checking for handicap data
          const oddsLoaded = await this.page.$$eval('.match-row', (elements) => {
            return elements.some(el => {
              const text = el.textContent || '';
              return text.includes('[') && text.includes(']') && /\d+\.\d+/.test(text);
            });
          });
          
          if (oddsLoaded) {
            console.log(`${this.logPrefix} ✅ Odds data loaded successfully`);
            return;
          }
        }
        
        console.log(`${this.logPrefix} ⏳ Waiting for fixtures to appear...`);
        await this.page.waitForTimeout(checkInterval);
      } catch (error) {
        console.log(`${this.logPrefix} ⚠️ Error checking fixtures:`, (error as Error).message);
        await this.page.waitForTimeout(checkInterval);
      }
    }
    
    throw new Error('Fixtures did not appear within the expected time frame');
  }

  private async scrapeMatchesFromDOM(): Promise<any[]> {
    console.log(`${this.logPrefix} 🔍 Scraping matches using DOM-based method...`);
    
    // Debug: Check what elements are actually available
    const pageHTML = await this.page.content();
    console.log(`${this.logPrefix} 🔍 Page HTML length: ${pageHTML.length} characters`);
    
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
        const elements = await this.page.$$(selector);
        console.log(`${this.logPrefix} 🔍 Selector "${selector}": found ${elements.length} elements`);
        
        if (elements.length > 0) {
          // Check if these elements contain match-like data
          const hasMatchData = await this.page.$$eval(selector, (elements) => {
            return elements.some(el => {
              const text = el.textContent || '';
              return text.includes('[') && text.includes(']') && /\d+\.\d+/.test(text);
            });
          });
          
          if (hasMatchData) {
            matchElements = elements;
            usedSelector = selector;
            console.log(`${this.logPrefix} ✅ Found match data using selector: "${selector}"`);
            break;
          }
        }
      } catch (error) {
        console.log(`${this.logPrefix} ❌ Selector "${selector}" failed: ${(error as Error).message}`);
      }
    }
    
    if (matchElements.length === 0) {
      console.log(`${this.logPrefix} ❌ No match elements found with any selector`);
      return [];
    }
    
    const matches = await this.page.$$eval(usedSelector, (elements) => {
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
        
        console.log(`\n--- Parsing element with ID: ${element.id || 'NO_ID'} ---`);
        
        // Extract match ID from element ID (HDC_FB3224 -> FB3224)
        const matchId = element.id;
        if (matchId && matchId.startsWith('HDC_')) {
          match.id = matchId.replace('HDC_', '');
          console.log(`Extracted match ID: ${match.id}`);
        }
        
        // Extract date - look for date/time patterns
        const dateSelectors = ['.date', 'td:first-child', 'div:first-child'];
        for (const selector of dateSelectors) {
          const dateElement = element.querySelector(selector);
          if (dateElement) {
            const dateText = dateElement.textContent?.trim();
            console.log(`Found date element "${selector}": "${dateText}"`);
            if (dateText && /\d{2}\/\d{2}\/\d{4}/.test(dateText)) {
              match.date = dateText;
              console.log(`Set match date: ${match.date}`);
              break;
            }
          }
        }
        
        // Extract team names - try multiple approaches
        console.log(`Looking for team names...`);
        
        // Method 1: .team div[title="All Odds"] structure
        const teamContainer = element.querySelector('.team div[title="All Odds"]');
        if (teamContainer) {
          const teamDivs = teamContainer.querySelectorAll('div');
          console.log(`Found ${teamDivs.length} team divs in .team container`);
          if (teamDivs.length >= 2) {
            match.homeTeam = teamDivs[0].textContent?.trim() || null;
            match.awayTeam = teamDivs[1].textContent?.trim() || null;
            console.log(`Teams from .team container: "${match.homeTeam}" vs "${match.awayTeam}"`);
          }
        }
        
        // Method 2: Look for any team-like content if method 1 failed
        if (!match.homeTeam || !match.awayTeam) {
          console.log(`Team container method failed, trying alternative approaches...`);
          
          // Look for text content that might contain team names
          const fullText = element.textContent || '';
          console.log(`Full element text: "${fullText.substring(0, 200)}..."`);
          
          // Try to find known team patterns
          const teamPatterns = [
            /Chelsea.*?Paris Saint Germain/,
            /Hacken.*?/,
            /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+\.\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
          ];
          
          for (const pattern of teamPatterns) {
            const match_pattern = fullText.match(pattern);
            if (match_pattern) {
              console.log(`Found team pattern match:`, match_pattern);
              // This would need custom logic per pattern
            }
          }
        }
        
        // Extract handicap and odds from .oddsLine structure
        console.log(`Looking for odds line...`);
        const oddsLine = element.querySelector('.oddsLine.HDC');
        if (oddsLine) {
          console.log(`Found .oddsLine.HDC element`);
          const oddsItems = oddsLine.querySelectorAll('.hdcOddsItem');
          console.log(`Found ${oddsItems.length} .hdcOddsItem elements`);
          
          if (oddsItems.length >= 2) {
            // First item is home team ([+0.5/+1] 1.95)
            const homeItem = oddsItems[0];
            const homeCondElement = homeItem.querySelector('.cond');
            const homeOddsElement = homeItem.querySelector('.add-to-slip');
            
            // Second item is away team ([-0.5/-1] 1.85)
            const awayItem = oddsItems[1];
            const awayOddsElement = awayItem.querySelector('.add-to-slip');
            
            console.log(`Home cond: "${homeCondElement?.textContent?.trim()}", odds: "${homeOddsElement?.textContent?.trim()}"`);
            console.log(`Away odds: "${awayOddsElement?.textContent?.trim()}"`);
            
            if (homeCondElement && homeOddsElement && awayOddsElement) {
              // Parse handicap from home condition [+0.5/+1] -> 0.75
              const handicapText = homeCondElement.textContent?.trim();
              if (handicapText) {
                const cleanHandicap = handicapText.replace(/[\[\]]/g, '');
                match.handicap = parseHandicap(cleanHandicap);
                console.log(`Parsed handicap: "${handicapText}" -> ${match.handicap}`);
              }
              
              // Parse odds
              const homeOddsText = homeOddsElement.textContent?.trim();
              const awayOddsText = awayOddsElement.textContent?.trim();
              
              if (homeOddsText && awayOddsText) {
                match.homeOdds = parseFloat(homeOddsText);
                match.awayOdds = parseFloat(awayOddsText);
                console.log(`Parsed odds: home=${match.homeOdds}, away=${match.awayOdds}`);
              }
            }
          }
        } else {
          console.log(`No .oddsLine.HDC found, trying fallback odds extraction...`);
          
          // Fallback: use the general odds extraction method
          const oddsData = extractOddsFromElement(element);
          if (oddsData) {
            match.handicap = oddsData.handicap;
            match.homeOdds = oddsData.homeOdds;
            match.awayOdds = oddsData.awayOdds;
            console.log(`Fallback extraction: handicap=${match.handicap}, home=${match.homeOdds}, away=${match.awayOdds}`);
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
        
        console.log(`Final match data:`, {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          handicap: match.handicap,
          homeOdds: match.homeOdds,
          awayOdds: match.awayOdds,
          date: match.date,
          isValid: !!(match.homeTeam && match.awayTeam && match.homeOdds && match.awayOdds)
        });
        
        // Validate match data - must have teams and odds
        if (match.homeTeam && match.awayTeam && match.homeOdds && match.awayOdds) {
          return match;
        }
        
        console.log(`Match validation failed - missing required data`);
        return null;
      };
      
      // Process each match element
      elements.forEach((element, index) => {
        try {
          // Skip invisible elements
          if (element.offsetParent === null) return;
          
          console.log(`Processing element ${index + 1}/${elements.length}`);
          
          // Debug: Show element content
          const elementText = element.textContent || '';
          console.log(`Element text preview: "${elementText.substring(0, 200)}..."`);
          
          // Extract data using DOM structure instead of string splitting
          const match = parseMatchElement(element);
          
          console.log(`Parsed match data:`, {
            id: match?.id,
            homeTeam: match?.homeTeam,
            awayTeam: match?.awayTeam,
            handicap: match?.handicap,
            homeOdds: match?.homeOdds,
            awayOdds: match?.awayOdds,
            isValid: !!match
          });
          
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
          console.log(`${this.logPrefix} ❌ Error parsing match element ${index}:`, (error as Error).message);
        }
      });
      
      return results;
    });
    
    console.log(`${this.logPrefix} ✅ Successfully scraped ${matches.length} matches`);
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
    console.log(`${this.logPrefix} 💾 Saved ${oddsData.matches.length} matches to odds-movement/${filename}`);
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
      console.log(`${this.logPrefix} 🔄 Detected ${changes.length} odds changes:`, 
        changes.map(c => `${c.match}: H${c.homeOdds.change > 0 ? '+' : ''}${c.homeOdds.change.toFixed(3)}, A${c.awayOdds.change > 0 ? '+' : ''}${c.awayOdds.change.toFixed(3)}`).join(', ')
      );
      
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