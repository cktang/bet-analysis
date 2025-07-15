import { Controller, Get, Post, Body, Query, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
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

  @Get('drill-app')
  serveFactorDrillingApp(@Res() res: Response) {
    try {
      const htmlPath = join(__dirname, 'drilling-tool', 'index.html');
      const html = readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(404).send('Drilling app not found');
    }
  }

  @Get('drill-app/legacy')
  serveOriginalFactorDrillingApp(@Res() res: Response) {
    try {
      const htmlPath = join(__dirname, 'drilling-tool', 'index.html');
      const html = readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(404).send('Original factor drilling app not found');
    }
  }

  @Get('drill-data/factor_definitions.json')
  getFactorDefinitionsJson(@Res() res: Response) {
    try {
      const jsonPath = join(__dirname, 'drilling-tool', 'factor_definitions.json');
      const json = readFileSync(jsonPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    } catch (error) {
      res.status(404).send('Factor definitions not found');
    }
  }

  @Get('drill-data/strategy.json')
  getStrategyJson(@Res() res: Response) {
    try {
      const jsonPath = join(__dirname, 'drilling-tool', 'strategy.json');
      const json = readFileSync(jsonPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    } catch (error) {
      res.status(404).send('Strategy data not found');
    }
  }

  @Get('data/enhanced/:filename')
  getEnhancedDataFile(@Res() res: Response, @Param('filename') filename: string) {
    try {
      const jsonPath = join(__dirname, '..', '..', '..', 'data', 'enhanced', filename);
      const json = readFileSync(jsonPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    } catch (error) {
      res.status(404).send(`Enhanced data file ${filename} not found`);
    }
  }

  @Get('strategy.json')
  getStrategyJsonDirect(@Res() res: Response) {
    try {
      const jsonPath = join(__dirname, 'drilling-tool', 'strategy.json');
      const json = readFileSync(jsonPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    } catch (error) {
      res.status(404).send('Strategy data not found');
    }
  }

  // Generic drilling app JavaScript files
  @Get('js/AsianHandicapCalculator.js')
  getAsianHandicapCalculator(@Res() res: Response) {
    try {
      const jsPath = join(__dirname, 'drilling-tool', 'AsianHandicapCalculator.js');
      const js = readFileSync(jsPath, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(js);
    } catch (error) {
      res.status(404).send('AsianHandicapCalculator.js not found');
    }
  }

  @Get('js/profit-calculators/asian-handicap-calculator.js')
  getAsianHandicapProfitCalculator(@Res() res: Response) {
    try {
      const jsPath = join(__dirname, 'drilling-tool', 'profit-calculators', 'asian-handicap-calculator.js');
      const js = readFileSync(jsPath, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(js);
    } catch (error) {
      res.status(404).send('asian-handicap-calculator.js not found');
    }
  }

  @Get('js/generic-evaluator.js')
  getGenericEvaluator(@Res() res: Response) {
    try {
      const jsPath = join(__dirname, 'drilling-tool', 'generic-evaluator.js');
      const js = readFileSync(jsPath, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(js);
    } catch (error) {
      res.status(404).send('generic-evaluator.js not found');
    }
  }

  @Get('js/drilling-config.json')
  getDrillingConfig(@Res() res: Response) {
    try {
      const jsonPath = join(__dirname, 'drilling-tool', 'drilling-config.json');
      const json = readFileSync(jsonPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    } catch (error) {
      res.status(404).send('drilling-config.json not found');
    }
  }

  @Get('js/factor_definitions.json')
  getFactorDefinitionsForGeneric(@Res() res: Response) {
    try {
      const jsonPath = join(__dirname, 'drilling-tool', 'factor_definitions.json');
      const json = readFileSync(jsonPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    } catch (error) {
      res.status(404).send('factor_definitions.json not found');
    }
  }
}