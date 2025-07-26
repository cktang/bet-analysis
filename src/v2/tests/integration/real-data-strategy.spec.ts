import { Test, TestingModule } from '@nestjs/testing';
import { DrillAnalysisService } from '../../analysis/drill-analysis.service';
import { PatternDiscoveryService } from '../../analysis/pattern-discovery.service';

describe('Real Data Strategy Integration', () => {
  let service: DrillAnalysisService;
  let patternDiscoveryService: PatternDiscoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrillAnalysisService,
        PatternDiscoveryService,
      ],
    }).compile();

    service = module.get<DrillAnalysisService>(DrillAnalysisService);
    patternDiscoveryService = module.get<PatternDiscoveryService>(PatternDiscoveryService);
  });

  it('should load real data and evaluate real factor expressions', async () => {
    // Load real data
    await service.loadMatchData();
    await service.loadFactorDefinitions();

    console.log('Loaded matches:', service['allMatches'].length);
    console.log('Loaded factors:', Object.keys(service['factorDefinitions']).length);

    // Debug: Look at the actual structure of the first match
    const firstMatch = service['allMatches'][0];
    console.log('First match structure:');
    console.log('Keys:', Object.keys(firstMatch));
    console.log('preMatch keys:', firstMatch.preMatch ? Object.keys(firstMatch.preMatch) : 'NO PREMATCH');
    console.log('preMatch.match keys:', firstMatch.preMatch?.match ? Object.keys(firstMatch.preMatch.match) : 'NO MATCH');
    console.log('Full first match:', JSON.stringify(firstMatch, null, 2).substring(0, 1000) + '...');

    // Test with real factor expression
    const realExpression = 'Math.max(preMatch.match.asianHandicapOdds.homeOdds, preMatch.match.asianHandicapOdds.awayOdds) > 2';
    
    // Test on first few matches
    const testMatches = service['allMatches'].slice(0, 5);
    console.log('Testing on first 5 matches...');
    
    testMatches.forEach((match, index) => {
      const result = service.evaluateFactorExpression(match, realExpression);
      console.log(`Match ${index + 1} (${match.matchKey}): ${result}`);
      
      // Log the actual data structure
      if (match.preMatch?.match?.asianHandicapOdds) {
        const { homeOdds, awayOdds } = match.preMatch.match.asianHandicapOdds;
        console.log(`  Odds: home=${homeOdds}, away=${awayOdds}, max=${Math.max(homeOdds, awayOdds)}`);
      } else {
        console.log(`  No asianHandicapOdds found`);
      }
    });
  });

  it('should create and analyze a real strategy with high odds factor', async () => {
    // Load real data
    await service.loadMatchData();
    await service.loadFactorDefinitions();

    // Create a strategy with the extreme odds factor
    const factors = [
      {
        category: 'oddsLevel',
        key: 'extreme',
        expression: 'Math.max(preMatch.match.asianHandicapOdds.homeOdds, preMatch.match.asianHandicapOdds.awayOdds) > 2',
        description: 'Max odds > 2.00 (extreme)'
      }
    ];

    const sideSelection = { betSide: 'home' };
    const sizeSelection = { expression: '1500' };

    console.log('Analyzing strategy with extreme odds factor...');
    const result = await service.analyzeStrategy(factors, sideSelection, sizeSelection);

    console.log('Strategy Analysis Result:');
    console.log('Total matches filtered:', result.summary.totalBets);
    console.log('ROI:', result.summary.roi);
    console.log('Win rate:', result.summary.winRate);
    console.log('Total profit:', result.summary.totalProfit);

    // This should find some matches if the data is loaded correctly
    expect(result.summary.totalBets).toBeGreaterThan(0);
  });
}); 