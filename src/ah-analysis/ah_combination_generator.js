const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const RuleLoader = require('./rule_loader');

class AHCombinationGenerator {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        this.combinationsPath = path.join(__dirname, '../../data/processed/ah_combinations.json');
        this.ruleLoader = new RuleLoader();
        
        this.baseFactors = {
            xg: ['fbref.homeXG', 'fbref.awayXG'],
            performance: [
                'enhanced.performance.homeXGDiff',
                'enhanced.performance.awayXGDiff', 
                'enhanced.performance.homeEfficiency',
                'enhanced.performance.awayEfficiency',
                'enhanced.performance.totalXG',
                'enhanced.performance.totalGoals',
                'enhanced.performance.xgAccuracy'
            ],
            odds: [
                'match.homeWinOdds',
                'match.drawOdds', 
                'match.awayWinOdds',
                'match.over2_5Odds',
                'match.under2_5Odds',
                'match.asianHandicapOdds.homeOdds',
                'match.asianHandicapOdds.awayOdds'
            ],
            marketEfficiency: [
                'enhanced.marketEfficiency.homeImpliedProb',
                'enhanced.marketEfficiency.drawImpliedProb',
                'enhanced.marketEfficiency.awayImpliedProb',
                'enhanced.marketEfficiency.totalImpliedProb',
                'enhanced.marketEfficiency.cutPercentage'
            ],
            context: [
                'fbref.week',
                'fbref.attendance'
            ]
        };

        this.derivedFactors = {
            xgDifference: ['fbref.homeXG - fbref.awayXG'],
            oddsRatio: ['match.homeWinOdds / match.awayWinOdds'],
            xgEfficiency: ['(match.homeScore / fbref.homeXG)', '(match.awayScore / fbref.awayXG)'],
            marketBias: ['enhanced.marketEfficiency.homeImpliedProb - enhanced.marketEfficiency.awayImpliedProb'],
            overPerformance: ['enhanced.performance.homeEfficiency - enhanced.performance.awayEfficiency'],
            totalExpected: ['fbref.homeXG + fbref.awayXG'],
            handicapValue: ['parseFloat(match.asianHandicapOdds.homeHandicap.split("/")[0])']
        };

