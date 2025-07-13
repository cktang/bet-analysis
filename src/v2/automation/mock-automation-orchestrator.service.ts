import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataFileService } from '../core/data-file.service';
import * as chokidar from 'chokidar';

@Injectable()
export class MockAutomationOrchestratorService {
  private isRunning = false;
  private fileWatcher: chokidar.FSWatcher;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataFileService: DataFileService
  ) {}

  async onModuleInit() {
    console.log('🤖 Mock Automation Orchestrator initialized - FILE-BASED MODE (No mock betting records)');
    this.setupFileWatcher();
  }

  async onModuleDestroy() {
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
    this.stopAutomation();
  }

  private setupFileWatcher() {
    // Watch for fixtures to start automation when matches are available
    this.fileWatcher = chokidar.watch('./data/v2/fixtures.json');
    this.fileWatcher.on('change', async () => {
      console.log('🤖 Fixtures updated, checking for trading opportunities...');
      if (this.isRunning) {
        await this.checkTradingOpportunities();
      }
    });
  }

  private async checkTradingOpportunities() {
    try {
      const fixtures = await this.dataFileService.getFixtures();
      const now = new Date();
      
      // Check for matches in trading window
      const tradingWindowMatches = fixtures.filter((fixture: any) => {
        const kickoff = new Date(fixture.kickoffTime);
        const timeDiff = kickoff.getTime() - now.getTime();
        const minutesUntilKickoff = timeDiff / (1000 * 60);
        return minutesUntilKickoff >= 5 && minutesUntilKickoff <= 10;
      });
      
      if (tradingWindowMatches.length > 0) {
        console.log(`🤖 ${tradingWindowMatches.length} matches in trading window, triggering automation...`);
        
        for (const fixture of tradingWindowMatches) {
          // Write automation trigger for this fixture
          const automationTrigger = {
            fixture,
            timestamp: Date.now(),
            action: 'automated_trading_cycle'
          };
          
          await this.dataFileService.writeFile('automation-trigger.json', [automationTrigger]);
        }
      }
    } catch (error) {
      console.error('❌ Error checking trading opportunities:', error);
    }
  }

  /**
   * Start automation for real betting only
   */
  async startAutomation(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Automation already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting real betting automation (no mock records)');

    try {
      // Write automation status to file
      await this.dataFileService.writeFile('automation-status.json', [{
        isRunning: true,
        startedAt: Date.now(),
        mode: 'real_betting'
      }]);

      // Trigger initial check for trading opportunities
      await this.checkTradingOpportunities();
      
    } catch (error) {
      console.error('❌ Error starting automation:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop automation
   */
  async stopAutomation(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Stopped betting automation');
    
    try {
      // Write automation status to file
      await this.dataFileService.writeFile('automation-status.json', [{
        isRunning: false,
        stoppedAt: Date.now(),
        mode: 'stopped'
      }]);
    } catch (error) {
      console.error('❌ Error updating automation status:', error);
    }
  }

  /**
   * Get automation status
   */
  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }

  /**
   * Get automation status (alias for compatibility)
   */
  getAutomationStatus(): { isRunning: boolean } {
    return this.getStatus();
  }

  /**
   * Force new match (no longer generates mock bets)
   */
  async forceNewMatch(): Promise<void> {
    console.log('🎯 Force new match requested (no mock bets generated)');
    // Only generate fixtures, no betting
  }

  /**
   * Pause automation
   */
  async pauseAutomation(): Promise<void> {
    await this.stopAutomation();
  }

  /**
   * Resume automation
   */
  async resumeAutomation(): Promise<void> {
    await this.startAutomation();
  }

  /**
   * Reset session
   */
  async resetSession(): Promise<void> {
    await this.stopAutomation();
    console.log('🔄 Session reset (no mock bets to clear)');
    
    try {
      // Clear any pending automation triggers
      await this.dataFileService.writeFile('automation-trigger.json', []);
      await this.dataFileService.writeFile('betting-decisions.json', []);
    } catch (error) {
      console.error('❌ Error resetting session files:', error);
    }
  }

}