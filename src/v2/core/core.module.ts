import { Module } from '@nestjs/common';
import { DataFileService } from './data-file.service';
import { TeamMappingService } from './team-mapping.service';

@Module({
  providers: [
    DataFileService,
    TeamMappingService,
  ],
  exports: [
    DataFileService,
    TeamMappingService,
  ],
})
export class CoreModule {}