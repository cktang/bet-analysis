import { Module } from '@nestjs/common';
import { DataFileService } from './data-file.service';
import { TeamMappingService } from './team-mapping.service';
import { SharedBrowserService } from './shared-browser.service';
import { BettingUtilitiesService } from './betting-utilities.service';

@Module({
  providers: [
    DataFileService,
    TeamMappingService,
    SharedBrowserService,
    BettingUtilitiesService,
  ],
  exports: [
    DataFileService,
    TeamMappingService,
    SharedBrowserService,
    BettingUtilitiesService,
  ],
})
export class CoreModule {}