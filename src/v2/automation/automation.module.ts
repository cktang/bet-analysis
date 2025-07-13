import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FixtureService } from '../fixtures/fixture.service';
import { TradingSchedulerService } from './trading-scheduler.service';
import { AutomationOrchestratorService } from './automation-orchestrator.service';
import { MockAutomationOrchestratorService } from './mock-automation-orchestrator.service';
import { AutomationController } from './automation.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CoreModule
  ],
  controllers: [AutomationController],
  providers: [
    FixtureService,
    TradingSchedulerService,
    AutomationOrchestratorService,
    MockAutomationOrchestratorService,
  ],
})
export class AutomationModule {}