import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { eventBus } from '../coordinator/EventBus';

export interface OddsSnapshot {
  id: string;
  home: string;
  away: string;
  date: string;
  ahHome: number;
  ahAway: number;
  oddsHome: number;
  oddsAway: number;
  homeScore?: string;
  awayScore?: string;
  totalCorner?: string;
  live?: string;
  ts: number;
  rawData?: any;
}

export interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  currentOdds: {
    homeHandicap: number;
    awayHandicap: number;
    homeOdds: number;
    awayOdds: number;
  };
  isLive: boolean;
  status: string;
}

/**
 * Enhanced HKJC Odds Monitor with improved scraping reliability
 */
export class OddsMonitor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private dataDir: string;
  private lastOddsSnapshot: Map<string, OddsSnapshot> = new Map();

  // Team mapping from HKJC Chinese to English names
  private readonly teamMapping: Record<string, string> = {
    "Arsenal(阿仙奴)": "Arsenal",
    "Aston Villa(阿士東維拉)": "Aston Villa", 
    "Bournemouth(般尼茅夫)": "Bournemouth",
    "Brentford(賓福特)": "Brentford",
    "Brighton(白禮頓)": "Brighton",
    "Chelsea(車路士)": "Chelsea",
    "Crystal Palace(水晶宮)": "Crystal Palace",
    "Everton(愛華頓)": "Everton",
    "Fulham(富咸)": "Fulham",
    "Ipswich(葉士域治)": "Ipswich",
    "Leicester(李斯特城)": "Leicester",
    "Liverpool(利物浦)": "Liverpool",
    "Manchester City(曼城)": "Manchester City",
    "Manchester Utd(曼聯)": "Manchester Utd",
    "Newcastle(紐卡素)": "Newcastle",
    "Nottingham Forest(諾定咸森林)": "Nottingham Forest",
    "Southampton(修咸頓)": "Southampton",
    "Tottenham(熱刺)": "Tottenham",
    "West Ham(韋斯咸)": "West Ham",
    "Wolves(狼隊)": "Wolves"
  };

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDirectories();
    
    // Register module status
    eventBus.emitModuleStatus({
      moduleName: 'OddsMonitor',
      status: 'offline',
      message: 'Initialized but not started'
    });
  }

  private ensureDirectories(): void {
    const dirs = [
      'data/odds-movement',
      'data/live'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Start the odds monitoring service
   */
  public async start(intervalMs: number = 30000): Promise<void> {
    if (this.isRunning) {
      console.log('OddsMonitor is already running');
      return;
    }

    try {
      await this.initializeBrowser();
      this.isRunning = true;
      
      eventBus.emitModuleStatus({
        moduleName: 'OddsMonitor',
        status: 'online',
        message: `Started monitoring with ${intervalMs}ms interval`
      });

      // Initial scan
      await this.scanOdds();
      
      // Set up periodic scanning
      this.monitorInterval = setInterval(async () => {
        try {
          await this.scanOdds();
        } catch (error) {
          console.error('Error in periodic odds scan:', error);
          eventBus.emitSystemAlert({
            severity: 'error',
            message: 'Failed periodic odds scan',
            details: error,
            source: 'OddsMonitor'
          });
        }
      }, intervalMs);

      console.log(`OddsMonitor started with ${intervalMs}ms interval`);
    } catch (error) {
      eventBus.emitModuleStatus({
        moduleName: 'OddsMonitor',
        status: 'error',
        message: 'Failed to start',
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Stop the odds monitoring service
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    eventBus.emitModuleStatus({
      moduleName: 'OddsMonitor',
      status: 'offline',
      message: 'Stopped monitoring'
    });

    console.log('OddsMonitor stopped');
  }

  /**
   * Initialize browser with improved reliability
   */
  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('Browser initialized for odds monitoring');
  }

  /**
   * Scan current odds from HKJC
   */
  private async scanOdds(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('Scanning odds from HKJC...');
      
      // Navigate to HKJC football page
      await this.page.goto('https://bet.hkjc.com/en/football/home', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for page to load properly
      await this.page.waitForTimeout(3000);

      // Look for EPL matches
      const matches = await this.extractMatches();
      
      if (matches.length === 0) {
        console.log('No EPL matches found');
        return;
      }

      console.log(`Found ${matches.length} EPL matches`);

      // Process each match
      for (const match of matches) {
        await this.processMatch(match);
      }

      // Save current snapshot
      await this.saveCurrentSnapshot(matches);

    } catch (error) {
      console.error('Error scanning odds:', error);
      eventBus.emitSystemAlert({
        severity: 'error',
        message: 'Failed to scan odds',
        details: error,
        source: 'OddsMonitor'
      });
      throw error;
    }
  }

  /**
   * Extract match data from HKJC page with improved selectors
   */
  private async extractMatches(): Promise<MatchData[]> {
    if (!this.page) return [];

    try {
      // Wait for the main content to load
      await this.page.waitForSelector('.match-container, .event-container, .coupon-container', { timeout: 10000 });

      // Try multiple selector strategies for better reliability
      const matches = await this.page.evaluate(() => {
        const matchElements = document.querySelectorAll('.coupon-container .event-container, .match-row, .coupon-row');
        const extractedMatches: any[] = [];

        matchElements.forEach((element, index) => {
          try {
            // Extract team names - try multiple selector patterns
            let homeTeam = '';
            let awayTeam = '';
            
            // Strategy 1: Look for team name elements
            const teamElements = element.querySelectorAll('.team-name, .team, .participant');
            if (teamElements.length >= 2) {
              homeTeam = teamElements[0].textContent?.trim() || '';
              awayTeam = teamElements[1].textContent?.trim() || '';
            }

            // Strategy 2: Look for vs pattern in text
            if (!homeTeam || !awayTeam) {
              const matchText = element.textContent || '';
              const vsMatch = matchText.match(/(.+?)\s+vs?\s+(.+?)(?:\s|$)/i);
              if (vsMatch) {
                homeTeam = vsMatch[1].trim();
                awayTeam = vsMatch[2].trim();
              }
            }

            // Extract odds - multiple selector strategies
            let homeOdds = 0;
            let awayOdds = 0;
            let homeHandicap = 0;
            let awayHandicap = 0;

            // Look for Asian Handicap odds
            const oddsElements = element.querySelectorAll('.odds, .price, .decimal-odds');
            const handicapElements = element.querySelectorAll('.handicap, .line, .spread');

            if (oddsElements.length >= 2) {
              homeOdds = parseFloat(oddsElements[0].textContent?.trim() || '0');
              awayOdds = parseFloat(oddsElements[1].textContent?.trim() || '0');
            }

            if (handicapElements.length >= 2) {
              const homeHandicapText = handicapElements[0].textContent?.trim() || '0';
              const awayHandicapText = handicapElements[1].textContent?.trim() || '0';
              
              homeHandicap = this.parseHandicap(homeHandicapText);
              awayHandicap = this.parseHandicap(awayHandicapText);
            }

            // Extract match ID
            let matchId = `MATCH_${index}_${Date.now()}`;
            const idElement = element.querySelector('[data-id], [data-match-id], .match-id');
            if (idElement) {
              matchId = idElement.getAttribute('data-id') || 
                       idElement.getAttribute('data-match-id') || 
                       idElement.textContent?.trim() || matchId;
            }

            // Extract kickoff time
            let kickoffTime = '';
            const timeElement = element.querySelector('.kick-off, .time, .match-time');
            if (timeElement) {
              kickoffTime = timeElement.textContent?.trim() || '';
            }

            // Only include if we have valid team names and odds
            if (homeTeam && awayTeam && homeOdds > 0 && awayOdds > 0) {
              extractedMatches.push({
                id: matchId,
                homeTeam,
                awayTeam,
                kickoffTime,
                currentOdds: {
                  homeHandicap,
                  awayHandicap,
                  homeOdds,
                  awayOdds
                },
                isLive: element.classList.contains('live') || element.querySelector('.live-indicator') !== null,
                status: element.querySelector('.status')?.textContent?.trim() || 'scheduled'
              });
            }
          } catch (error) {
            console.warn('Error extracting match data:', error);
          }
        });

        return extractedMatches;
      });

      // Filter for EPL matches and normalize team names
      return matches
        .filter(match => this.isEPLMatch(match.homeTeam, match.awayTeam))
        .map(match => ({
          ...match,
          homeTeam: this.normalizeTeamName(match.homeTeam),
          awayTeam: this.normalizeTeamName(match.awayTeam)
        }));

    } catch (error) {
      console.error('Error extracting matches:', error);
      return [];
    }
  }

  /**
   * Parse handicap string to number
   */
  private parseHandicap(handicapText: string): number {
    if (!handicapText) return 0;
    
    // Handle common handicap formats
    const cleanText = handicapText.replace(/[^\d\-\+\.\/]/g, '');
    
    // Handle quarter handicaps like "0/+0.5" or "-0.5/-1"
    if (cleanText.includes('/')) {
      const parts = cleanText.split('/');
      const num1 = parseFloat(parts[0]);
      const num2 = parseFloat(parts[1]);
      return (num1 + num2) / 2;
    }
    
    return parseFloat(cleanText) || 0;
  }

  /**
   * Check if match is EPL
   */
  private isEPLMatch(homeTeam: string, awayTeam: string): boolean {
    const eplTeams = Object.values(this.teamMapping);
    const normalizedHome = this.normalizeTeamName(homeTeam);
    const normalizedAway = this.normalizeTeamName(awayTeam);
    
    return eplTeams.includes(normalizedHome) && eplTeams.includes(normalizedAway);
  }

  /**
   * Normalize team name from HKJC format to standard format
   */
  private normalizeTeamName(teamName: string): string {
    // Direct mapping lookup
    if (this.teamMapping[teamName]) {
      return this.teamMapping[teamName];
    }
    
    // Fuzzy matching for partial names
    for (const [hkjcName, englishName] of Object.entries(this.teamMapping)) {
      if (teamName.includes(englishName) || hkjcName.includes(teamName)) {
        return englishName;
      }
    }
    
    return teamName;
  }

  /**
   * Process individual match and emit events
   */
  private async processMatch(match: MatchData): Promise<void> {
    const matchKey = `${match.homeTeam}_vs_${match.awayTeam}`;
    const previousSnapshot = this.lastOddsSnapshot.get(matchKey);

    // Create current snapshot
    const currentSnapshot: OddsSnapshot = {
      id: match.id,
      home: match.homeTeam,
      away: match.awayTeam,
      date: new Date().toISOString().split('T')[0],
      ahHome: match.currentOdds.homeHandicap,
      ahAway: match.currentOdds.awayHandicap,
      oddsHome: match.currentOdds.homeOdds,
      oddsAway: match.currentOdds.awayOdds,
      live: match.isLive ? '1st' : 'pre',
      ts: Date.now()
    };

    // Store current snapshot
    this.lastOddsSnapshot.set(matchKey, currentSnapshot);

    // Check for odds changes
    if (previousSnapshot && this.hasOddsChanged(previousSnapshot, currentSnapshot)) {
      console.log(`Odds changed for ${match.homeTeam} vs ${match.awayTeam}`);
      
      // Emit odds update event
      eventBus.emitOddsUpdate({
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        kickoffTime: match.kickoffTime,
        odds: {
          homeOdds: currentSnapshot.oddsHome,
          awayOdds: currentSnapshot.oddsAway,
          homeHandicap: currentSnapshot.ahHome,
          awayHandicap: currentSnapshot.ahAway
        },
        previousOdds: {
          homeOdds: previousSnapshot.oddsHome,
          awayOdds: previousSnapshot.oddsAway,
          homeHandicap: previousSnapshot.ahHome,
          awayHandicap: previousSnapshot.ahAway
        }
      });
    }

    // Save to odds movement file
    await this.saveOddsMovement([currentSnapshot]);
  }

  /**
   * Check if odds have changed significantly
   */
  private hasOddsChanged(previous: OddsSnapshot, current: OddsSnapshot): boolean {
    const threshold = 0.01; // 1% change threshold
    
    return (
      Math.abs(previous.oddsHome - current.oddsHome) >= threshold ||
      Math.abs(previous.oddsAway - current.oddsAway) >= threshold ||
      Math.abs(previous.ahHome - current.ahHome) >= 0.25 ||
      Math.abs(previous.ahAway - current.ahAway) >= 0.25
    );
  }

  /**
   * Save odds movement data
   */
  private async saveOddsMovement(snapshots: OddsSnapshot[]): Promise<void> {
    const timestamp = Date.now();
    const filePath = path.join(this.dataDir, 'odds-movement', `${timestamp}.json`);
    
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(snapshots, null, 2));
    } catch (error) {
      console.error('Error saving odds movement:', error);
    }
  }

  /**
   * Save current snapshot for live data access
   */
  private async saveCurrentSnapshot(matches: MatchData[]): Promise<void> {
    const snapshot = {
      timestamp: Date.now(),
      lastUpdate: new Date().toISOString(),
      matches: matches.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        kickoffTime: match.kickoffTime,
        odds: match.currentOdds,
        isLive: match.isLive,
        status: match.status
      }))
    };

    const filePath = path.join(this.dataDir, 'live', 'current_odds.json');
    
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(snapshot, null, 2));
    } catch (error) {
      console.error('Error saving current snapshot:', error);
    }
  }

  /**
   * Get current odds for a specific match
   */
  public getCurrentOdds(homeTeam: string, awayTeam: string): OddsSnapshot | null {
    const matchKey = `${homeTeam}_vs_${awayTeam}`;
    return this.lastOddsSnapshot.get(matchKey) || null;
  }

  /**
   * Get all current odds
   */
  public getAllCurrentOdds(): OddsSnapshot[] {
    return Array.from(this.lastOddsSnapshot.values());
  }

  /**
   * Check if monitoring is running
   */
  public isMonitoring(): boolean {
    return this.isRunning;
  }
}