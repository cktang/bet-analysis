/**
 * ConfigManager - Centralized configuration management
 * Replaces scattered config files and provides validation
 */

export interface LeagueConfig {
  name: string;
  years: string[];
  betUrl?: string;
  teams: Record<string, Record<string, string>>;
}

export interface BettingConfig {
  leagues: Record<string, LeagueConfig>;
  defaultSettings: {
    timeout: number;
    retryAttempts: number;
    rateLimit: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
    headers: Record<string, string>;
  };
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
}

export interface SystemConfig {
  betting: BettingConfig;
  database?: DatabaseConfig;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
  };
  features: {
    autoBackup: boolean;
    dataValidation: boolean;
    realTimeUpdates: boolean;
  };
}

export interface IConfigManager {
  load(config: Partial<SystemConfig>): void;
  get<T extends keyof SystemConfig>(key: T): SystemConfig[T];
  getLeague(leagueName: string): LeagueConfig | undefined;
  getTeams(league: string, year: string): Record<string, string> | undefined;
  validate(): boolean;
  reload(): Promise<void>;
}

export class ConfigManager implements IConfigManager {
  private config: SystemConfig;
  private readonly defaultConfig: SystemConfig = {
    betting: {
      leagues: {},
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

  constructor(initialConfig?: Partial<SystemConfig>) {
    this.config = { ...this.defaultConfig };
    if (initialConfig) {
      this.load(initialConfig);
    }
  }

  load(config: Partial<SystemConfig>): void {
    // Deep merge configuration
    this.config = this.deepMerge(this.config, config);
    this.validate();
  }

  get<T extends keyof SystemConfig>(key: T): SystemConfig[T] {
    return this.config[key];
  }

  getLeague(leagueName: string): LeagueConfig | undefined {
    return this.config.betting.leagues[leagueName];
  }

  getTeams(league: string, year: string): Record<string, string> | undefined {
    const leagueConfig = this.getLeague(league);
    return leagueConfig?.teams[year];
  }

  validate(): boolean {
    try {
      // Validate required fields
      if (!this.config.betting) {
        throw new Error('Betting configuration is required');
      }

      // Validate league configurations
      for (const [leagueName, leagueConfig] of Object.entries(this.config.betting.leagues)) {
        if (!leagueConfig.name || !Array.isArray(leagueConfig.years)) {
          throw new Error(`Invalid configuration for league: ${leagueName}`);
        }
      }

      // Validate logging level
      const validLogLevels = ['debug', 'info', 'warn', 'error'];
      if (!validLogLevels.includes(this.config.logging.level)) {
        throw new Error(`Invalid logging level: ${this.config.logging.level}`);
      }

      console.log('[ConfigManager] Configuration validated successfully');
      return true;
    } catch (error) {
      console.error('[ConfigManager] Configuration validation failed:', error);
      return false;
    }
  }

  async reload(): Promise<void> {
    // In a real implementation, this would reload from file/database
    console.log('[ConfigManager] Configuration reloaded');
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // Helper method to add league configuration
  addLeague(name: string, config: LeagueConfig): void {
    this.config.betting.leagues[name] = config;
    this.validate();
  }

  // Helper method to get all league names
  getLeagueNames(): string[] {
    return Object.keys(this.config.betting.leagues);
  }

  // Helper method to export current config (for backup/debugging)
  exportConfig(): SystemConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}