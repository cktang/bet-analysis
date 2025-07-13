import { EventEmitter } from 'events';

// Event type definitions for type safety
export interface BettingEvent {
  timestamp: number;
  eventId: string;
}

export interface OddsUpdateEvent extends BettingEvent {
  type: 'odds_update';
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  odds: {
    homeOdds: number;
    awayOdds: number;
    homeHandicap: number;
    awayHandicap: number;
  };
  previousOdds?: {
    homeOdds: number;
    awayOdds: number;
    homeHandicap: number;
    awayHandicap: number;
  };
}

export interface BettingSignalEvent extends BettingEvent {
  type: 'betting_signal';
  strategyName: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  decision: {
    betSide: 'home' | 'away';
    handicap: number;
    odds: number;
    stakeAmount: number;
    confidence: number;
  };
  preMatchFactors: Record<string, any>;
}

export interface BetPlacedEvent extends BettingEvent {
  type: 'bet_placed';
  betId: string;
  strategyName: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  betSide: 'home' | 'away';
  handicap: number;
  odds: number;
  stakeAmount: number;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  hkjcBetId?: string;
}

export interface BetResultEvent extends BettingEvent {
  type: 'bet_result';
  betId: string;
  strategyName: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  outcome: 'win' | 'loss' | 'push' | 'half_win' | 'half_loss';
  payout: number;
  profit: number;
}

export interface ModuleStatusEvent extends BettingEvent {
  type: 'module_status';
  moduleName: string;
  status: 'online' | 'offline' | 'error' | 'warning';
  message?: string;
  error?: Error;
}

export interface SystemAlertEvent extends BettingEvent {
  type: 'system_alert';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: any;
  source: string;
}

// Union type for all events
export type LiveBettingEvent = 
  | OddsUpdateEvent 
  | BettingSignalEvent 
  | BetPlacedEvent 
  | BetResultEvent 
  | ModuleStatusEvent 
  | SystemAlertEvent;

/**
 * Central Event Bus for Live Betting System
 * Handles all communication between modules with type safety
 */
export class BettingEventBus extends EventEmitter {
  private static instance: BettingEventBus;
  private eventHistory: LiveBettingEvent[] = [];
  private maxHistorySize = 1000;

  private constructor() {
    super();
    this.setMaxListeners(20); // Increase max listeners for multiple modules
  }

  public static getInstance(): BettingEventBus {
    if (!BettingEventBus.instance) {
      BettingEventBus.instance = new BettingEventBus();
    }
    return BettingEventBus.instance;
  }

  /**
   * Emit odds update event
   */
  public emitOddsUpdate(event: Omit<OddsUpdateEvent, 'type' | 'timestamp' | 'eventId'>): void {
    const fullEvent: OddsUpdateEvent = {
      ...event,
      type: 'odds_update',
      timestamp: Date.now(),
      eventId: this.generateEventId()
    };
    
    this.addToHistory(fullEvent);
    this.emit('odds_update', fullEvent);
    this.emit('*', fullEvent); // Wildcard for logging
  }

  /**
   * Emit betting signal event
   */
  public emitBettingSignal(event: Omit<BettingSignalEvent, 'type' | 'timestamp' | 'eventId'>): void {
    const fullEvent: BettingSignalEvent = {
      ...event,
      type: 'betting_signal',
      timestamp: Date.now(),
      eventId: this.generateEventId()
    };
    
    this.addToHistory(fullEvent);
    this.emit('betting_signal', fullEvent);
    this.emit('*', fullEvent);
  }

  /**
   * Emit bet placed event
   */
  public emitBetPlaced(event: Omit<BetPlacedEvent, 'type' | 'timestamp' | 'eventId'>): void {
    const fullEvent: BetPlacedEvent = {
      ...event,
      type: 'bet_placed',
      timestamp: Date.now(),
      eventId: this.generateEventId()
    };
    
    this.addToHistory(fullEvent);
    this.emit('bet_placed', fullEvent);
    this.emit('*', fullEvent);
  }

