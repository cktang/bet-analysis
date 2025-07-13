import { eventBus } from './EventBus';
import { OddsMonitor } from '../monitoring/OddsMonitor';
import { EnhancedDataBuilder } from '../data/EnhancedDataBuilder';
import { StrategyDecisionEngine } from '../decision/StrategyDecisionEngine';
import { HKJCBettingExecutor } from '../execution/HKJCBettingExecutor';
import { ResultsTracker } from '../tracking/ResultsTracker';

export interface SystemConfig {
  oddsMonitorInterval?: number; // ms
  hkjcCredentials: {
    username: string;
    password: string;
    answers: Record<string, string>;
  };
  enableLiveBetting?: boolean;
  enablePaperTrading?: boolean;
}

export interface SystemStatus {
  status: 'stopped' | 'starting' | 'running' | 'error';
  modules: {
    oddsMonitor: 'online' | 'offline' | 'error';
    enhancedDataBuilder: 'online' | 'offline' | 'error';
    strategyDecisionEngine: 'online' | 'offline' | 'error';
    bettingExecutor: 'online' | 'offline' | 'error';
    resultsTracker: 'online' | 'offline' | 'error';
  };
  startedAt?: number;
  lastActivity: number;
  totalBets: number;
  activeBets: number;
  systemROI: number;
  dailyProfit: number;
}

/**
 * Main Live Betting Coordinator
 * Orchestrates all modules and manages system lifecycle
 */
export class LiveBettingCoordinator {
  private config: SystemConfig;
  private isRunning = false;
  private startedAt?: number;
  
  // Module instances
  private oddsMonitor: OddsMonitor;
  private enhancedDataBuilder: EnhancedDataBuilder;
  private strategyDecisionEngine: StrategyDecisionEngine;
  private bettingExecutor: HKJCBettingExecutor;
  private resultsTracker: ResultsTracker;
  
  // System monitoring
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private errorCount = 0;
  private maxErrors = 10;
  
  constructor(config: SystemConfig) {
    this.config = {
      oddsMonitorInterval: 30000, // 30 seconds default
      enableLiveBetting: true,
      enablePaperTrading: false,
      ...config
    };
    
    // Initialize modules
    this.oddsMonitor = new OddsMonitor();
    this.enhancedDataBuilder = new EnhancedDataBuilder();
    this.strategyDecisionEngine = new StrategyDecisionEngine(this.enhancedDataBuilder);
    this.bettingExecutor = new HKJCBettingExecutor(this.config.hkjcCredentials);
    this.resultsTracker = new ResultsTracker();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    console.log('LiveBettingCoordinator initialized');
  }

  /**
   * Set up event handlers for system monitoring
   */
  private setupEventHandlers(): void {
    // Listen to all events for logging and monitoring
    eventBus.onAllEvents(this.handleSystemEvent.bind(this));
    
    // Handle system alerts
    eventBus.onSystemAlert((event) => {
      console.warn(`System Alert [${event.severity}]: ${event.message}`);
      
      if (event.severity === 'critical' || event.severity === 'error') {
        this.errorCount++;
        
        if (this.errorCount >= this.maxErrors) {
          console.error('Maximum error count reached, shutting down system');
          this.stop();
        }
      }
    });
    
    // Handle module status changes
    eventBus.onModuleStatus((event) => {
      console.log(`Module ${event.moduleName}: ${event.status} - ${event.message || ''}`);
      
      if (event.status === 'error' && this.isRunning) {
        console.error(`Module ${event.moduleName} encountered an error:`, event.error);
        // Implement module restart logic if needed
      }
    });
    
    // Handle betting signals (for paper trading mode)
    if (this.config.enablePaperTrading) {
      eventBus.onBettingSignal((event) => {
        console.log(`[PAPER TRADE] Strategy ${event.strategyName} signals bet: ${event.homeTeam} vs ${event.awayTeam} - ${event.decision.betSide} @ ${event.decision.odds}`);
      });
    }
  }

