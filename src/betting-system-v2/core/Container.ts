/**
 * Container - Dependency Injection Container
 * Centralized dependency management to avoid tight coupling
 */

export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T = any> = () => T | Promise<T>;
export type ServiceKey = string | symbol | Constructor;

export interface IContainer {
  register<T>(key: ServiceKey, factory: Factory<T>): void;
  registerSingleton<T>(key: ServiceKey, factory: Factory<T>): void;
  registerClass<T>(key: ServiceKey, constructor: Constructor<T>): void;
  get<T>(key: ServiceKey): Promise<T>;
  has(key: ServiceKey): boolean;
  clear(): void;
}

export class Container implements IContainer {
  private services = new Map<ServiceKey, Factory>();
  private singletons = new Map<ServiceKey, any>();
  private isSingleton = new Map<ServiceKey, boolean>();

  register<T>(key: ServiceKey, factory: Factory<T>): void {
    this.services.set(key, factory);
    this.isSingleton.set(key, false);
  }

  registerSingleton<T>(key: ServiceKey, factory: Factory<T>): void {
    this.services.set(key, factory);
    this.isSingleton.set(key, true);
  }

  registerClass<T>(key: ServiceKey, constructor: Constructor<T>): void {
    this.register(key, () => new constructor());
  }

  async get<T>(key: ServiceKey): Promise<T> {
    // Check if it's a singleton and already instantiated
    if (this.isSingleton.get(key) && this.singletons.has(key)) {
      return this.singletons.get(key);
    }

    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service not found: ${String(key)}`);
    }

    try {
      const instance = await factory();
      
      // Store singleton instance
      if (this.isSingleton.get(key)) {
        this.singletons.set(key, instance);
      }
      
      return instance;
    } catch (error) {
      throw new Error(`Failed to create service ${String(key)}: ${error}`);
    }
  }

  has(key: ServiceKey): boolean {
    return this.services.has(key);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.isSingleton.clear();
  }

  // Debug helpers
  getRegisteredServices(): ServiceKey[] {
    return Array.from(this.services.keys());
  }

  getSingletonInstances(): ServiceKey[] {
    return Array.from(this.singletons.keys());
  }
}

// Service keys as symbols to avoid naming conflicts
export const ServiceKeys = {
  EVENT_BUS: Symbol('EventBus'),
  CONFIG_MANAGER: Symbol('ConfigManager'),
  DATA_STORE: Symbol('DataStore'),
  LOGGER: Symbol('Logger'),
  HTTP_CLIENT: Symbol('HttpClient'),
  BETTING_SERVICE: Symbol('BettingService'),
  USER_SERVICE: Symbol('UserService'),
  GAME_SERVICE: Symbol('GameService'),
} as const;