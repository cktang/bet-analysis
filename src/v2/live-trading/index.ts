import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BettingExecutorService } from './betting-executor.service';
import { OddsMonitorService } from './odds-monitor.service';
import { MockDataFileService } from '../core/mock-data-file.service';
import { CoreModule } from '../core/core.module';
import { DATA_FILE_SERVICE } from './tokens';
import { BettingDecisionService } from './betting-decision.service';

@Module({})
export class LiveTradingModule {
  static register(): DynamicModule {
    return {
      module: LiveTradingModule,
      imports: [ConfigModule, CoreModule],
      providers: [
        MockDataFileService,
        {
          provide: DATA_FILE_SERVICE,
          useFactory: () => new MockDataFileService(), // 🎭 MOCK MODE: Use MockDataFileService for testing
          // 🎯 REAL MODE: Change to DataFileService for production
        },
        BettingExecutorService,
        BettingDecisionService,
        OddsMonitorService,
      ],
      exports: [DATA_FILE_SERVICE, BettingExecutorService, OddsMonitorService, BettingDecisionService],
    };
  }
} 