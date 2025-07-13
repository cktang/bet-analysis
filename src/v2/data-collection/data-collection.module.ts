import { Module } from '@nestjs/common';
import { HkjcScrapingService } from './hkjc-scraping.service';
import { FbrefScrapingService } from './fbref-scraping.service';
import { DataCollectionController } from './data-collection.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [DataCollectionController],
  providers: [HkjcScrapingService, FbrefScrapingService],
})
export class DataCollectionModule {}