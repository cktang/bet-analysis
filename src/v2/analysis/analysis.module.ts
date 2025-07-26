import { Module } from '@nestjs/common';
import { PatternDiscoveryService } from './pattern-discovery.service';
import { FactorDrillingService } from './factor-drilling.service';
import { DrillAnalysisService } from './drill-analysis.service';
import { StrategyGeneratorService } from './strategy-generator.service';
import { CleanGeneticOptimizerService } from './clean-genetic-optimizer.service';
import { AnalysisController } from './analysis.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [AnalysisController],
  providers: [
    PatternDiscoveryService, 
    FactorDrillingService, 
    DrillAnalysisService,
    StrategyGeneratorService,
    CleanGeneticOptimizerService
  ],
})
export class AnalysisModule {}