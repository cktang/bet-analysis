import { Controller, Get, Post, Body, Query, Res, Param, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PatternDiscoveryService } from './pattern-discovery.service';
import { FactorDrillingService } from './factor-drilling.service';
import { StrategyGeneratorService } from './strategy-generator.service';
import { DrillAnalysisService } from './drill-analysis.service';
import { CleanGeneticOptimizerService } from './clean-genetic-optimizer.service';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly patternDiscoveryService: PatternDiscoveryService,
    private readonly factorDrillingService: FactorDrillingService,
    private readonly strategyGeneratorService: StrategyGeneratorService,
    private readonly drillAnalysisService: DrillAnalysisService,
    private readonly cleanGeneticOptimizerService: CleanGeneticOptimizerService,
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

  @Post('clear-cache')
  clearCache() {
    this.drillAnalysisService.clearCache();
    return { message: 'Cache cleared successfully' };
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

  @Get('drill-data/factor_definitions.json')
  getFactorDefinitionsJson(@Res() res: Response) {
    try {
      const jsonPath = join(__dirname, '..', 'utils', 'drilling', 'factor_definitions.json');
      const json = readFileSync(jsonPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    } catch (error) {
      res.status(404).send('Factor definitions not found');
    }
  }

  @Get('factor_definitions.json')
  getFactorDefinitionsDirect(@Res() res: Response) {
    try {
      const jsonPath = join(__dirname, '..', 'utils', 'drilling', 'factor_definitions.json');
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

  @Get('generate-random-strategy')
  async generateRandomStrategy(
    @Query('betSide') betSide: string = 'home',
    @Query('size') size: string = '1500',
    @Query('noOfFactors') noOfFactors: string = '3'
  ) {
    const betSideConfig = {
      betSide: betSide,
      description: `Bet on ${betSide} team`
    };
    
    const sizeConfig = {
      expression: size,
      description: `$${size}`,
      stakingMethod: 'fixed'
    };
    
    const strategy = await this.strategyGeneratorService.createRandomStrategy(
      betSideConfig,
      sizeConfig,
      parseInt(noOfFactors)
    );
    
    return strategy;
  }

  @Get('generate-multiple-strategies') 
  async generateMultipleStrategies(
    @Query('betSide') betSide: string = 'home',
    @Query('size') size: string = '1500', 
    @Query('noOfFactors') noOfFactors: string = '3',
    @Query('count') count: string = '5',
    @Query('minMatches') minMatches: string = '15'
  ) {
    const betSideConfig = {
      betSide: betSide,
      description: `Bet on ${betSide} team`
    };
    
    const sizeConfig = {
      expression: size,
      description: `$${size}`,
      stakingMethod: 'fixed'
    };
    
    const strategies = await this.strategyGeneratorService.generateRandomStrategies(
      betSideConfig,
      sizeConfig,
      parseInt(noOfFactors),
      parseInt(count),
      parseInt(minMatches)
    );
    
    return strategies;
  }

  @Post('create-specific-strategy')
  async createSpecificStrategy(@Body() body: {
    factors: string[];
    betSide?: string;
    size?: string;
  }) {
    const betSideConfig = {
      betSide: body.betSide || 'home',
      description: `Bet on ${body.betSide || 'home'} team`
    };
    
    // Handle dynamic sizing or custom expressions
    let sizeConfig;
    if (body.size === 'dynamic') {
      sizeConfig = {
        expression: "200 + Math.floor((Math.max(preMatch.match.asianHandicapOdds.homeOdds, preMatch.match.asianHandicapOdds.awayOdds) - 1.91) * 100) * 150",
        description: "$200 if odds <=1.91, else +$150 per 0.01",
        stakingMethod: 'variable'
      };
    } else {
      sizeConfig = {
        expression: body.size || '1500',
        description: `$${body.size || '1500'}`,
        stakingMethod: 'fixed'
      };
    }
    
    const strategy = await this.strategyGeneratorService.createSpecificStrategy(
      body.factors,
      betSideConfig,
      sizeConfig
    );
    
    return strategy;
  }

  @Get('available-factors')
  async getAvailableFactors() {
    return this.strategyGeneratorService.getAllAvailableFactors();
  }





  // Utility files for drilling app
  @Get('utils/**')
  getUtilityFile(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the path after /analysis/utils/ and remove query parameters
      const requestPath = req.url.replace('/analysis/utils/', '').split('?')[0];
      
      // Security check: prevent path traversal
      if (requestPath.includes('..') || requestPath.includes('//')) {
        res.status(400).send('Invalid path');
        return;
      }
      
      const filePath = join(__dirname, '..', 'utils', requestPath);
      
      // Determine content type
      const ext = requestPath.split('.').pop()?.toLowerCase();
      let contentType = 'application/javascript';
      
      if (ext === 'json') {
        contentType = 'application/json';
      }
      
      const fileContent = readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', contentType);
      res.send(fileContent);
    } catch (error) {
      res.status(404).send(`Utility file not found: ${req.url}`);
    }
  }

  // Generic drilling app files (handles all files in drilling-tool directory and subdirectories)
  @Get('js/**')
  getDrillingFile(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the path after /analysis/js/ from the request URL
      const requestPath = req.url.replace('/analysis/js/', '');
      
      // Security check: prevent path traversal
      if (requestPath.includes('..') || requestPath.includes('//')) {
        res.status(400).send('Invalid path');
        return;
      }
      
      const filePath = join(__dirname, 'drilling-tool', 'js', requestPath);
      
      // Determine content type based on file extension
      const ext = requestPath.split('.').pop()?.toLowerCase();
      let contentType = 'application/javascript'; // default
      
      if (ext === 'json') {
        contentType = 'application/json';
      } else if (ext === 'css') {
        contentType = 'text/css';
      } else if (ext === 'html') {
        contentType = 'text/html';
      }
      
      const fileContent = readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', contentType);
      res.send(fileContent);
    } catch (error) {
      res.status(404).send(`File not found: ${req.url}`);
    }
  }










  // Genetic Algorithm Optimization Endpoints (Clean Version Only)

  @Post('genetic/optimize')
  async optimizeCleanGenetic(@Body() config: any) {
    try {
      await this.cleanGeneticOptimizerService.initialize();
      
      setImmediate(async () => {
        try {
          await this.cleanGeneticOptimizerService.optimize(config);
        } catch (error) {
          console.error('Clean genetic optimization error:', error);
        }
      });
      
      return { 
        message: 'Genetic Algorithm optimization started',
        config: config
      };
    } catch (error: any) {
      return { error: error.message || error };
    }
  }

  @Get('genetic/status')
  getGeneticStatus() {
    return this.cleanGeneticOptimizerService.getStatus();
  }

  @Post('genetic/stop')
  stopGenetic() {
    this.cleanGeneticOptimizerService.stop();
    return { message: 'Genetic Algorithm stopped' };
  }
}