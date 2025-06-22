const fs = require('fs');
const path = require('path');

class FilterFormStreakResults {
    constructor() {
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        this.filterResults();
    }

    containsFormStreakData(factors) {
        const formPatterns = [
            'timeSeries',
            'streaks',
            'current',
            'longest',
            'form',
            'momentum',
            'goalDifference',
            'asianHandicapWinRate',
            'overRate',
            'matchesPlayed',
            'venueMatches',
            'streakDifferential',
            'ahSuccessGap',
            'combinedOverRate'
        ];
        
        return factors.some(factor => 
            formPatterns.some(pattern => 
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
        console.log('🔍 FILTERING RESULTS: Form & Streak Strategies Only\n');
        console.log('═══════════════════════════════════════════════════\n');

        if (!fs.existsSync(this.resultsPath)) {
            console.log('❌ No results file found');
            return;
        }

        const data = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
        const latestResults = data.iterations[data.iterations.length - 1].results;

        // Filter for form/streak strategies that don't use XG
        const formStreakResults = latestResults.filter(result => {
            return this.containsFormStreakData(result.factors) && !this.containsXGData(result.factors);
        });

        console.log(`📊 Total strategies: ${latestResults.length}`);
        console.log(`📊 Form/Streak strategies (non-XG): ${formStreakResults.length}\n`);

        if (formStreakResults.length === 0) {
            console.log('❌ No pure form/streak strategies found');
            console.log('This might indicate:');
            console.log('• Form/streak factors have insufficient data');
            console.log('• Factors are being combined with XG data');
            console.log('• Factor expressions are not evaluating correctly\n');
            
            // Show what form/streak related strategies exist
            const anyFormResults = latestResults.filter(result => 
                this.containsFormStreakData(result.factors)
            );
            
            if (anyFormResults.length > 0) {
                console.log(`📋 Found ${anyFormResults.length} strategies with some form/streak data (including XG):\n`);
                anyFormResults.slice(0, 5).forEach((result, i) => {
                    console.log(`${i+1}. ${result.name}`);
                    console.log(`   Factors: ${result.factors.join(', ')}`);
                    console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%\n`);
                });
            }
            
            return;
        }

        // Sort by profitability
        formStreakResults.sort((a, b) => b.profitability - a.profitability);

        console.log('🏆 TOP FORM & STREAK STRATEGIES:\n');
        console.log('═════════════════════════════════════════\n');

        formStreakResults.slice(0, 15).forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
            console.log(`   Correlation: ${result.correlation ? result.correlation.toFixed(4) : 'N/A'}`);
            console.log(`   Valid samples: ${result.validSamples}`);
            console.log(`   Selection rate: ${result.strategy?.selectionRate ? result.strategy.selectionRate.toFixed(1) + '%' : 'N/A'}`);
            console.log(`   Factors: ${result.factors.join(', ')}`);
            console.log(`   Hypothesis: ${result.hypothesis || 'N/A'}\n`);
        });

        // Analyze different types of form strategies
        const streakStrategies = formStreakResults.filter(r => 
            r.factors.some(f => f.includes('streak') || f.includes('Streak'))
        );
        
        const momentumStrategies = formStreakResults.filter(r => 
            r.factors.some(f => f.includes('momentum') || f.includes('Momentum') || f.includes('Differential'))
        );
        
        const ahSpecificStrategies = formStreakResults.filter(r => 
            r.factors.some(f => f.includes('asianHandicap') || f.includes('AH'))
        );

        console.log('📊 STRATEGY BREAKDOWN BY TYPE:\n');
        console.log(`🔥 Streak-based strategies: ${streakStrategies.length}`);
        console.log(`⚡ Momentum-based strategies: ${momentumStrategies.length}`);
        console.log(`🎯 AH-specific strategies: ${ahSpecificStrategies.length}\n`);

        // Show best of each type
        if (streakStrategies.length > 0) {
            const bestStreak = streakStrategies.reduce((best, current) => 
                current.profitability > best.profitability ? current : best
            );
            console.log(`🔥 Best Streak Strategy: ${bestStreak.name}`);
            console.log(`   Profitability: ${(bestStreak.profitability * 100).toFixed(2)}%\n`);
        }

        if (momentumStrategies.length > 0) {
            const bestMomentum = momentumStrategies.reduce((best, current) => 
                current.profitability > best.profitability ? current : best
            );
            console.log(`⚡ Best Momentum Strategy: ${bestMomentum.name}`);
            console.log(`   Profitability: ${(bestMomentum.profitability * 100).toFixed(2)}%\n`);
        }

        if (ahSpecificStrategies.length > 0) {
            const bestAH = ahSpecificStrategies.reduce((best, current) => 
                current.profitability > best.profitability ? current : best
            );
            console.log(`🎯 Best AH-Specific Strategy: ${bestAH.name}`);
            console.log(`   Profitability: ${(bestAH.profitability * 100).toFixed(2)}%\n`);
        }

        // Summary statistics
        const avgProfitability = formStreakResults.reduce((sum, r) => sum + r.profitability, 0) / formStreakResults.length;
        const profitableStrategies = formStreakResults.filter(r => r.profitability > 0.02);
        const negativeStrategies = formStreakResults.filter(r => r.profitability < -0.02);

        console.log('📈 FORM/STREAK STRATEGY SUMMARY:\n');
        console.log(`Average profitability: ${(avgProfitability * 100).toFixed(2)}%`);
        console.log(`Profitable strategies (>2%): ${profitableStrategies.length}/${formStreakResults.length}`);
        console.log(`Negative strategies (<-2%): ${negativeStrategies.length}/${formStreakResults.length}`);
        console.log(`Neutral strategies (-2% to 2%): ${formStreakResults.length - profitableStrategies.length - negativeStrategies.length}/${formStreakResults.length}\n`);

        if (formStreakResults.length > 0) {
            console.log('🎯 KEY INSIGHTS FOR FORM/STREAK STRATEGIES:\n');
            console.log('• Form and momentum can provide genuine edges in sports betting');
            console.log('• Teams on streaks may be under/overvalued by market perception');
            console.log('• Asian Handicap specific form history may be more predictive than general form');
            console.log('• Momentum differentials between teams can create value opportunities');
            console.log('• Venue-specific and time-based patterns may reveal hidden edges\n');
            
            // Show factors that appear most frequently in profitable strategies
            const factorFrequency = {};
            profitableStrategies.forEach(strategy => {
                strategy.factors.forEach(factor => {
                    // Extract key parts of complex expressions
                    const keyParts = factor.match(/timeSeries\.\w+\.\w+\.\w+|\w+Streak|\w+Rate|\w+Differential/g) || [factor];
                    keyParts.forEach(part => {
                        factorFrequency[part] = (factorFrequency[part] || 0) + 1;
                    });
                });
            });
            
            const topFactors = Object.entries(factorFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
                
            if (topFactors.length > 0) {
                console.log('🔬 Most Successful Form/Streak Factors:\n');
                topFactors.forEach(([factor, count], i) => {
                    console.log(`${i+1}. ${factor} (appears in ${count} profitable strategies)`);
                });
            }
        }
    }
}

if (require.main === module) {
    const filter = new FilterFormStreakResults();
}

module.exports = FilterFormStreakResults;