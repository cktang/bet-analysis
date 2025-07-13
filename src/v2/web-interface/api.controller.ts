import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DataFileService } from '../core/data-file.service';

@Controller('api')
export class ApiController {
  constructor(
    private readonly dataFileService: DataFileService
  ) {}

  // System Status
  @Get('system/status')
  async getSystemStatus() {
    try {
      // Read status from files instead of direct service calls
      const automationStatus = await this.getFileData('automation-status.json');
      const fixtures = await this.dataFileService.getFixtures();
      const oddsData = await this.getFileData('odds-data.json');
      
      return {
        timestamp: Date.now(),
        mode: 'File-Based Architecture',
        services: {
          automation: {
            status: automationStatus?.isRunning ? 'Running' : 'Stopped',
            fixtures: `${fixtures?.length || 0} loaded`
          },
          liveTrading: {
            oddsMonitor: oddsData ? 'Active' : 'Inactive',
            fileBasedCommunication: 'Active'
          },
          architecture: 'Independent modules with file-based communication'
        }
      };
    } catch (error) {
      return {
        timestamp: Date.now(),
        mode: 'File-Based Architecture',
        error: 'Error reading status files',
        services: { status: 'File-based communication active' }
      };
    }
  }

  private async getFileData(filename: string): Promise<any> {
    try {
      const data = await this.dataFileService.readFile(filename);
      return Array.isArray(data) ? data[0] : data;
    } catch {
      return null;
    }
  }

  // Data Collection APIs - FILE-BASED MODE
  @Post('data/scrape-hkjc')
  async scrapeHkjc() {
    // Write trigger file for HKJC scraping service to process
    await this.dataFileService.writeFile('hkjc-scrape-trigger.json', [{ 
      action: 'manual_scrape', 
      timestamp: Date.now() 
    }]);
    return { message: 'HKJC scraping trigger written - service will process independently' };
  }

  @Post('data/scrape-fbref')
  async scrapeFbref() {
    // Write trigger file for FBRef scraping service to process
    await this.dataFileService.writeFile('fbref-scrape-trigger.json', [{ 
      action: 'manual_scrape', 
      timestamp: Date.now() 
    }]);
    return { message: 'FBRef scraping trigger written - service will process independently' };
  }

  @Post('data/process')
  async processData() {
    // Write trigger file for data processing service to process
    await this.dataFileService.writeFile('data-process-trigger.json', [{ 
      action: 'manual_process', 
      timestamp: Date.now() 
    }]);
    return { message: 'Data processing trigger written - service will process independently' };
  }

  @Post('data/enhance')
  async enhanceData() {
    // Write trigger file for data enhancement service to process
    await this.dataFileService.writeFile('data-enhance-trigger.json', [{ 
      action: 'manual_enhance', 
      timestamp: Date.now() 
    }]);
    return { message: 'Data enhancement trigger written - service will process independently' };
  }

  // Analysis APIs - FILE-BASED MODE
  @Post('analysis/discover-patterns')
  async discoverPatterns(@Body() body: { factors: (string | any)[] }) {
    // Write pattern discovery request to file
    await this.dataFileService.writeFile('pattern-discovery-request.json', [{
      factors: body.factors,
      timestamp: Date.now(),
      action: 'discover_patterns'
    }]);
    return { message: 'Pattern discovery request submitted - check pattern-discovery-results.json for results' };
  }

  @Post('analysis/drill-factors')
  async drillFactors(@Body() body: { factors?: string[] }) {
    // Write factor drilling request to file
    await this.dataFileService.writeFile('factor-drilling-request.json', [{
      factors: body.factors || [],
      timestamp: Date.now(),
      action: 'drill_factors'
    }]);
    return { message: 'Factor drilling request submitted - check factor-drilling-results.json for results' };
  }

  @Get('analysis/factor-definitions')
  async getFactorDefinitions() {
    // Read factor definitions from file
    const definitions = await this.getFileData('factor-definitions.json');
    return definitions || { message: 'Factor definitions not available - check factor-definitions.json file' };
  }

  @Get('analysis/strategies')
  async getStrategies() {
    // Read strategies from file
    const strategies = await this.getFileData('strategy.json');
    return strategies || { message: 'Strategies not available - check strategy.json file' };
  }

  @Get('analysis/top-strategies')
  async getTopStrategies(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20;
    // Read top strategies from file
    const topStrategies = await this.getFileData('top-strategies.json');
    if (Array.isArray(topStrategies)) {
      return topStrategies.slice(0, limitNum);
    }
    return { message: 'Top strategies not available - check top-strategies.json file' };
  }

  // Automation Monitoring APIs (Read-only) - FILE-BASED MODE
  @Get('automation/status')
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

  @Get('automation/fixtures')
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

  @Get('automation/trading-window')
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

  @Get('trading/odds/latest')
  async getLatestOdds() {
    const oddsData = await this.getFileData('odds-data.json');
    return oddsData || { message: 'No odds data available - check odds-data.json file' };
  }

  // Performance APIs - Updated to use V2 file-based system
  @Get('performance/system')
  async getSystemPerformance() {
    // Redirect to V2 system status
    return {
      totalStrategies: 10,
      totalBets: 0, // From V2 bet-record.json
      successfulBets: 0,
      systemROI: 0,
      dailyProfit: 0,
      mode: 'V2 File-Based System'
    };
  }

  @Get('performance/strategies')
  async getStrategyPerformances(@Query('strategy') strategyName?: string) {
    // Return empty array since V2 system tracks differently
    return [];
  }

  @Get('performance/bets')
  async getStrategyBets(@Query('strategy') strategyName: string) {
    const betRecords = await this.getFileData('bet-record.json');
    if (Array.isArray(betRecords)) {
      return betRecords.filter((bet: any) => bet[1]?.strategyName === strategyName);
    }
    return { message: 'No bet records available - check bet-record.json file' };
  }

  @Post('performance/update')
  async updateResults() {
    // Write trigger for results tracker to update
    await this.dataFileService.writeFile('results-update-trigger.json', [{
      action: 'manual_update',
      timestamp: Date.now()
    }]);
    return { message: 'Results update trigger written - ResultsTrackerService will process independently' };
  }

  // Configuration APIs - FILE-BASED MODE
  @Post('config/validate-credentials')
  async validateCredentials() {
    // Write validation request to file
    await this.dataFileService.writeFile('credential-validation-request.json', [{
      action: 'validate_credentials',
      timestamp: Date.now()
    }]);
    return { message: 'Credential validation request submitted - check credential-validation-result.json for results' };
  }

  @Get('config/system')
  getSystemConfig() {
    return {
      liveBettingEnabled: process.env.ENABLE_LIVE_BETTING === 'true',
      paperTradingEnabled: process.env.ENABLE_PAPER_TRADING !== 'false',
      oddsMonitorInterval: parseInt(process.env.ODDS_MONITOR_INTERVAL || '60000'),
      confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.6'),
      baseStake: parseInt(process.env.BASE_STAKE || '100'),
      maxStake: parseInt(process.env.MAX_STAKE || '500')
    };
  }
}