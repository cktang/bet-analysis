import { Controller, Post, Get } from '@nestjs/common';
import { DataMergerService } from './data-merger.service';
import { DataEnhancerService } from './data-enhancer.service';

@Controller('data-processing')
export class DataProcessingController {
  constructor(
    private readonly dataMergerService: DataMergerService,
    private readonly dataEnhancerService: DataEnhancerService,
  ) {}

  @Post('merge')
  async mergeData() {
    await this.dataMergerService.manualProcessData();
    return { message: 'Data merger processing initiated' };
  }

  @Post('enhance')
  async enhanceData() {
    await this.dataEnhancerService.manualEnhanceData();
    return { message: 'Data enhancement initiated' };
  }

  @Get('status')
  getStatus() {
    return {
      dataMerger: 'Active',
      dataEnhancer: 'Active',
      scheduledTasks: {
        merger: 'Every hour',
        enhancer: 'Every 2 hours'
      }
    };
  }
}