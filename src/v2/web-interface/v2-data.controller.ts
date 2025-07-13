import { Controller, Get, Post } from '@nestjs/common';
import { DataFileService } from '../core/data-file.service';

@Controller('api/v2')
export class V2DataController {
  constructor(
    private dataFileService: DataFileService,
  ) {}

  @Get('fixtures')
  async getFixtures() {
    return this.dataFileService.getFixtures();
  }

  @Get('bet-decisions')
  async getBetDecisions() {
    return this.dataFileService.getBetDecisions();
  }

  @Get('bet-pending-decisions')
  async getBetPendingDecisions() {
    return this.dataFileService.getBetPendingDecisions();
  }

  @Get('bet-records')
  async getBetRecords() {
    return this.dataFileService.getBetRecords();
  }

  @Get('bet-results')
  async getBetResults() {
    return this.dataFileService.getBetResults();
  }

  @Get('strategies')
  async getStrategies() {
    return this.dataFileService.getStrategies();
  }

  @Get('logs')
  async getLogs() {
    return this.dataFileService.getLogs();
  }

  @Get('system/status')
  async getSystemStatus() {
    return {
      timestamp: Date.now(),
      mode: 'File-Based Architecture',
      status: 'All modules operating independently with file-based communication',
      architecture: 'Decoupled services with chokidar file watchers'
    };
  }

}