        this.previousResults = this.loadPreviousResults();
    }

    loadPreviousResults() {
        try {
            if (fs.existsSync(this.resultsPath)) {
                return JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
            }
        } catch (error) {
            console.log('No previous results found, starting fresh');
        }
        return { iterations: [], bestCombinations: [] };
    }

    generateInitialCombinations() {
        console.log('📁 Loading combinations from rule files...');
        
        // Load all rules and generate combinations
        this.ruleLoader.loadAllRules();
        const combinations = this.ruleLoader.generateCombinationsFromRules();
        
        console.log(`✅ Generated ${combinations.length} combinations from ${this.ruleLoader.loadedRules.length} rule files`);
        
        // Add complexity scoring
        combinations.forEach(combination => {
            combination.complexity = combination.factors.length;
        });

        // Note: Legacy hardcoded combinations removed - now using rule files

        return combinations;
    }

    generateAdaptiveCombinations() {
        if (this.previousResults.iterations.length === 0) {
            return [];
        }

        const adaptiveCombinations = [];
        const lastIteration = this.previousResults.iterations[this.previousResults.iterations.length - 1];
        
        // Analyze successful patterns
        const successfulCombinations = lastIteration.results
            .filter(r => Math.abs(r.correlation) > 0.15 || r.profitability > 0.05)
            .sort((a, b) => b.correlation - a.correlation);

        // Generate variations of successful combinations
        successfulCombinations.slice(0, 5).forEach((successful, index) => {
            // Add complementary factors
            const complementaryFactors = this.getComplementaryFactors(successful.factors);
            
            complementaryFactors.forEach(factor => {
                adaptiveCombinations.push({
                    name: `Adaptive_${successful.name}_Plus_${factor.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    factors: [...successful.factors, factor],
                    type: 'adaptive',
                    hypothesis: `Extending successful ${successful.name} with ${factor}`,
                    complexity: successful.factors.length + 1,
                    parentPerformance: successful.correlation
                });
            });

            // Create ratio combinations
            if (successful.factors.length === 2) {
                adaptiveCombinations.push({
                    name: `Adaptive_Ratio_${successful.name}`,
                    factors: [`(${successful.factors[0]}) / (${successful.factors[1]})`],
                    type: 'adaptive_ratio',
                    hypothesis: `Ratio of successful factors in ${successful.name}`,
                    complexity: 2,
                    parentPerformance: successful.correlation
                });
            }
        });

        return adaptiveCombinations;
    }

    getComplementaryFactors(existingFactors) {
        const allFactors = [
            ...this.baseFactors.xg,
            ...this.baseFactors.performance,
            ...this.baseFactors.odds,
            ...this.baseFactors.marketEfficiency,
            ...this.baseFactors.context
        ];

        return allFactors.filter(factor => !existingFactors.includes(factor));
    }

    generateCombinations() {
        console.log('Generating factor combinations for Asian Handicap analysis...');
        
        const initialCombinations = this.generateInitialCombinations();
        const adaptiveCombinations = this.generateAdaptiveCombinations();
        
        const allCombinations = [...initialCombinations, ...adaptiveCombinations];
        
        // Sort by complexity and potential value
        const sortedCombinations = _.sortBy(allCombinations, [
            'complexity',
            combination => combination.parentPerformance ? -combination.parentPerformance : 0
        ]);

        const metadata = {
            generatedAt: new Date().toISOString(),
            totalCombinations: allCombinations.length,
            initialCombinations: initialCombinations.length,
            adaptiveCombinations: adaptiveCombinations.length,
            previousIterations: this.previousResults.iterations.length,
            categories: {
                single: allCombinations.filter(c => c.type === 'single').length,
                domain: allCombinations.filter(c => c.type === 'domain').length,
                complex: allCombinations.filter(c => c.type === 'complex').length,
                adaptive: allCombinations.filter(c => c.type === 'adaptive').length,
                adaptive_ratio: allCombinations.filter(c => c.type === 'adaptive_ratio').length
            }
        };

        const output = {
            metadata,
            combinations: sortedCombinations,
            previousResults: this.previousResults
        };

        fs.writeFileSync(this.combinationsPath, JSON.stringify(output, null, 2));
        
        console.log(`Generated ${allCombinations.length} combinations:`);
        console.log(`- Initial: ${initialCombinations.length}`);
        console.log(`- Adaptive: ${adaptiveCombinations.length}`);
        console.log(`Saved to: ${this.combinationsPath}`);

        return output;
    }

    analyzeFactorImportance() {
        if (this.previousResults.iterations.length === 0) {
            console.log('No previous results to analyze');
            return;
        }

        const factorPerformance = {};
        
        this.previousResults.iterations.forEach(iteration => {
            iteration.results.forEach(result => {
                result.factors.forEach(factor => {
                    if (!factorPerformance[factor]) {
                        factorPerformance[factor] = {
                            appearances: 0,
                            totalCorrelation: 0,
                            bestCorrelation: 0,
                            totalProfitability: 0,
                            bestProfitability: 0
                        };
                    }
                    
                    const perf = factorPerformance[factor];
                    perf.appearances++;
                    perf.totalCorrelation += Math.abs(result.correlation);
                    perf.bestCorrelation = Math.max(perf.bestCorrelation, Math.abs(result.correlation));
                    perf.totalProfitability += result.profitability;
                    perf.bestProfitability = Math.max(perf.bestProfitability, result.profitability);
                });
            });
        });

        Object.keys(factorPerformance).forEach(factor => {
            const perf = factorPerformance[factor];
            perf.avgCorrelation = perf.totalCorrelation / perf.appearances;
            perf.avgProfitability = perf.totalProfitability / perf.appearances;
        });

        const topFactors = Object.entries(factorPerformance)
            .sort((a, b) => b[1].avgCorrelation - a[1].avgCorrelation)
            .slice(0, 10);

        console.log('\nTop performing factors:');
        topFactors.forEach(([factor, perf], index) => {
            console.log(`${index + 1}. ${factor}`);
            console.log(`   Avg Correlation: ${perf.avgCorrelation.toFixed(4)}`);
            console.log(`   Best Correlation: ${perf.bestCorrelation.toFixed(4)}`);
            console.log(`   Appearances: ${perf.appearances}`);
        });
    }
}

if (require.main === module) {
    const generator = new AHCombinationGenerator();
    generator.analyzeFactorImportance();
    generator.generateCombinations();
}

module.exports = AHCombinationGenerator;