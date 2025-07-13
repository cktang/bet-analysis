import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PatternDiscoveryService } from './pattern-discovery.service';
import { FactorDrillingService } from './factor-drilling.service';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly patternDiscoveryService: PatternDiscoveryService,
    private readonly factorDrillingService: FactorDrillingService,
  ) {}

  @Post('discover-patterns')
  async discoverPatterns(@Body() body: { factors: string[] }) {
    return await this.patternDiscoveryService.discoverPatterns(body.factors);
  }

  @Post('drill-factors')
  async drillFactors(@Body() body: { factors?: string[] }) {
    return await this.factorDrillingService.drillFactors(body.factors || []);
  }

  @Get('drill-history')
  async getDrillHistory(@Query('path') path: string) {
    const factorPath = path ? path.split(',') : [];
    return await this.factorDrillingService.getDrillHistory(factorPath);
  }

  @Get('top-strategies')
  async getTopStrategies(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20;
    return await this.factorDrillingService.getTopStrategies(limitNum);
  }

  @Get('factor-impact')
  async getFactorImpact(@Query('factor') factor: string) {
    return await this.factorDrillingService.getFactorImpact(factor);
  }

  @Get('search-factors')
  async searchFactors(@Query('q') query: string) {
    return await this.factorDrillingService.searchFactors(query);
  }

  @Get('factor-definitions')
  getFactorDefinitions() {
    return this.patternDiscoveryService.getFactorDefinitions();
  }

  @Get('strategies')
  getStrategies() {
    return this.patternDiscoveryService.getStrategies();
  }

  @Get('status')
  getStatus() {
    return {
      patternDiscovery: 'Active',
      factorDrilling: 'Active',
      factorDefinitions: Object.keys(this.patternDiscoveryService.getFactorDefinitions() || {}).length,
      strategies: (this.patternDiscoveryService.getStrategies() || []).length
    };
  }
}