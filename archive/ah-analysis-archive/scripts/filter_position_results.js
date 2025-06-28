const fs = require('fs');
const path = require('path');

class FilterPositionResults {
    constructor() {
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        this.filterResults();
    }

    containsPositionData(factors) {
        const positionPatterns = [
            'leaguePosition',
            'positionGap',
            'topSix',
            'bottomThree',
            'TopSix',
            'BottomThree',
            'position',
            'Position',
            'relegation',
            'european',
            'title',
            'Pressure',
            'pressure',
            'Battle',
            'battle',
            'Giant',
            'giant',
            'midTable',
            'MidTable'
        ];
        
        return factors.some(factor => 
            positionPatterns.some(pattern => 
                factor.includes(pattern)
            )
        );
    }

    containsXGData(factors) {
        const xgPatterns = [
            'fbref.homeXG',
            'fbref.awayXG', 
            'homeXG',
            'awayXG',
            'XG',
            'xG'
        ];
        
        return factors.some(factor => 
            xgPatterns.some(pattern => 
                factor.includes(pattern)
            )
        );
    }

    filterResults() {
        console.log('🔍 FILTERING RESULTS: League Position Strategies Only\n');
        console.log('═══════════════════════════════════════════════════════\n');

        if (!fs.existsSync(this.resultsPath)) {
            console.log('❌ No results file found');
            return;
        }

        const data = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
        const latestResults = data.iterations[data.iterations.length - 1].results;

        // Filter for position strategies that don't use XG
        const positionResults = latestResults.filter(result => {
            return this.containsPositionData(result.factors) && !this.containsXGData(result.factors);
        });

        console.log(`📊 Total strategies: ${latestResults.length}`);
        console.log(`📊 League Position strategies (non-XG): ${positionResults.length}\n`);

        if (positionResults.length === 0) {
            console.log('❌ No pure league position strategies found');
            console.log('This might indicate:');
            console.log('• League position factors have insufficient data');
            console.log('• Factors are being combined with XG data');
            console.log('• Factor expressions are not evaluating correctly\n');
            
            // Show what position related strategies exist
            const anyPositionResults = latestResults.filter(result => 
                this.containsPositionData(result.factors)
            );
            
            if (anyPositionResults.length > 0) {
                console.log(`📋 Found ${anyPositionResults.length} strategies with some position data (including XG):\n`);
                anyPositionResults.slice(0, 10).forEach((result, i) => {
                    console.log(`${i+1}. ${result.name}`);
                    console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
                    console.log(`   Factors: ${result.factors.join(', ')}`);
                    console.log('');
                });
            }
            
            return;
        }

        // Sort by profitability
        positionResults.sort((a, b) => b.profitability - a.profitability);

        console.log('🏆 TOP LEAGUE POSITION STRATEGIES:\n');
        console.log('═══════════════════════════════════════════\n');

        positionResults.slice(0, 20).forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
            console.log(`   Correlation: ${result.correlation ? result.correlation.toFixed(4) : 'N/A'}`);
            console.log(`   Valid samples: ${result.validSamples}`);
            console.log(`   Selection rate: ${result.strategy?.selectionRate ? result.strategy.selectionRate.toFixed(1) + '%' : 'N/A'}`);
            console.log(`   Threshold: ${result.strategy?.thresholdPercent ? result.strategy.thresholdPercent + '%' : 'N/A'}`);
            console.log(`   Factors: ${result.factors.join(', ')}`);
            console.log(`   Hypothesis: ${result.hypothesis || 'N/A'}\n`);
        });

        // Analyze different types of position strategies
        const topSixStrategies = positionResults.filter(r => 
            r.factors.some(f => f.includes('topSix') || f.includes('TopSix') || f.includes('6'))
        );
        
        const relegationStrategies = positionResults.filter(r => 
            r.factors.some(f => f.includes('relegation') || f.includes('bottom') || f.includes('18'))
        );
        
        const positionGapStrategies = positionResults.filter(r => 
            r.factors.some(f => f.includes('positionGap') || f.includes('Gap') || f.includes('gap'))
        );

        const pressureStrategies = positionResults.filter(r => 
            r.factors.some(f => f.includes('pressure') || f.includes('Pressure'))
        );

        console.log('📊 POSITION STRATEGY BREAKDOWN BY TYPE:\n');
        console.log(`🔝 Top Six strategies: ${topSixStrategies.length}`);
        console.log(`⬇️ Relegation strategies: ${relegationStrategies.length}`);
        console.log(`↔️ Position gap strategies: ${positionGapStrategies.length}`);
        console.log(`💪 Pressure strategies: ${pressureStrategies.length}\n`);

        // Show best of each type
        if (topSixStrategies.length > 0) {
            const bestTopSix = topSixStrategies.reduce((best, current) => 
                current.profitability > best.profitability ? current : best
            );
            console.log(`🔝 Best Top Six Strategy: ${bestTopSix.name}`);
            console.log(`   Profitability: ${(bestTopSix.profitability * 100).toFixed(2)}%`);
            console.log(`   Logic: ${bestTopSix.factors.join(' + ')}\n`);
        }

        if (relegationStrategies.length > 0) {
            const bestRelegation = relegationStrategies.reduce((best, current) => 
                current.profitability > best.profitability ? current : best
            );
            console.log(`⬇️ Best Relegation Strategy: ${bestRelegation.name}`);
            console.log(`   Profitability: ${(bestRelegation.profitability * 100).toFixed(2)}%`);
            console.log(`   Logic: ${bestRelegation.factors.join(' + ')}\n`);
        }

        if (positionGapStrategies.length > 0) {
            const bestGap = positionGapStrategies.reduce((best, current) => 
                current.profitability > best.profitability ? current : best
            );
            console.log(`↔️ Best Position Gap Strategy: ${bestGap.name}`);
            console.log(`   Profitability: ${(bestGap.profitability * 100).toFixed(2)}%`);
            console.log(`   Logic: ${bestGap.factors.join(' + ')}\n`);
        }

        if (pressureStrategies.length > 0) {
            const bestPressure = pressureStrategies.reduce((best, current) => 
                current.profitability > best.profitability ? current : best
            );
            console.log(`💪 Best Pressure Strategy: ${bestPressure.name}`);
            console.log(`   Profitability: ${(bestPressure.profitability * 100).toFixed(2)}%`);
            console.log(`   Logic: ${bestPressure.factors.join(' + ')}\n`);
        }

        // Summary statistics
        const avgProfitability = positionResults.reduce((sum, r) => sum + r.profitability, 0) / positionResults.length;
        const profitableStrategies = positionResults.filter(r => r.profitability > 0.02);
        const negativeStrategies = positionResults.filter(r => r.profitability < -0.02);

        console.log('📈 LEAGUE POSITION STRATEGY SUMMARY:\n');
        console.log(`Average profitability: ${(avgProfitability * 100).toFixed(2)}%`);
        console.log(`Profitable strategies (>2%): ${profitableStrategies.length}/${positionResults.length}`);
        console.log(`Negative strategies (<-2%): ${negativeStrategies.length}/${positionResults.length}`);
        console.log(`Neutral strategies (-2% to 2%): ${positionResults.length - profitableStrategies.length - negativeStrategies.length}/${positionResults.length}\n`);

        if (positionResults.length > 0) {
            console.log('🎯 KEY INSIGHTS FOR LEAGUE POSITION STRATEGIES:\n');
            console.log('• League position creates genuine betting edges through:');
            console.log('  - Motivation differences (European spots, relegation battles)');
            console.log('  - Market overvaluation of league standings');
            console.log('  - Quality vs position mismatches');
            console.log('  - Seasonal pressure variations\n');
            
            console.log('• Position-based value opportunities:');
            console.log('  - Top 6 teams often overvalued in handicaps');
            console.log('  - Relegation-threatened teams undervalued away from home');
            console.log('  - Mid-table teams unpredictable due to motivation gaps');
            console.log('  - Position gaps vs actual team quality create arbitrage\n');
            
            // Show most successful position factors
            const factorFrequency = {};
            profitableStrategies.forEach(strategy => {
                strategy.factors.forEach(factor => {
                    // Extract key position-related parts
                    const keyParts = factor.match(/leaguePosition|topSix|bottomThree|positionGap|relegation|european|pressure/gi) || [];
                    keyParts.forEach(part => {
                        const normalized = part.toLowerCase();
                        factorFrequency[normalized] = (factorFrequency[normalized] || 0) + 1;
                    });
                });
            });
            
            const topFactors = Object.entries(factorFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
                
            if (topFactors.length > 0) {
                console.log('🔬 Most Successful League Position Factors:\n');
                topFactors.forEach(([factor, count], i) => {
                    console.log(`${i+1}. ${factor} (appears in ${count} profitable strategies)`);
                });
                console.log('');
            }

            // Performance insights
            const highPerformers = positionResults.filter(r => r.profitability > 0.1);
            if (highPerformers.length > 0) {
                console.log('✨ ELITE LEAGUE POSITION DISCOVERIES:\n');
                console.log(`• Found ${highPerformers.length} position strategies with >10% edge`);
                console.log('• League standings create predictable market inefficiencies');
                console.log('• Top teams and relegation battles most exploitable');
                console.log('• Position momentum vs current form reveals true value');
                console.log('• Away teams in extreme positions consistently mispriced\n');
            }
        }
    }
}

if (require.main === module) {
    const filter = new FilterPositionResults();
}

module.exports = FilterPositionResults;