  /**
   * Handle all system events for logging and monitoring
   */
  private handleSystemEvent(event: any): void {
    // Log important events
    if (event.type === 'betting_signal') {
      console.log(`🎯 Betting signal: ${event.strategyName} - ${event.homeTeam} vs ${event.awayTeam}`);
    } else if (event.type === 'bet_placed') {
      console.log(`💰 Bet placed: ${event.status} - ${event.homeTeam} vs ${event.awayTeam} (${event.strategyName})`);
    } else if (event.type === 'bet_result') {
      console.log(`📊 Bet result: ${event.outcome} - ${event.profit > 0 ? '+' : ''}$${event.profit} (${event.strategyName})`);
    }
    
    // Update activity timestamp
    this.lastActivity = Date.now();
  }
  
  private lastActivity = Date.now();

  /**
   * Start the live betting system
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('System is already running');
      return;
    }

    console.log('🚀 Starting Live Betting System...');
    this.startedAt = Date.now();
    this.errorCount = 0;

    try {
      // Start modules in order
      console.log('📊 Starting Enhanced Data Builder...');
      // EnhancedDataBuilder starts automatically

      console.log('👁️ Starting Odds Monitor...');
      await this.oddsMonitor.start(this.config.oddsMonitorInterval || 30000);

      console.log('🧠 Starting Strategy Decision Engine...');
      this.strategyDecisionEngine.start();

      console.log('📈 Starting Results Tracker...');
      this.resultsTracker.start();

      // Note: Betting Executor starts automatically when it receives betting signals

      this.isRunning = true;
      
      // Start health monitoring
      this.startHealthMonitoring();

      eventBus.emitSystemAlert({
        severity: 'info',
        message: 'Live Betting System started successfully',
        source: 'LiveBettingCoordinator'
      });

      console.log('✅ Live Betting System started successfully');
      console.log('📋 System Status:');
      console.log(`   - Live Betting: ${this.config.enableLiveBetting ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   - Paper Trading: ${this.config.enablePaperTrading ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   - Odds Monitor Interval: ${this.config.oddsMonitorInterval}ms`);

    } catch (error) {
      console.error('❌ Failed to start Live Betting System:', error);
      
      eventBus.emitSystemAlert({
        severity: 'critical',
        message: 'Failed to start Live Betting System',
        details: error,
        source: 'LiveBettingCoordinator'
      });
      
      // Cleanup on failure
      await this.stop();
      throw error;
    }
  }

  /**
   * Stop the live betting system
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('System is already stopped');
      return;
    }

    console.log('🛑 Stopping Live Betting System...');
    this.isRunning = false;

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    try {
      // Stop modules in reverse order
      console.log('📈 Stopping Results Tracker...');
      this.resultsTracker.stop();

      console.log('🧠 Stopping Strategy Decision Engine...');
      this.strategyDecisionEngine.stop();

      console.log('👁️ Stopping Odds Monitor...');
      await this.oddsMonitor.stop();

      console.log('💰 Closing Betting Executor...');
      await this.bettingExecutor.close();

      eventBus.emitSystemAlert({
        severity: 'info',
        message: 'Live Betting System stopped',
        source: 'LiveBettingCoordinator'
      });

      console.log('✅ Live Betting System stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping Live Betting System:', error);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
  }

  /**
   * Perform system health check
   */
  private performHealthCheck(): void {
    const status = this.getSystemStatus();
    
    // Check for stale activity
    const timeSinceActivity = Date.now() - this.lastActivity;
    if (timeSinceActivity > 300000) { // 5 minutes
      eventBus.emitSystemAlert({
        severity: 'warning',
        message: `No system activity for ${Math.round(timeSinceActivity / 60000)} minutes`,
        source: 'LiveBettingCoordinator'
      });
    }
    
    // Check module health
    const offlineModules = Object.entries(status.modules)
      .filter(([_, status]) => status === 'offline')
      .map(([name, _]) => name);
    
    if (offlineModules.length > 0) {
      eventBus.emitSystemAlert({
        severity: 'warning',
        message: `Modules offline: ${offlineModules.join(', ')}`,
        source: 'LiveBettingCoordinator'
      });
    }
    
    // Log health status periodically
    if (Date.now() % (5 * 60 * 1000) < 60000) { // Every 5 minutes
      console.log('💓 System Health Check:');
      console.log(`   Status: ${status.status}`);
      console.log(`   Total Bets: ${status.totalBets}`);
      console.log(`   Active Bets: ${status.activeBets}`);
      console.log(`   System ROI: ${status.systemROI.toFixed(2)}%`);
      console.log(`   Daily P&L: $${status.dailyProfit.toFixed(2)}`);
    }
  }

