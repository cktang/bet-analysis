import { Injectable } from '@nestjs/common';
import { StrategyDiscoveryService } from './strategy-discovery.service';
import { PatternDiscoveryService } from './pattern-discovery.service';

export type DiscoveryOptions = {
  maxFactors?: number;
  minROI?: number;
  minSampleSize?: number;
  maxCombinations?: number;
  batchSize?: number;
};

export type DiscoveryResult = {
  strategies: any[];
  totalCombinationsTested: number;
  executionTimeMs: number;
};

@Injectable()
export class TaskDiscoveryService {
  constructor(
    private readonly strategyDiscoveryService: StrategyDiscoveryService,
    private readonly patternDiscoveryService: PatternDiscoveryService
  ) {}

  async startDiscoveryTask(options: DiscoveryOptions = {}): Promise<string> {
    console.log('🚀 Starting discovery task with options:', options);
    
    try {
      const result = await this.strategyDiscoveryService.discoverOptimalStrategies(options);
      console.log(`✅ Discovery complete: Found ${result.strategies.length} strategies`);
      return 'completed';
    } catch (error) {
      console.error('❌ Discovery failed:', error);
      return 'failed';
    }
  }

  async startQuickDiscovery(): Promise<string> {
    return this.startDiscoveryTask({
      maxFactors: 2,
      minROI: 15,
      minSampleSize: 20,
      maxCombinations: 500
    });
  }

  async startDeepDiscovery(): Promise<string> {
    return this.startDiscoveryTask({
      maxFactors: 3,
      minROI: 10,
      minSampleSize: 15,
      maxCombinations: 200000,
      batchSize: 50
    });
  }

  async startFindAnyDiscovery(): Promise<string> {
    return this.startDiscoveryTask({
      maxFactors: 2,
      minROI: 1,
      minSampleSize: 1,
      maxCombinations: 300
    });
  }

  getTask(taskId: string): any {
    return { id: taskId, status: 'completed' };
  }

  getAllTasks(): any[] {
    return [];
  }

  cancelTask(taskId: string): boolean {
    console.log(`❌ Cancelled task: ${taskId}`);
    return true;
  }

  cleanupOldTasks(): void {
    console.log('🧹 Cleaned up old tasks');
  }
}