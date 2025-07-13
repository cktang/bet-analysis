import { Module } from '@nestjs/common';
import { PatternDiscoveryService } from './pattern-discovery.service';
import { FactorDrillingService } from './factor-drilling.service';
import { AnalysisController } from './analysis.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [AnalysisController],
  providers: [PatternDiscoveryService, FactorDrillingService],
})
export class AnalysisModule {}