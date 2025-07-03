/**
 * Betting System V2
 * Main entry point for the new betting system architecture
 */

// Export main components
export * from './models';
export * from './services';
export * from './controllers';
export * from './types';
export * from './utils';
export * from './core';

// Main imports for system setup
import { Container, ServiceKeys } from './core/Container';
import { EventBus } from './core/EventBus';
import { ConfigManager, SystemConfig } from './core/ConfigManager';
import { BettingService } from './services/BettingService';

// Main betting system class
export class BettingSystemV2 {
  private container: Container;
  private eventBus: EventBus;
  private configManager: ConfigManager;
  private services: any[] = [];

  constructor(config?: Partial<SystemConfig>) {
    // Initialize core components
    this.container = new Container();
    this.eventBus = new EventBus();
    this.configManager = new ConfigManager(config);

    // Register core services
    this.setupCoreServices();
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Betting System V2...');
    
    try {
      // Initialize all services
      await this.initializeServices();
      
      // Emit system started event
      await this.eventBus.emit('system.started', { timestamp: new Date() });
      
      console.log('✅ Betting System V2 started successfully');
      console.log(`📊 Active services: ${this.services.length}`);
      console.log(`🎯 Active events: ${this.eventBus.getActiveEvents().length}`);
      
    } catch (error) {
      console.error('❌ Failed to start Betting System V2:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Betting System V2...');
    
    try {
      // Emit shutdown event
      await this.eventBus.emit('system.shutdown', { timestamp: new Date() });
      
      // Shutdown all services in reverse order
      for (let i = this.services.length - 1; i >= 0; i--) {
        await this.services[i].shutdown();
      }
      
      console.log('✅ Betting System V2 stopped successfully');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  // Get a service instance
  async getService<T>(serviceKey: symbol): Promise<T> {
    return await this.container.get<T>(serviceKey);
  }

  // Get configuration
  getConfig() {
    return this.configManager;
  }

  // Get event bus for external event handling
  getEventBus() {
    return this.eventBus;
  }

  private setupCoreServices(): void {
    // Register core services as singletons
    this.container.registerSingleton(ServiceKeys.EVENT_BUS, () => this.eventBus);
    this.container.registerSingleton(ServiceKeys.CONFIG_MANAGER, () => this.configManager);
    
    // Register business services
    this.container.registerSingleton(ServiceKeys.BETTING_SERVICE, () => new BettingService(this.container));
  }

  private async initializeServices(): Promise<void> {
    // Get and initialize betting service
    const bettingService = await this.container.get<BettingService>(ServiceKeys.BETTING_SERVICE);
    await bettingService.initialize();
    this.services.push(bettingService);
    
    // Add other services here as needed
    // const userService = await this.container.get<UserService>(ServiceKeys.USER_SERVICE);
    // await userService.initialize();
    // this.services.push(userService);
  }
}

// Helper function to create system with sample configuration
export function createBettingSystem(): BettingSystemV2 {
  const sampleConfig: Partial<SystemConfig> = {
    betting: {
      leagues: {
        'Eng Premier': {
          name: 'English Premier League',
          years: ['2023-2024', '2024-2025'],
          betUrl: 'https://bet.hkjc.com/en/football/hdc?tournid=50000051',
          teams: {
            '2024-2025': {
              'Arsenal': 'Arsenal(阿仙奴)',
              'Chelsea': 'Chelsea(車路士)',
              'Liverpool': 'Liverpool(利物浦)',
              'Manchester City': 'Manchester City(曼城)',
              'Manchester Utd': 'Manchester Utd(曼聯)',
              'Tottenham': 'Tottenham(熱刺)',
            }
          }
        }
      },
      defaultSettings: {
        timeout: 30000,
        retryAttempts: 3,
        rateLimit: 1000,
      },
      api: {
        baseUrl: 'https://bet.hkjc.com',
        timeout: 10000,
        headers: {
          'User-Agent': 'BettingSystem/2.0',
        },
      },
    },
    logging: {
      level: 'info',
    },
    features: {
      autoBackup: true,
      dataValidation: true,
      realTimeUpdates: false,
    },
  };

  return new BettingSystemV2(sampleConfig);
}

export default BettingSystemV2;