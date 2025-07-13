import { Injectable } from '@nestjs/common';
import { chromium, BrowserContext, Page } from 'playwright';
import moment from 'moment';
import _ from 'lodash';
import { hkjc_login, hkjc_logout } from '../../parsers/others/hkjc-util.js';

export interface HKJCCredentials {
  username: string;
  password: string;
  answers: Record<string, string>;
}

export interface MatchOdds {
  homeOdds: number;
  awayOdds: number;
  handicap: number;
  timestamp: Date;
}

export interface FixtureData {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: Date;
  league: string;
}

@Injectable()
export class HkjcBrowserService {
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;
  private mockMode = false; // REAL MODE - enable browser automation

  async initialize() {
    console.log(`🔍 HKJC browser service - ${this.mockMode ? 'MOCK MODE' : 'REAL MODE'} ENABLED`);
    
    // Skip real browser initialization in mock mode
    if (this.mockMode) {
      console.log('✅ HKJC browser service initialized in MOCK MODE');
      return;
    }

    // Create ISOLATED browser instance with unique profile and port
    const userDataDir = './data/v2/browser-hkjc-service';
    const fs = require('fs');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    console.log('🔍 Creating ISOLATED HKJC browser service (separate from betting and odds)...');

    this.browser = await chromium.launchPersistentContext(userDataDir, { 
      headless: false,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--remote-debugging-port=9226', // UNIQUE port for HKJC service
        '--user-agent=HKJCService-Process',
        '--disable-background-timer-throttling'
      ],
      viewport: { width: 1080, height: 1080 },
      ignoreHTTPSErrors: true,
      acceptDownloads: false,
      bypassCSP: true
    });
    
    // Use the default page from persistent context or create a new one
    const pages = this.browser.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();
    await this.page.setViewportSize({ width: 1080, height: 1080 });
    
