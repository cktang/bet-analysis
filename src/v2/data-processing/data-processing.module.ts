import { Module } from '@nestjs/common';
import { DataMergerService } from './data-merger.service';
import { DataEnhancerService } from './data-enhancer.service';
import { DataProcessingController } from './data-processing.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [DataProcessingController],
  providers: [DataMergerService, DataEnhancerService],
})
export class DataProcessingModule {}