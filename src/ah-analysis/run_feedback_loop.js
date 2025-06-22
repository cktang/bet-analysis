#!/usr/bin/env node

const AHCombinationGenerator = require('./ah_combination_generator');
const AHCombinationTester = require('./ah_combination_tester');
const fs = require('fs');
const path = require('path');

class AHFeedbackLoop {
    constructor(maxIterations = 10) {
        this.maxIterations = maxIterations;
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        this.generator = new AHCombinationGenerator();
        this.tester = new AHCombinationTester();
    }

    async runLoop() {
        console.log('🔄 Starting Asian Handicap Analysis Feedback Loop');
        console.log(`Max iterations: ${this.maxIterations}`);
        console.log('=' * 50);

        for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
            console.log(`\n🔄 ITERATION ${iteration}/${this.maxIterations}`);
            console.log('=' * 30);

            try {
                // Step 1: Generate combinations
                console.log('📊 Step 1: Generating factor combinations...');
                const combinationsData = this.generator.generateCombinations();
                
                // Step 2: Test combinations
                console.log('🧪 Step 2: Testing combinations...');
                const testResults = this.tester.runTests();
                
                // Step 3: Analyze results and provide feedback
                console.log('📈 Step 3: Analyzing results...');
                const insights = this.analyzeResults(testResults, iteration);
                
                // Step 4: Check if we should continue
                const shouldContinue = this.shouldContinue(insights, iteration);
                
                console.log(`\n📊 Iteration ${iteration} Summary:`);
                console.log(`- Combinations tested: ${insights.totalCombinations}`);
                console.log(`- Significant correlations: ${insights.significantCorrelations}`);
                console.log(`- Profitable strategies: ${insights.profitableStrategies}`);
                console.log(`- Best correlation: ${insights.bestCorrelation.toFixed(4)}`);
                console.log(`- Best profitability: ${(insights.bestProfitability * 100).toFixed(2)}%`);
                
                if (!shouldContinue) {
                    console.log('🎯 Convergence achieved or improvement plateau reached. Stopping loop.');
                    break;
                }
                
                // Wait a moment before next iteration
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error in iteration ${iteration}:`, error.message);
                break;
            }
        }

        console.log('\n🏁 Feedback loop completed');
        this.generateFinalReport();
    }

    analyzeResults(testResults, iteration) {
        const insights = {
            iteration,
            totalCombinations: testResults.summary.totalCombinations,
            significantCorrelations: testResults.summary.significantCorrelations,
            profitableStrategies: testResults.summary.profitableStrategies,
            bestCorrelation: testResults.summary.bestCorrelation,
            bestProfitability: testResults.summary.bestProfitability,
            avgCorrelation: testResults.summary.avgCorrelation,
            improvement: 0
        };

        // Calculate improvement from previous iteration
        if (fs.existsSync(this.resultsPath)) {
            const historicalData = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
            if (historicalData.iterations.length > 1) {
                const previousIteration = historicalData.iterations[historicalData.iterations.length - 2];
                insights.improvement = insights.bestCorrelation - previousIteration.summary.bestCorrelation;
            }
        }

        return insights;
    }

    shouldContinue(insights, iteration) {
        // Stop if we've reached max iterations
        if (iteration >= this.maxIterations) {
            return false;
        }

        // Stop if we found very strong correlations (>0.5)
        if (insights.bestCorrelation > 0.5) {
            console.log('🎯 Very strong correlation found');
            return false;
        }

        // Stop if improvement is minimal (<0.01) for multiple iterations
        if (iteration > 3 && insights.improvement < 0.01) {
            console.log('📉 Minimal improvement detected');
            return false;
        }

        // Continue if we have profitable strategies to explore
        if (insights.profitableStrategies > 0) {
            console.log('💰 Profitable strategies found, continuing...');
            return true;
        }

        // Continue if we have significant correlations
        if (insights.significantCorrelations > 0) {
            console.log('📊 Significant correlations found, continuing...');
            return true;
        }

        // Stop if no promising results
        return false;
    }

    generateFinalReport() {
        console.log('\n📋 Generating Final Report...');
        
        if (!fs.existsSync(this.resultsPath)) {
            console.log('❌ No results file found');
            return;
        }

        const historicalData = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
        const reportPath = path.join(__dirname, '../../data/processed/ah_final_report.json');
        
        const report = {
            generatedAt: new Date().toISOString(),
            totalIterations: historicalData.iterations.length,
            bestOverallCombinations: historicalData.bestCombinations.slice(0, 10),
            iterationProgress: historicalData.iterations.map(iter => ({
                timestamp: iter.timestamp,
                bestCorrelation: iter.summary.bestCorrelation,
                profitableStrategies: iter.summary.profitableStrategies,
                significantCorrelations: iter.summary.significantCorrelations
            })),
            recommendations: this.generateRecommendations(historicalData),
            keyInsights: this.extractKeyInsights(historicalData)
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n🎯 FINAL RECOMMENDATIONS:');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        
        console.log('\n💡 KEY INSIGHTS:');
        report.keyInsights.forEach((insight, index) => {
            console.log(`${index + 1}. ${insight}`);
        });
        
        console.log(`\n📄 Full report saved to: ${reportPath}`);
    }

    generateRecommendations(historicalData) {
        const recommendations = [];
        const bestCombinations = historicalData.bestCombinations.slice(0, 5);
        
        if (bestCombinations.length > 0) {
            const topCombo = bestCombinations[0];
            recommendations.push(`Focus on "${topCombo.name}" - shows ${topCombo.correlation.toFixed(4)} correlation and ${(topCombo.profitability * 100).toFixed(2)}% profitability`);
        }

        const profitableCombos = historicalData.bestCombinations.filter(c => c.profitability > 0.02);
        if (profitableCombos.length > 0) {
            recommendations.push(`${profitableCombos.length} combinations show >2% profitability - consider ensemble approach`);
        }

        const xgCombos = historicalData.bestCombinations.filter(c => 
            c.factors.some(f => f.includes('XG') || f.includes('xG'))
        );
        if (xgCombos.length > 0) {
            recommendations.push(`Expected Goals (XG) appears in ${xgCombos.length} top combinations - strong predictive factor`);
        }

        if (recommendations.length === 0) {
            recommendations.push('No strongly predictive factors found - consider external data sources or different time periods');
        }

        return recommendations;
    }

    extractKeyInsights(historicalData) {
        const insights = [];
        
        // Factor frequency analysis
        const factorFrequency = {};
        historicalData.bestCombinations.forEach(combo => {
            combo.factors.forEach(factor => {
                factorFrequency[factor] = (factorFrequency[factor] || 0) + 1;
            });
        });

        const topFactors = Object.entries(factorFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([factor, count]) => `${factor} (${count} times)`);

        if (topFactors.length > 0) {
            insights.push(`Most frequent factors in top combinations: ${topFactors.join(', ')}`);
        }

        // Correlation patterns
        const avgCorrelation = historicalData.bestCombinations.reduce((sum, c) => sum + c.correlation, 0) / historicalData.bestCombinations.length;
        insights.push(`Average correlation across best combinations: ${avgCorrelation.toFixed(4)}`);

        // Profitability patterns
        const profitableCombos = historicalData.bestCombinations.filter(c => c.profitability > 0);
        if (profitableCombos.length > 0) {
            const avgProfitability = profitableCombos.reduce((sum, c) => sum + c.profitability, 0) / profitableCombos.length;
            insights.push(`${profitableCombos.length}/${historicalData.bestCombinations.length} combinations profitable, avg ${(avgProfitability * 100).toFixed(2)}%`);
        }

        return insights;
    }
}

// Run the feedback loop if called directly
if (require.main === module) {
    const loop = new AHFeedbackLoop();
    loop.runLoop().catch(console.error);
}

module.exports = AHFeedbackLoop;