  /**
   * Emit bet result event
   */
  public emitBetResult(event: Omit<BetResultEvent, 'type' | 'timestamp' | 'eventId'>): void {
    const fullEvent: BetResultEvent = {
      ...event,
      type: 'bet_result',
      timestamp: Date.now(),
      eventId: this.generateEventId()
    };
    
    this.addToHistory(fullEvent);
    this.emit('bet_result', fullEvent);
    this.emit('*', fullEvent);
  }

  /**
   * Emit module status event
   */
  public emitModuleStatus(event: Omit<ModuleStatusEvent, 'type' | 'timestamp' | 'eventId'>): void {
    const fullEvent: ModuleStatusEvent = {
      ...event,
      type: 'module_status',
      timestamp: Date.now(),
      eventId: this.generateEventId()
    };
    
    this.addToHistory(fullEvent);
    this.emit('module_status', fullEvent);
    this.emit('*', fullEvent);
  }

  /**
   * Emit system alert event
   */
  public emitSystemAlert(event: Omit<SystemAlertEvent, 'type' | 'timestamp' | 'eventId'>): void {
    const fullEvent: SystemAlertEvent = {
      ...event,
      type: 'system_alert',
      timestamp: Date.now(),
      eventId: this.generateEventId()
    };
    
    this.addToHistory(fullEvent);
    this.emit('system_alert', fullEvent);
    this.emit('*', fullEvent);
  }

  /**
   * Subscribe to specific event type
   */
  public onOddsUpdate(callback: (event: OddsUpdateEvent) => void): void {
    this.on('odds_update', callback);
  }

  public onBettingSignal(callback: (event: BettingSignalEvent) => void): void {
    this.on('betting_signal', callback);
  }

  public onBetPlaced(callback: (event: BetPlacedEvent) => void): void {
    this.on('bet_placed', callback);
  }

  public onBetResult(callback: (event: BetResultEvent) => void): void {
    this.on('bet_result', callback);
  }

  public onModuleStatus(callback: (event: ModuleStatusEvent) => void): void {
    this.on('module_status', callback);
  }

  public onSystemAlert(callback: (event: SystemAlertEvent) => void): void {
    this.on('system_alert', callback);
  }

  /**
   * Subscribe to all events (for logging/monitoring)
   */
  public onAllEvents(callback: (event: LiveBettingEvent) => void): void {
    this.on('*', callback);
  }

  /**
   * Get recent event history
   */
  public getEventHistory(eventType?: string, limit: number = 100): LiveBettingEvent[] {
    let filtered = this.eventHistory;
    
    if (eventType) {
      filtered = this.eventHistory.filter(event => event.type === eventType);
    }
    
    return filtered.slice(-limit);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add event to history with size management
   */
  private addToHistory(event: LiveBettingEvent): void {
    this.eventHistory.push(event);
    
    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize * 0.8);
    }
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get system health stats
   */
  public getSystemHealth(): {
    totalEvents: number;
    recentEventsByType: Record<string, number>;
    moduleStatuses: Record<string, string>;
    lastActivity: number;
  } {
    const recentEvents = this.getEventHistory(undefined, 100);
    const recentEventsByType: Record<string, number> = {};
    const moduleStatuses: Record<string, string> = {};

    recentEvents.forEach(event => {
      recentEventsByType[event.type] = (recentEventsByType[event.type] || 0) + 1;
      
      if (event.type === 'module_status') {
        const statusEvent = event as ModuleStatusEvent;
        moduleStatuses[statusEvent.moduleName] = statusEvent.status;
      }
    });

    return {
      totalEvents: this.eventHistory.length,
      recentEventsByType,
      moduleStatuses,
      lastActivity: this.eventHistory.length > 0 ? this.eventHistory[this.eventHistory.length - 1].timestamp : 0
    };
  }
}

// Export singleton instance
export const eventBus = BettingEventBus.getInstance();