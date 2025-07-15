import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { DataCollectionModule } from './data-collection/data-collection.module';
import { DataProcessingModule } from './data-processing/data-processing.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AutomationModule } from './automation/automation.module';
import { HealthModule } from './health/health.module';
import { LiveTradingModule } from './live-trading';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'config/live-betting.json'],
    }),
    ScheduleModule.forRoot(),
    DataCollectionModule,
    DataProcessingModule,
    AnalysisModule,
    LiveTradingModule.register(),
    AutomationModule,
    HealthModule,
  ],
})
export class AppModule {}