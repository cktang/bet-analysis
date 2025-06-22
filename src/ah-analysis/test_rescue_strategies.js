const fs = require('fs');
const path = require('path');

class RescueStrategyTester {
    constructor() {
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        this.testRescueStrategies();
    }

    testRescueStrategies() {
        console.log('🚀 TESTING RESCUE STRATEGIES PERFORMANCE\n');
        console.log('═══════════════════════════════════════════════════════\n');

        if (!fs.existsSync(this.resultsPath)) {
            console.log('❌ No results file found');
            return;
        }

        const data = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
        const latestResults = data.iterations[data.iterations.length - 1].results;

        // Filter for rescue-related strategies
        const rescueStrategies = latestResults.filter(result => {
            const name = result.name.toLowerCase();
            return (
                name.includes('motivatedposition') ||
                name.includes('qualityteam') ||
                name.includes('extrememarket') ||
                name.includes('smartposition') ||
                name.includes('fallinggiant') ||
                name.includes('risingunderdog') ||
                name.includes('marketlag') ||
                name.includes('rescue') ||
                name.includes('motivated') ||
                name.includes('quality') ||
                name.includes('extreme') ||
                name.includes('falling') ||
                name.includes('rising') ||
                // Check factor content too
                result.factors.some(factor => 
                    factor.includes('motivatedPosition') ||
                    factor.includes('qualityTeam') ||
                    factor.includes('extremeMarket') ||
                    factor.includes('fallingGiant') ||
                    factor.includes('risingUnderdog')
                )
            );
        });

        console.log(`📊 Found ${rescueStrategies.length} rescue-related strategies\n`);

        if (rescueStrategies.length === 0) {
            console.log('❌ No rescue strategies found in results.');
            console.log('This could mean:');
            console.log('• Strategies had evaluation errors');
            console.log('• Factor expressions are too complex');
            console.log('• Data structure doesn\'t match expectations\n');
            
            // Show sample of what was actually tested
            console.log('📋 Sample of strategies that were tested:');
            latestResults.slice(0, 10).forEach((result, i) => {
                console.log(`${i+1}. ${result.name} (${(result.profitability * 100).toFixed(2)}%)`);
            });
            return;
        }

        // Sort by profitability
        rescueStrategies.sort((a, b) => b.profitability - a.profitability);

        console.log('🏆 RESCUE STRATEGY PERFORMANCE:\n');
        console.log('═══════════════════════════════════════════\n');

        rescueStrategies.forEach((result, index) => {
            const isProfit = result.profitability > 0.02;
            const emoji = isProfit ? '✅' : result.profitability > -0.02 ? '⚠️' : '❌';
            
            console.log(`${emoji} ${index + 1}. ${result.name}`);
            console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
            console.log(`   Correlation: ${result.correlation ? result.correlation.toFixed(4) : 'N/A'}`);
            console.log(`   Valid samples: ${result.validSamples}`);
            console.log(`   Selection rate: ${result.strategy?.selectionRate ? result.strategy.selectionRate.toFixed(1) + '%' : 'N/A'}`);
            console.log(`   Factors: ${result.factors.slice(0, 2).join(', ')}${result.factors.length > 2 ? '...' : ''}`);
            console.log(`   Hypothesis: ${result.hypothesis || 'N/A'}`);
            if (result.error) {
                console.log(`   ⚠️ Error: ${result.error}`);
            }
            console.log('');
        });

        // Analysis by rescue type
        this.analyzeRescueTypes(rescueStrategies);
        
        // Summary statistics
        this.summarizeRescueResults(rescueStrategies);
    }

