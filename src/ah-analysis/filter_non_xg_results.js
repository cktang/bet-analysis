const fs = require('fs');
const path = require('path');

class FilterNonXGResults {
    constructor() {
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        this.filterResults();
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
        console.log('🔍 FILTERING RESULTS: Non-XG Strategies Only\n');
        console.log('═══════════════════════════════════════════════\n');

        if (!fs.existsSync(this.resultsPath)) {
            console.log('❌ No results file found');
            return;
        }

        const data = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
        const latestResults = data.iterations[data.iterations.length - 1].results;

        // Filter out any strategy that uses XG data
        const nonXGResults = latestResults.filter(result => {
            return !this.containsXGData(result.factors);
        });

        console.log(`📊 Total strategies: ${latestResults.length}`);
        console.log(`📊 Non-XG strategies: ${nonXGResults.length}\n`);

        // Sort by profitability
        nonXGResults.sort((a, b) => b.profitability - a.profitability);

        // Show top 15 non-XG strategies
        console.log('🏆 TOP 15 NON-XG STRATEGIES:\n');
        console.log('═══════════════════════════════════════\n');

        nonXGResults.slice(0, 15).forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
            console.log(`   Correlation: ${result.correlation ? result.correlation.toFixed(4) : 'N/A'}`);
            console.log(`   Valid samples: ${result.validSamples}`);
            console.log(`   Factors: ${result.factors.join(', ')}`);
            console.log(`   Hypothesis: ${result.hypothesis || 'N/A'}\n`);
        });

        // Analysis of realistic strategies (< 5% profitability)
        const realisticStrategies = nonXGResults.filter(r => 
            Math.abs(r.profitability) < 0.05 && r.validSamples >= 100
        );

        console.log('✅ REALISTIC STRATEGIES (< 5% edge):\n');
        console.log('═══════════════════════════════════════\n');

        if (realisticStrategies.length === 0) {
            console.log('❌ No realistic strategies found - all show unrealistic edges\n');
        } else {
            realisticStrategies.slice(0, 10).forEach((result, index) => {
                console.log(`${index + 1}. ${result.name}`);
                console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
                console.log(`   Correlation: ${result.correlation ? result.correlation.toFixed(4) : 'N/A'}`);
                console.log(`   Valid samples: ${result.validSamples}`);
                console.log(`   Factors: ${result.factors.join(', ')}\n`);
            });
        }

        // Check for market efficiency patterns
        const awayImpliedProbStrategies = nonXGResults.filter(r => 
            r.factors.some(f => f.includes('awayImpliedProb'))
        );

        console.log('🎯 AWAY IMPLIED PROBABILITY STRATEGIES:\n');
        console.log('═══════════════════════════════════════\n');

        awayImpliedProbStrategies.slice(0, 5).forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
            console.log(`   Correlation: ${result.correlation ? result.correlation.toFixed(4) : 'N/A'}`);
            console.log(`   Factors: ${result.factors.join(', ')}\n`);
        });

        // Summary statistics
        const avgProfitability = nonXGResults.reduce((sum, r) => sum + r.profitability, 0) / nonXGResults.length;
        const profitableStrategies = nonXGResults.filter(r => r.profitability > 0.02);
        const negativeStrategies = nonXGResults.filter(r => r.profitability < -0.02);

        console.log('📈 SUMMARY STATISTICS:\n');
        console.log(`Average profitability: ${(avgProfitability * 100).toFixed(2)}%`);
        console.log(`Profitable strategies (>2%): ${profitableStrategies.length}/${nonXGResults.length}`);
        console.log(`Negative strategies (<-2%): ${negativeStrategies.length}/${nonXGResults.length}`);
        console.log(`Neutral strategies (-2% to 2%): ${nonXGResults.length - profitableStrategies.length - negativeStrategies.length}/${nonXGResults.length}\n`);

        if (profitableStrategies.length > nonXGResults.length * 0.3) {
            console.log('⚠️ High percentage of profitable strategies suggests data issues remain');
        } else {
            console.log('✅ Reasonable distribution of strategy performance');
        }
    }
}

if (require.main === module) {
    const filter = new FilterNonXGResults();
}

module.exports = FilterNonXGResults;