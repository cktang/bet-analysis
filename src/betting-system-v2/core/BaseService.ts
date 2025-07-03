/**
 * BaseService - Base class for all services
 * Provides common functionality like event communication and dependency access
 */

import { IEventBus } from './EventBus';
import { IContainer, ServiceKeys } from './Container';
import { IConfigManager } from './ConfigManager';

export interface IService {
  name: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  isRunning(): boolean;
}

export abstract class BaseService implements IService {
  public abstract readonly name: string;
  protected container: IContainer;
  protected eventBus?: IEventBus;
  protected config?: IConfigManager;
  private _isRunning = false;

  constructor(container: IContainer) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    try {
      console.log(`[${this.name}] Initializing...`);
      
      // Get common dependencies
      this.eventBus = await this.container.get<IEventBus>(ServiceKeys.EVENT_BUS);
      this.config = await this.container.get<IConfigManager>(ServiceKeys.CONFIG_MANAGER);
      
      // Call service-specific initialization
      await this.onInitialize();
      
      this._isRunning = true;
      console.log(`[${this.name}] Initialized successfully`);
      
      // Emit initialization complete event
      await this.emit('service.initialized', { serviceName: this.name });
      
    } catch (error) {
      console.error(`[${this.name}] Initialization failed:`, error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      console.log(`[${this.name}] Shutting down...`);
      
      await this.onShutdown();
      this._isRunning = false;
      
      console.log(`[${this.name}] Shutdown complete`);
      await this.emit('service.shutdown', { serviceName: this.name });
      
    } catch (error) {
      console.error(`[${this.name}] Shutdown failed:`, error);
      throw error;
    }
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  // Protected methods for services to override
  protected abstract onInitialize(): Promise<void>;
  protected abstract onShutdown(): Promise<void>;

  // Helper methods for event communication
  protected async emit<T>(event: string, data: T): Promise<void> {
    if (this.eventBus) {
      await this.eventBus.emit(event, data);
    }
  }

  protected on<T>(event: string, callback: (data: T) => void | Promise<void>): void {
    if (this.eventBus) {
      this.eventBus.on(event, callback);
    }
  }

  protected once<T>(event: string, callback: (data: T) => void | Promise<void>): void {
    if (this.eventBus) {
      this.eventBus.once(event, callback);
    }
  }

  // Helper methods for dependency access
  protected async getDependency<T>(key: symbol | string): Promise<T> {
    return await this.container.get<T>(key);
  }

  // Helper method for configuration access
  protected getConfig<T extends keyof import('./ConfigManager').SystemConfig>(key: T) {
    if (!this.config) {
      throw new Error(`[${this.name}] Config not available. Service may not be initialized.`);
    }
    return this.config.get(key);
  }

  // Helper method for logging (can be overridden by services)
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    const logLevel = this.config?.get('logging').level || 'info';
    const levels = ['debug', 'info', 'warn', 'error'];
    
    if (levels.indexOf(level) >= levels.indexOf(logLevel)) {
      console[level](`[${this.name}] ${message}`, ...args);
    }
  }

  // Helper method for safe async operations with error handling
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.log('error', `${errorMessage}:`, error);
      if (fallback !== undefined) {
        return fallback;
      }
      return undefined;
    }
  }

  // Helper method for retry logic
  protected async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Attempt ${attempt}/${maxAttempts} failed:`, error);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError!;
  }
}