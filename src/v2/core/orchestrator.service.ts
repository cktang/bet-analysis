import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { DataFileService } from './data-file.service';
import { MockDataGeneratorService } from './mock-data-generator.service';

@Injectable()
export class OrchestratorService implements OnModuleInit {
  constructor(
    private dataFileService: DataFileService,
    private mockDataGenerator: MockDataGeneratorService
  ) {}

  async onModuleInit() {
    // Don't await to prevent blocking startup
    this.dataFileService.writeLog('info', 'V2 System starting up').catch(console.warn);
    
    // Start all services without blocking
    this.startServices().catch(console.warn);
  }

  private async startServices() {
    try {
      // Start mock fixture generator
      this.mockDataGenerator.startMockGenerator();
      await this.dataFileService.writeLog('info', 'Mock fixture generator started');
      
      await this.dataFileService.writeLog('info', 'Core V2 services started successfully');
      
    } catch (error) {
      await this.dataFileService.writeLog('error', `Failed to start services: ${error.message}`);
    }
  }

  async getSystemStatus() {
    const fixtures = await this.dataFileService.getFixtures();
    const betDecisions = await this.dataFileService.getBetDecisions();
    const betPending = await this.dataFileService.getBetPendingDecisions();
    const betRecords = await this.dataFileService.getBetRecords();
    const betResults = await this.dataFileService.getBetResults();
    const logs = await this.dataFileService.getLogs();
    
    return {
      system: 'V2 File-Based Betting System',
      status: 'Running',
      timestamp: new Date().toISOString(),
      counts: {
        fixtures: fixtures.length,
        betDecisions: betDecisions.length,
        betPending: betPending.length,
        betRecords: betRecords.length,
        betResults: betResults.length,
        logs: logs.length
      },
      recentLogs: logs.slice(-5)
    };
  }
}