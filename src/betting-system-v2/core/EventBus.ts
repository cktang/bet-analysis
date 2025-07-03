/**
 * EventBus - Centralized event system for decoupled communication
 * Modules communicate through events, not direct calls
 */

export type EventCallback<T = any> = (data: T) => void | Promise<void>;

export interface IEventBus {
  emit<T>(event: string, data: T): Promise<void>;
  on<T>(event: string, callback: EventCallback<T>): void;
  off(event: string, callback: EventCallback): void;
  once<T>(event: string, callback: EventCallback<T>): void;
}

export class EventBus implements IEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private onceListeners: Map<string, Set<EventCallback>> = new Map();

  async emit<T>(event: string, data: T): Promise<void> {
    console.log(`[EventBus] Emitting: ${event}`);
    
    // Handle regular listeners
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const promises: Promise<void>[] = [];
      for (const callback of eventListeners) {
        try {
          const result = callback(data);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${event}:`, error);
        }
      }
      await Promise.all(promises);
    }

    // Handle once listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      const promises: Promise<void>[] = [];
      for (const callback of onceListeners) {
        try {
          const result = callback(data);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`[EventBus] Error in once listener for ${event}:`, error);
        }
      }
      await Promise.all(promises);
      this.onceListeners.delete(event); // Clean up once listeners
    }
  }

  on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  once<T>(event: string, callback: EventCallback<T>): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(callback);
  }

  // Debug helper
  getActiveEvents(): string[] {
    return [
      ...Array.from(this.listeners.keys()),
      ...Array.from(this.onceListeners.keys())
    ];
  }
}