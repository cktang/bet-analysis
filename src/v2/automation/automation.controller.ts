import { Controller, Get, Post } from '@nestjs/common';
import { DataFileService } from '../core/data-file.service';

@Controller('api/automation')
export class AutomationController {
  constructor(
    private readonly dataFileService: DataFileService
  ) {}

  @Get('status')
  async getAutomationStatus() {
    const automationStatus = await this.getFileData('automation-status.json');
    const fixtures = await this.dataFileService.getFixtures();
    
    return {
      scheduler: 'File-based scheduling active',
      orchestrator: automationStatus || { isRunning: false, mode: 'file-based' },
      fixtures: {
        count: fixtures?.length || 0,
        status: fixtures?.length > 0 ? 'loaded' : 'no fixtures'
      }
    };
  }

  private async getFileData(filename: string): Promise<any> {
    try {
      const data = await this.dataFileService.readFile(filename);
      return Array.isArray(data) ? data[0] : data;
    } catch {
      return null;
    }
  }

  @Get('fixtures')
  async getTodaysFixtures() {
    const fixtures = await this.dataFileService.getFixtures();
    return {
      fixtures: fixtures || [],
      status: {
        count: fixtures?.length || 0,
        loaded: fixtures?.length > 0
      }
    };
  }

  @Get('trading-window')
  async getTradingWindow() {
    const fixtures = await this.dataFileService.getFixtures();
    const now = new Date();
    
    // Filter for trading window (5-10 minutes before kickoff)
    const tradingMatches = fixtures?.filter((fixture: any) => {
      const kickoff = new Date(fixture.kickoffTime);
      const timeDiff = kickoff.getTime() - now.getTime();
      const minutesUntilKickoff = timeDiff / (1000 * 60);
      return minutesUntilKickoff >= 5 && minutesUntilKickoff <= 10;
    }) || [];
    
    return {
      matchesInWindow: tradingMatches,
      count: tradingMatches.length
    };
  }

  @Post('refresh-fixtures')
  async refreshFixtures() {
    // Write trigger for fixture service to refresh
    await this.dataFileService.writeFile('fixture-refresh-trigger.json', [{
      action: 'refresh_fixtures',
      timestamp: Date.now()
    }]);
    
    const fixtures = await this.dataFileService.getFixtures();
    return {
      message: 'Fixture refresh trigger written - FixtureService will process independently',
      count: fixtures?.length || 0,
      fixtures: fixtures || []
    };
  }

  // For testing only - FILE-BASED MODE
  @Post('manual-trigger')
  async manualTrigger() {
    // Write manual trigger to file
    await this.dataFileService.writeFile('manual-trigger.json', [{
      action: 'manual_trigger',
      timestamp: Date.now()
    }]);
    return { message: 'Manual trigger written - TradingSchedulerService will process independently' };
  }

  // Mock automation endpoints - FILE-BASED MODE
  @Get('mock-status')
  async getMockAutomationStatus() {
    const automationStatus = await this.getFileData('automation-status.json');
    return automationStatus || { isRunning: false, mode: 'file-based' };
  }

  @Post('mock/force-match')
  async forceMockMatch() {
    // Write force match trigger to file
    await this.dataFileService.writeFile('force-match-trigger.json', [{
      action: 'force_match',
      timestamp: Date.now()
    }]);
    return { message: 'Force match trigger written - MockAutomationOrchestratorService will process independently' };
  }

  @Post('mock/pause')
  async pauseMockAutomation() {
    // Write pause automation command to file
    await this.dataFileService.writeFile('automation-command.json', [{
      action: 'pause_automation',
      timestamp: Date.now()
    }]);
    return { message: 'Pause automation command written - MockAutomationOrchestratorService will process independently' };
  }

  @Post('mock/resume')
  async resumeMockAutomation() {
    // Write resume automation command to file
    await this.dataFileService.writeFile('automation-command.json', [{
      action: 'resume_automation',
      timestamp: Date.now()
    }]);
    return { message: 'Resume automation command written - MockAutomationOrchestratorService will process independently' };
  }

  @Post('mock/reset')
  async resetMockSession() {
    // Write reset session command to file
    await this.dataFileService.writeFile('automation-command.json', [{
      action: 'reset_session',
      timestamp: Date.now()
    }]);
    return { message: 'Reset session command written - MockAutomationOrchestratorService will process independently' };
  }

  @Get('betting-dashboard')
  async getBettingDashboard() {
    // Read dashboard data from files
    const betRecords = await this.getFileData('bet-record.json');
    const betResults = await this.getFileData('bet-result.json');
    
    return {
      betRecords: betRecords || [],
      betResults: betResults || [],
      message: 'Dashboard data from file-based system'
    };
  }

  @Get('session-metrics')
  async getSessionMetrics() {
    // Read session metrics from files
    const betRecords = await this.getFileData('bet-record.json');
    const logs = await this.getFileData('log.json');
    
    return {
      betRecords: Array.isArray(betRecords) ? betRecords.length : 0,
      logs: Array.isArray(logs) ? logs.length : 0,
      lastUpdate: Date.now(),
      source: 'file-based system'
    };
  }
}