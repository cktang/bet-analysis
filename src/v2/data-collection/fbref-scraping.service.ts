import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FbrefScrapingService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;

  async onModuleInit() {
    console.log('📊 FBRef Scraping Service initialized');
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  @Cron('0 0 */6 * * *') // Every 6 hours
  async scrapeMatchIncidents() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🎯 Starting FBRef incidents scraping...');
    
    try {
      await this.initializeBrowser();
      await this.scrapeRecentMatches();
      console.log('✅ FBRef incidents scraping completed');
    } catch (error) {
      console.error('❌ FBRef scraping failed:', error);
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

  private async scrapeRecentMatches() {
    if (!this.page) throw new Error('Browser not initialized');

    // Navigate to FBRef Premier League page
    await this.page.goto('https://fbref.com/en/comps/9/Premier-League-Stats');
    await this.page.waitForTimeout(3000);

    // Get recent matches
    const matches = await this.page.$$eval('.table tbody tr', (rows) => {
      return rows.slice(0, 10).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
          const date = cells[0]?.textContent?.trim();
          const homeTeam = cells[2]?.textContent?.trim();
          const awayTeam = cells[4]?.textContent?.trim();
          const score = cells[3]?.textContent?.trim();
          
          if (date && homeTeam && awayTeam && score) {
            return {
              date,
              homeTeam,
              awayTeam,
              score,
              timestamp: Date.now()
            };
          }
        }
        return null;
      }).filter(match => match !== null);
    });

    // For each match, scrape detailed incidents
    for (const match of matches) {
      try {
        await this.scrapeMatchDetails(match);
        await this.page.waitForTimeout(2000); // Rate limiting
      } catch (error) {
        console.error(`Error scraping details for ${match.homeTeam} vs ${match.awayTeam}:`, error);
      }
    }
  }

  private async scrapeMatchDetails(match: any) {
    if (!this.page) return;

    // Try to find match link and navigate to it
    const matchLink = await this.page.$(`a[href*="${match.homeTeam}"][href*="${match.awayTeam}"]`);
    if (!matchLink) return;

    await matchLink.click();
    await this.page.waitForTimeout(3000);

    // Scrape match incidents
    const incidents = await this.page.$$eval('.table.stats_table tbody tr', (rows) => {
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          const minute = cells[0]?.textContent?.trim();
          const player = cells[1]?.textContent?.trim();
          const action = cells[2]?.textContent?.trim();
          const team = cells[3]?.textContent?.trim();
          
          return {
            minute: minute ? parseInt(minute) : null,
            player,
            action,
            team
          };
        }
        return null;
      }).filter(incident => incident !== null);
    });

    // Save match incidents
    const filename = `${match.date}_${match.homeTeam}_vs_${match.awayTeam}.json`;
    const filepath = path.join(process.cwd(), 'data', 'fbref-incidents', filename);
    
    const data = {
      ...match,
      incidents,
      scrapedAt: Date.now()
    };
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`📊 Saved incidents for ${match.homeTeam} vs ${match.awayTeam}`);
    
    // Navigate back
    await this.page.goBack();
    await this.page.waitForTimeout(1000);
  }

  async manualScrapeIncidents() {
    console.log('🔄 Manual FBRef incidents scraping triggered');
    await this.scrapeMatchIncidents();
  }
}