    analyzeRescueTypes(rescueStrategies) {
        console.log('📈 RESCUE STRATEGY ANALYSIS BY TYPE:\n');
        
        const types = {
            'Motivated Position': rescueStrategies.filter(r => r.name.toLowerCase().includes('motivatedposition')),
            'Quality Team Bad Form': rescueStrategies.filter(r => r.name.toLowerCase().includes('qualityteam')),
            'Extreme Market': rescueStrategies.filter(r => r.name.toLowerCase().includes('extrememarket')),
            'Falling Giant': rescueStrategies.filter(r => r.name.toLowerCase().includes('fallinggiant')),
            'Cross-Rule Combinations': rescueStrategies.filter(r => r.name.toLowerCase().includes('crossrule'))
        };

        Object.entries(types).forEach(([typeName, strategies]) => {
            if (strategies.length > 0) {
                const avgProfit = strategies.reduce((sum, s) => sum + s.profitability, 0) / strategies.length;
                const bestStrategy = strategies.reduce((best, current) => 
                    current.profitability > best.profitability ? current : best
                );
                
                console.log(`🎯 ${typeName}:`);
                console.log(`   Count: ${strategies.length}`);
                console.log(`   Average profit: ${(avgProfit * 100).toFixed(2)}%`);
                console.log(`   Best: ${bestStrategy.name} (${(bestStrategy.profitability * 100).toFixed(2)}%)`);
                console.log('');
            }
        });
    }

    summarizeRescueResults(rescueStrategies) {
        console.log('📊 RESCUE STRATEGY SUMMARY:\n');
        
        const profitable = rescueStrategies.filter(r => r.profitability > 0.02);
        const breakeven = rescueStrategies.filter(r => r.profitability >= -0.02 && r.profitability <= 0.02);
        const unprofitable = rescueStrategies.filter(r => r.profitability < -0.02);

        console.log(`Total rescue strategies: ${rescueStrategies.length}`);
        console.log(`Profitable (>2%): ${profitable.length} (${(profitable.length/rescueStrategies.length*100).toFixed(1)}%)`);
        console.log(`Break-even (-2% to 2%): ${breakeven.length} (${(breakeven.length/rescueStrategies.length*100).toFixed(1)}%)`);
        console.log(`Unprofitable (<-2%): ${unprofitable.length} (${(unprofitable.length/rescueStrategies.length*100).toFixed(1)}%)`);

        if (rescueStrategies.length > 0) {
            const avgProfit = rescueStrategies.reduce((sum, r) => sum + r.profitability, 0) / rescueStrategies.length;
            console.log(`Average profitability: ${(avgProfit * 100).toFixed(2)}%`);
            
            const bestRescue = rescueStrategies[0];
            console.log(`Best rescue: ${bestRescue.name} (${(bestRescue.profitability * 100).toFixed(2)}%)`);
        }

        console.log('\n🎓 KEY RESCUE LEARNINGS:\n');
        
        if (profitable.length > 0) {
            console.log('✅ SUCCESSFUL RESCUE PATTERNS:');
            profitable.slice(0, 3).forEach(strategy => {
                console.log(`• ${strategy.name}: ${(strategy.profitability * 100).toFixed(2)}%`);
                console.log(`  Logic: ${strategy.hypothesis || 'N/A'}`);
            });
            console.log('');
        }

        if (unprofitable.length > 0) {
            console.log('❌ FAILED RESCUE ATTEMPTS:');
            unprofitable.slice(-3).forEach(strategy => {
                console.log(`• ${strategy.name}: ${(strategy.profitability * 100).toFixed(2)}%`);
                console.log(`  Why it failed: Complex expressions may still lack proper context`);
            });
            console.log('');
        }

        console.log('💡 NEXT STEPS FOR RESCUE DEVELOPMENT:');
        console.log('• Simplify complex factor expressions');
        console.log('• Focus on extreme scenarios only');
        console.log('• Add more seasonal timing filters');
        console.log('• Test reverse psychology approaches');
        console.log('• Validate data availability for complex factors');
    }
}

if (require.main === module) {
    const tester = new RescueStrategyTester();
}

module.exports = RescueStrategyTester;