    console.log('✅ ISOLATED HKJC browser service initialized (port 9226, profile: browser-hkjc-service)');
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Enhanced login based on hkjc-util.ts pattern
  async login(credentials: HKJCCredentials): Promise<boolean> {
    if (this.mockMode) {
      console.log('🔐 MOCK LOGIN - Simulating HKJC login...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      this.isLoggedIn = true;
      console.log('✅ MOCK LOGIN - Successfully logged in to HKJC');
      return true;
    }

    if (!this.page) throw new Error('Browser not initialized');
    try {
      console.log('🔐 Logging in to HKJC using standardized hkjc_login utility...');
      await hkjc_login(this.page, credentials);
      this.isLoggedIn = true;
      return true;
    } catch (error) {
      console.error('❌ HKJC login failed:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    if (!this.page || !this.isLoggedIn) return;
    try {
      console.log('🔐 Logging out from HKJC using standardized hkjc_logout utility...');
      await hkjc_logout(this.page);
      this.isLoggedIn = false;
      console.log('🔐 Logged out from HKJC');
    } catch (error) {
      console.error('❌ HKJC logout failed:', error);
    }
  }

  // Enhanced fixture scraping based on scrap-hkjc-match-schedule.spec.ts pattern
  async scrapeTodaysFixtures(): Promise<FixtureData[]> {
    if (this.mockMode) {
      return this.getMockFixtures();
    }

    if (!this.page) throw new Error('Browser not initialized');
    
    const fixtures: FixtureData[] = [];
    const today = moment();
    const tomorrow = moment().add(1, 'day');
    
    try {
      await this.page.goto('https://bet.hkjc.com/en/football/home');
      await this.page.getByRole('button', { name: 'Results/Dividend' }).click();
      await this.page.getByRole('button', { name: 'Match Results' }).click();
      await this.page.locator('header').filter({ hasText: 'Search' }).locator('div').nth(1).click();
      
      // Set date range for today and tomorrow
      await this.setDateRange(today, tomorrow);
      
      // EPL teams mapping from our codebase (copied from tests but now ours)
      const eplTeams = {
        'arsenal': 'Arsenal(阿仙奴)',
        'aston villa': 'Aston Villa(阿士東維拉)',
        'bournemouth': 'Bournemouth(般尼茅夫)',
        'brentford': 'Brentford(賓福特)',
        'brighton': 'Brighton(白禮頓)',
        'chelsea': 'Chelsea(車路士)',
        'crystal palace': 'Crystal Palace(水晶宮)',
        'everton': 'Everton(愛華頓)',
        'fulham': 'Fulham(富咸)',
        'ipswich': 'Ipswich(葉士域治)',
        'leicester': 'Leicester(李斯特城)',
        'liverpool': 'Liverpool(利物浦)',
        'manchester city': 'Manchester City(曼城)',
        'manchester utd': 'Manchester Utd(曼聯)',
        'newcastle': 'Newcastle(紐卡素)',
        'nottingham forest': 'Nottingham Forest(諾定咸森林)',
        'southampton': 'Southampton(修咸頓)',
        'tottenham': 'Tottenham(熱刺)',
        'west ham': 'West Ham(韋斯咸)',
        'wolves': 'Wolves(狼隊)',
      };
      
      for (const [teamKey, teamName] of Object.entries(eplTeams)) {
        await this.page.locator('#FBFilterSelectDrd').click();
        await this.page.getByPlaceholder('Search Team').fill(teamKey);
        await this.page.getByTitle(teamName).click();
        await this.page.getByRole('button', { name: 'Search' }).click();
        
        const tables = await this.page.locator('.table-row');
        const validLinks = await tables.filter({ has: this.page.getByTitle('Eng Premier') });
        const count = await validLinks.count();
        
        for (let i = 0; i < count; i++) {
          const linkText = await validLinks.nth(i).innerText();
          const arr = linkText.split(/\s+/);
          const matchDate = arr[0];
          const matchId = arr[1];
          
          // Parse kickoff time
          const kickoffTime = moment(matchDate, 'DD/MM/YYYY').toDate();
          
          // Extract team names from link text (simplified)
          const homeTeam = teamKey === 'arsenal' ? 'Arsenal' : teamKey; // This would need proper parsing
          const awayTeam = 'TBD'; // This would need proper parsing from match details
          
          const fixture: FixtureData = {
            matchId,
            homeTeam,
            awayTeam,
            kickoffTime,
            league: 'EPL'
          };
          
          fixtures.push(fixture);
        }
        
        await this.page.waitForTimeout(500 + _.random(0, 500));
      }
      
      return fixtures;
    } catch (error) {
      console.error('❌ Error scraping fixtures:', error);
      return [];
    }
  }

  // Enhanced odds scraping based on scrap-hkjc-result.spec.ts pattern
  async scrapeMatchOdds(matchId: string): Promise<MatchOdds | null> {
    if (this.mockMode) {
      return this.getMockOdds(matchId);
    }

    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      // Navigate to specific match
      await this.page.goto(`https://bet.hkjc.com/en/football/match/${matchId}`);
      
      let retries = 5;
      let oddsText = '';
      
      while (retries > 0) {
        await this.page.waitForTimeout(1000);
        try {
          oddsText = await this.page.locator('section.LAST_ODDS').first().innerText();
          if (oddsText.includes('Home/Away/Draw')) {
            break;
          }
        } catch (error) {
          console.warn('Retrying odds scraping:', error);
        }
        retries--;
      }
      
      return this.parseOddsText(oddsText);
    } catch (error) {
      console.error('❌ Error scraping odds:', error);
      return null;
    }
  }

  // Enhanced betting based on hkjc-util.ts pattern
  async placeBet(matchId: string, decision: 'home' | 'away', amount: number = 200): Promise<boolean> {
    if (this.mockMode) {
      console.log(`💰 MOCK BET - Placing ${decision} bet of $${amount} on ${matchId}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      console.log(`✅ MOCK BET - Bet placed successfully: ${decision} $${amount} on ${matchId}`);
      return true;
    }

    if (!this.page || !this.isLoggedIn) {
      console.error('❌ Cannot place bet: not logged in');
      return false;
    }
    
    try {
      await this.page.goto(`https://bet.hkjc.com/en/football/match/${matchId}`);
      
      // Find Asian Handicap section and select home/away
      const handicapSection = await this.page.locator('.asian-handicap');
      
      if (decision === 'home') {
        await handicapSection.locator('input[type="checkbox"]').first().check();
      } else {
        await handicapSection.locator('input[type="checkbox"]').nth(1).check();
      }
      
      await this.page.getByText('Add').first().click();
      await this.page.waitForTimeout(1000);
      
      // Set bet amount
      await this.page.getByRole('textbox').dblclick();
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('textbox').fill(amount.toString());
      
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('button', { name: 'Place Bet' }).click();
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('button', { name: 'Confirm' }).click();
      await this.page.waitForTimeout(1000);
      
      await this.page.getByText('Done');
      await this.page.getByRole('button', { name: 'Done' }).click();
      
      console.log(`✅ Bet placed: ${decision} ${amount} on ${matchId}`);
      return true;
    } catch (error) {
      console.error('❌ Bet placement failed:', error);
      return false;
    }
  }

  private async setDateRange(startDate: moment.Moment, endDate: moment.Moment) {
    if (!this.page) return;
    
    const year = startDate.format('YYYY');
    const month = startDate.format('MMMM');
    const startDay = startDate.format('D');
    const endDay = endDate.format('D');
    
    await this.page.locator('.date-dd-arrow').click();
    await this.page.locator('.dateRangePickerYear').first().click();
    await this.page.locator('.monthDropdown').getByText(year).click();
    await this.page.locator('.dateRangePickerMonth').first().click();
    await this.page.locator('.monthDropdown').getByText(month).click();
    await this.page.locator('.datePickerDay').getByText(startDay, { exact: true }).first().click();
    await this.page.locator('.datePickerDay').getByText(endDay, { exact: true }).last().click();
  }

  private parseOddsText(oddsText: string): MatchOdds | null {
    try {
      // Parse odds text into structured format
      // This is a simplified parser - would need enhancement for production
      const lines = oddsText.split('\n');
      
      // Extract handicap and odds (simplified parsing)
      const homeOdds = 1.95; // Would parse from actual text
      const awayOdds = 1.95; // Would parse from actual text
      const handicap = 0.5;  // Would parse from actual text
      
      return {
        homeOdds,
        awayOdds,
        handicap,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error parsing odds:', error);
      return null;
    }
  }

  // Mock data methods for simulation
  private getMockFixtures(): FixtureData[] {
    const now = new Date();
    const fixtures: FixtureData[] = [];
    
    // Generate fixtures for the next few hours to simulate continuous matches
    const teams = [
      ['Arsenal', 'Liverpool'], 
      ['Manchester City', 'Chelsea'], 
      ['Brighton', 'Manchester Utd'],
      ['Tottenham', 'Newcastle'],
      ['Aston Villa', 'West Ham'],
      ['Crystal Palace', 'Everton']
    ];
    
    teams.forEach((teamPair, index) => {
      const kickoffTime = new Date(now.getTime() + (index * 15 * 60 * 1000)); // Every 15 minutes
      fixtures.push({
        matchId: `MOCK_${Date.now()}_${index}`,
        homeTeam: teamPair[0],
        awayTeam: teamPair[1],
        kickoffTime,
        league: 'EPL'
      });
    });
    
    return fixtures;
  }

  private getMockOdds(matchId: string): MatchOdds {
    // Generate realistic odds based on matchId
    const baseHomeOdds = 1.80 + (Math.random() * 0.4); // 1.80 - 2.20
    const baseAwayOdds = 1.80 + (Math.random() * 0.4); // 1.80 - 2.20
    const handicap = (Math.random() - 0.5) * 2; // -1.0 to 1.0
    
    return {
      homeOdds: Math.round(baseHomeOdds * 100) / 100,
      awayOdds: Math.round(baseAwayOdds * 100) / 100,
      handicap: Math.round(handicap * 4) / 4, // Quarter increments
      timestamp: new Date()
    };
  }
}