  /**
   * Get comprehensive system status
   */
  public getSystemStatus(): SystemStatus {
    const systemPerformance = this.resultsTracker.getSystemPerformance();
    
    return {
      status: this.isRunning ? 'running' : 'stopped',
      modules: {
        oddsMonitor: this.oddsMonitor.isMonitoring() ? 'online' : 'offline',
        enhancedDataBuilder: 'online', // Always online
        strategyDecisionEngine: this.strategyDecisionEngine.getStatus().isRunning ? 'online' : 'offline',
        bettingExecutor: this.bettingExecutor.getStatus().isLoggedIn ? 'online' : 'offline',
        resultsTracker: this.resultsTracker.getStatus().isRunning ? 'online' : 'offline'
      },
      startedAt: this.startedAt,
      lastActivity: this.lastActivity,
      totalBets: systemPerformance.totalBets,
      activeBets: systemPerformance.activeBets,
      systemROI: systemPerformance.systemROI,
      dailyProfit: systemPerformance.dailyProfit
    };
  }

  /**
   * Get detailed system metrics
   */
  public getSystemMetrics(): {
    performance: any;
    strategies: any[];
    recentActivity: any[];
    moduleStatuses: any;
  } {
    return {
      performance: this.resultsTracker.getSystemPerformance(),
      strategies: this.resultsTracker.getAllStrategyPerformances(),
      recentActivity: eventBus.getEventHistory(undefined, 50),
      moduleStatuses: {
        oddsMonitor: this.oddsMonitor.getAllCurrentOdds(),
        decisionEngine: this.strategyDecisionEngine.getStatus(),
        bettingExecutor: this.bettingExecutor.getStatus(),
        resultsTracker: this.resultsTracker.getStatus()
      }
    };
  }

  /**
   * Manual trigger for results update
   */
  public async manualUpdateResults(): Promise<void> {
    console.log('📊 Manual results update triggered');
    await this.resultsTracker.manualUpdateResults();
  }

  /**
   * Toggle live betting mode
   */
  public toggleLiveBetting(enabled: boolean): void {
    this.config.enableLiveBetting = enabled;
    
    eventBus.emitSystemAlert({
      severity: 'info',
      message: `Live betting ${enabled ? 'ENABLED' : 'DISABLED'}`,
      source: 'LiveBettingCoordinator'
    });
    
    console.log(`💰 Live betting ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Toggle paper trading mode
   */
  public togglePaperTrading(enabled: boolean): void {
    this.config.enablePaperTrading = enabled;
    
    eventBus.emitSystemAlert({
      severity: 'info',
      message: `Paper trading ${enabled ? 'ENABLED' : 'DISABLED'}`,
      source: 'LiveBettingCoordinator'
    });
    
    console.log(`📝 Paper trading ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Emergency stop
   */
  public async emergencyStop(reason: string): Promise<void> {
    console.error(`🚨 EMERGENCY STOP: ${reason}`);
    
    eventBus.emitSystemAlert({
      severity: 'critical',
      message: `Emergency stop triggered: ${reason}`,
      source: 'LiveBettingCoordinator'
    });
    
    await this.stop();
  }

  /**
   * Restart system
   */
  public async restart(): Promise<void> {
    console.log('🔄 Restarting Live Betting System...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    await this.start();
  }
}