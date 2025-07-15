import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AnalysisModule } from './analysis/analysis.module';
import { LiveTradingModule } from './live-trading';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'config/live-betting.json'],
    }),
    ScheduleModule.forRoot(),
    AnalysisModule,
    LiveTradingModule.register(),
  ],
})
export class AppModule {}