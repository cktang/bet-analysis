import { Controller, Post, Get } from '@nestjs/common';
import { HkjcScrapingService } from './hkjc-scraping.service';
import { FbrefScrapingService } from './fbref-scraping.service';

@Controller('data-collection')
export class DataCollectionController {
  constructor(
    private readonly hkjcService: HkjcScrapingService,
    private readonly fbrefService: FbrefScrapingService,
  ) {}

  @Post('scrape-hkjc')
  async scrapeHkjc() {
    await this.hkjcService.manualScrapeOdds();
    return { message: 'HKJC scraping initiated' };
  }

  @Post('scrape-fbref')
  async scrapeFbref() {
    await this.fbrefService.manualScrapeIncidents();
    return { message: 'FBRef scraping initiated' };
  }

  @Get('status')
  getStatus() {
    return {
      hkjcScraping: 'Active',
      fbrefScraping: 'Active',
      scheduledTasks: {
        hkjcOdds: 'Every 30 minutes',
        fbrefIncidents: 'Every 6 hours'
      }
    };
  }
}