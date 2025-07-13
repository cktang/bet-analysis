import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class HkjcScrapingService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;

  async onModuleInit() {
    console.log('🔍 HKJC Scraping Service initialized');
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  @Cron('0 */30 * * * *') // Every 30 minutes
  async scrapeLiveOdds() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🎯 Starting HKJC odds scraping...');
    
    try {
      await this.initializeBrowser();
      await this.scrapeCurrentOdds();
      console.log('✅ HKJC odds scraping completed');
    } catch (error) {
      console.error('❌ HKJC scraping failed:', error);
    } finally {
      this.isRunning = false;
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    }
  }

  private async initializeBrowser() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  private async scrapeCurrentOdds() {
    if (!this.page) throw new Error('Browser not initialized');

    // Navigate to HKJC football page
    await this.page.goto('https://bet.hkjc.com/en/football');
    await this.page.waitForTimeout(3000);

    // Look for EPL matches
    const matches = await this.page.$$eval('.match-item', (elements) => {
      return elements.map(element => {
        const text = element.textContent || '';
        
        // Extract match details
        const teams = text.match(/([A-Za-z\s]+)\s+vs\s+([A-Za-z\s]+)/);
        const handicap = text.match(/([+-]?\d+\.?\d*)/);
        const odds = text.match(/\d+\.\d+/g);
        
        if (teams && handicap && odds) {
          return {
            homeTeam: teams[1].trim(),
            awayTeam: teams[2].trim(),
            handicap: parseFloat(handicap[1]),
            homeOdds: parseFloat(odds[0]),
            awayOdds: parseFloat(odds[1]),
            timestamp: Date.now()
          };
        }
        return null;
      }).filter(match => match !== null);
    });

    // Filter EPL matches
    const eplMatches = matches.filter(match => 
      this.isEPLTeam(match.homeTeam) && this.isEPLTeam(match.awayTeam)
    );

    // Save to odds-movement directory
    if (eplMatches.length > 0) {
      const timestamp = Date.now();
      const filename = `${timestamp}.json`;
      const filepath = path.join(process.cwd(), 'data', 'odds-movement', filename);
      
      const data = {
        timestamp,
        matches: eplMatches,
        source: 'hkjc'
      };
      
      await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
      console.log(`📊 Saved ${eplMatches.length} EPL matches to ${filename}`);
    }
  }

  private isEPLTeam(teamName: string): boolean {
    const eplTeams = [
      'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
      'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich',
      'Leicester', 'Liverpool', 'Manchester City', 'Manchester Utd',
      'Newcastle', 'Nottingham Forest', 'Southampton', 'Tottenham',
      'West Ham', 'Wolves'
    ];
    
    return eplTeams.some(team => 
      teamName.toLowerCase().includes(team.toLowerCase()) ||
      team.toLowerCase().includes(teamName.toLowerCase())
    );
  }

  async manualScrapeOdds() {
    console.log('🔄 Manual HKJC odds scraping triggered');
    await this.scrapeLiveOdds();
  }
}