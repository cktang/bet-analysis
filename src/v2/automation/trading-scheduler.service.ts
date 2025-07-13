import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FixtureService, MatchFixture } from '../fixtures/fixture.service';
import { AutomationOrchestratorService } from './automation-orchestrator.service';

@Injectable()
export class TradingSchedulerService {
  private isProcessing = false;

  constructor(
    private readonly fixtureService: FixtureService,
    private readonly automationOrchestrator: AutomationOrchestratorService,
  ) {}

  async onModuleInit() {
    console.log('🕐 Trading Scheduler initialized');
  }

  /**
   * Load today's fixtures every 15 minutes
   */
  @Cron('0 */15 * * * *')
  async refreshFixtures() {
    console.log('📅 15-minute fixture refresh starting...');
    await this.fixtureService.loadTodaysFixtures();
    
    const status = this.fixtureService.getFixtureStatus();
    console.log(`📅 Refreshed ${status.totalFixtures} fixtures`);
  }

  /**
   * Check every minute for matches in trading window (5-10 mins before kickoff)
   */
  @Cron('0 */1 * * * *') // Every minute
  async checkTradingWindows() {
    if (this.isProcessing) {
      return; // Skip if already processing
    }

    try {
      this.isProcessing = true;

      // Get matches in trading window (5-10 minutes before kickoff)
      const tradingMatches = this.fixtureService.getMatchesInTradingWindow();

      if (tradingMatches.length === 0) {
        // Uncomment for debugging: console.log('🕐 No matches in trading window');
        return;
      }

      console.log(`🕐 Found ${tradingMatches.length} matches in trading window`);

      // Trigger automated trading for each match
      for (const match of tradingMatches) {
        await this.triggerAutomatedTrading(match);
      }

    } catch (error) {
      console.error('❌ Error in trading window check:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Trigger automated trading for a specific match
   */
  private async triggerAutomatedTrading(match: MatchFixture) {
    const now = new Date();
    const kickoff = new Date(match.kickoffTime);
    const minutesUntilKickoff = Math.round((kickoff.getTime() - now.getTime()) / (1000 * 60));

    console.log(`⚡ Triggering automated trading for ${match.homeTeam} vs ${match.awayTeam} (${minutesUntilKickoff} mins to kickoff)`);

    try {
      await this.automationOrchestrator.executeAutomatedTradingCycle(match);
      console.log(`✅ Automated trading completed for ${match.homeTeam} vs ${match.awayTeam}`);
    } catch (error) {
      console.error(`❌ Automated trading failed for ${match.homeTeam} vs ${match.awayTeam}:`, error);
    }
  }

  /**
   * Get scheduler status for monitoring
   */
  getSchedulerStatus(): any {
    const fixtureStatus = this.fixtureService.getFixtureStatus();
    
    return {
      isProcessing: this.isProcessing,
      nextCheck: 'Every minute',
      fixtureRefresh: 'Every 15 minutes',
      ...fixtureStatus
    };
  }

  /**
   * Manual trigger for testing (will be removed in production)
   */
  async manualTrigger() {
    console.log('🔄 Manual trading trigger activated');
    await this.checkTradingWindows();
  }
}