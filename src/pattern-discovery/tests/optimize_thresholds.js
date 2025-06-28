const { generateCombinations } = require('./combination_generator');
const { backtestCombination } = require('./backtester');
const fs = require('fs');

/**
 * Hyperparameter optimization for factor thresholds
 * Tests different threshold values to find optimal settings
 */

// Define threshold ranges to test
const THRESHOLD_RANGES = {
    // Time thresholds
    veryEarlyWeek: [3, 4, 5, 6],
    ultraEarlyWeek: [4, 5, 6, 7, 8],
    earlySeasonWeek: [6, 7, 8, 9, 10],
    businessEndWeek: [26, 27, 28, 29, 30],
    
    // Odds thresholds
    trappedOdds: [1.65, 1.70, 1.72, 1.75, 1.80],
    ultraTrappedOdds: [1.60, 1.62, 1.65, 1.67, 1.70],
    sweetSpotMin: [1.95, 2.00, 2.05],
    sweetSpotMax: [2.25, 2.30, 2.35, 2.40],
    closeOddsDiff: [0.05, 0.08, 0.10, 0.12, 0.15],
    
    // Position thresholds  
    topSixCutoff: [5, 6, 7, 8],
    topTenCutoff: [8, 9, 10, 11, 12],
    bottomSixCutoff: [14, 15, 16, 17],
    
    // Streak thresholds
    minStreak: [1, 2, 3],
    longStreakMin: [2, 3, 4, 5],
    streakFatigueMin: [3, 4, 5, 6],
    
    // Performance mismatch thresholds
    xgMismatchThreshold: [0.10, 0.12, 0.15, 0.18, 0.20],
    xgPerformanceGap: [0.2, 0.25, 0.3, 0.35, 0.4],
    positionDivergence: [6, 7, 8, 9, 10]
};

/**
 * Generate factor definitions with specific threshold values
 */
function generateFactorDefinitionsWithThresholds(thresholds) {
    const baseFactors = require('./factor_definitions');
    
    // Create a deep copy and modify thresholds
    const modifiedFactors = JSON.parse(JSON.stringify(baseFactors));
    
    // Update time factors
    modifiedFactors.time.veryEarly.expression = 
        `fbref.week >= 1 && fbref.week <= ${thresholds.veryEarlyWeek}`;
    modifiedFactors.time.ultraEarly.expression = 
        `fbref.week >= 1 && fbref.week <= ${thresholds.ultraEarlyWeek}`;
    modifiedFactors.time.earlySeason.expression = 
        `fbref.week >= 1 && fbref.week <= ${thresholds.earlySeasonWeek}`;
    modifiedFactors.time.businessEnd.expression = 
        `fbref.week >= ${thresholds.businessEndWeek}`;
    
    // Update odds factors
    modifiedFactors.oddsLevel.trapped.expression = 
        `Math.min(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= ${thresholds.trappedOdds}`;
    modifiedFactors.oddsLevel.ultraTrapped.expression = 
        `Math.min(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= ${thresholds.ultraTrappedOdds}`;
    modifiedFactors.oddsLevel.sweetSpot.expression = 
        `Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= ${thresholds.sweetSpotMin} && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= ${thresholds.sweetSpotMax}`;
    modifiedFactors.oddsLevel.closeOdds.expression = 
        `Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= ${thresholds.closeOddsDiff}`;
    
    // Update position factors
    modifiedFactors.context.topSixHome.expression = 
        `fbref.week >= 6 && (timeSeries.home.leaguePosition || 20) <= ${thresholds.topSixCutoff}`;
    modifiedFactors.context.topSixAway.expression = 
        `fbref.week >= 6 && (timeSeries.away.leaguePosition || 20) <= ${thresholds.topSixCutoff}`;
    modifiedFactors.context.topTenAway.expression = 
        `fbref.week >= 6 && (timeSeries.away.leaguePosition || 20) <= ${thresholds.topTenCutoff}`;
    modifiedFactors.context.bottomSixHome.expression = 
        `fbref.week >= 6 && (timeSeries.home.leaguePosition || 20) >= ${thresholds.bottomSixCutoff}`;
    modifiedFactors.context.bottomSixAway.expression = 
        `fbref.week >= 6 && (timeSeries.away.leaguePosition || 20) >= ${thresholds.bottomSixCutoff}`;
    
    // Update streak factors
    modifiedFactors.streaking.homeWinStreak.expression = 
        `timeSeries.home.streaks.overall.current.type === 'win' && timeSeries.home.streaks.overall.current.count >= ${thresholds.minStreak}`;
    modifiedFactors.streaking.homeLossStreak.expression = 
        `timeSeries.home.streaks.overall.current.type === 'loss' && timeSeries.home.streaks.overall.current.count >= ${thresholds.minStreak}`;
    modifiedFactors.streaking.awayWinStreak.expression = 
        `timeSeries.away.streaks.overall.current.type === 'win' && timeSeries.away.streaks.overall.current.count >= ${thresholds.minStreak}`;
    modifiedFactors.streaking.awayLossStreak.expression = 
        `timeSeries.away.streaks.overall.current.type === 'loss' && timeSeries.away.streaks.overall.current.count >= ${thresholds.minStreak}`;
    modifiedFactors.streaking.longStreak.expression = 
        `(timeSeries.home.streaks.overall.current.count >= ${thresholds.longStreakMin} || timeSeries.away.streaks.overall.current.count >= ${thresholds.longStreakMin})`;
    modifiedFactors.streaking.streakFatigue.expression = 
        `timeSeries.home.streaks.overall.current.count >= ${thresholds.streakFatigueMin} || timeSeries.away.streaks.overall.current.count >= ${thresholds.streakFatigueMin}`;
    
    // Update mismatch factors
    modifiedFactors.irregularity.xgMismatch.expression = 
        `Math.abs((timeSeries.home.averages.overall.xGDifference - timeSeries.away.averages.overall.xGDifference) - (preMatch.enhanced.homeImpliedProb - 0.5)) > ${thresholds.xgMismatchThreshold}`;
    modifiedFactors.irregularity.xgUnderperformance.expression = 
        `(timeSeries.home.averages.overall.xGFor - timeSeries.away.averages.overall.xGFor) < (timeSeries.home.averages.overall.goalsFor - timeSeries.away.averages.overall.goalsFor) - ${thresholds.xgPerformanceGap}`;
    modifiedFactors.irregularity.xgOverperformance.expression = 
        `(timeSeries.home.averages.overall.xGFor - timeSeries.away.averages.overall.xGFor) > (timeSeries.home.averages.overall.goalsFor - timeSeries.away.averages.overall.goalsFor) + ${thresholds.xgPerformanceGap}`;
    modifiedFactors.irregularity.positionFormDivergence.expression = 
        `Math.abs((timeSeries.home.leaguePosition || 20) - (timeSeries.away.leaguePosition || 20)) > ${thresholds.positionDivergence} && Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)) > 3`;
    
    return modifiedFactors;
}

/**
 * Generate all threshold combinations for testing
 */
function generateThresholdCombinations(maxCombinations = 1000) {
    const keys = Object.keys(THRESHOLD_RANGES);
    const combinations = [];
    
    // Generate random combinations to test
    for (let i = 0; i < maxCombinations; i++) {
        const combination = {};
        
        for (const key of keys) {
            const range = THRESHOLD_RANGES[key];
            combination[key] = range[Math.floor(Math.random() * range.length)];
        }
        
        // Add some validation rules
        if (combination.ultraEarlyWeek >= combination.veryEarlyWeek &&
            combination.veryEarlyWeek >= combination.earlySeasonWeek &&
            combination.ultraTrappedOdds <= combination.trappedOdds &&
            combination.sweetSpotMin <= combination.sweetSpotMax &&
            combination.topSixCutoff <= combination.topTenCutoff &&
            combination.minStreak <= combination.longStreakMin &&
            combination.longStreakMin <= combination.streakFatigueMin) {
            combinations.push(combination);
        }
    }
    
    return combinations;
}

/**
 * Test threshold combinations and find optimal values
 */
async function optimizeThresholds() {
    console.log('🔧 Starting threshold optimization...');
    
    const thresholdCombinations = generateThresholdCombinations(500);
    console.log(`Generated ${thresholdCombinations.length} threshold combinations to test`);
    
    const results = [];
    
    for (let i = 0; i < thresholdCombinations.length; i++) {
        const thresholds = thresholdCombinations[i];
        
        console.log(`\n📊 Testing combination ${i + 1}/${thresholdCombinations.length}`);
        console.log('Thresholds:', JSON.stringify(thresholds, null, 2));
        
        try {
            // Generate modified factor definitions
            const modifiedFactors = generateFactorDefinitionsWithThresholds(thresholds);
            
            // Save temporary factor file
            const tempFactorFile = `./temp_factors_${i}.js`;
            fs.writeFileSync(tempFactorFile, `module.exports = ${JSON.stringify(modifiedFactors, null, 2)};`);
            
            // Test a few high-performing combinations from original analysis
            const testCombinations = [
                'side-away_size-fix_time-veryEarly_handicapType-quarter',
                'side-away_size-fix_time-ultraEarly_oddsLevel-trapped',
                'side-away_size-fix_time-earlySeason_context-topTenAway',
                'side-home_size-fix_streaking-homeLossStreak_oddsLevel-sweetSpot'
            ];
            
            let totalROI = 0;
            let totalAccuracy = 0;
            let validCombinations = 0;
            
            for (const combination of testCombinations) {
                try {
                    // Temporarily override factor definitions
                    delete require.cache[require.resolve('./factor_definitions')];
                    require.cache[require.resolve('./factor_definitions')] = require.cache[require.resolve(tempFactorFile)];
                    
                    const result = await backtestCombination(combination, 100); // Test on subset
                    
                    if (result && result.totalBets > 10) {
                        totalROI += result.totalROI;
                        totalAccuracy += result.accuracy;
                        validCombinations++;
                    }
                } catch (error) {
                    console.log(`  ❌ Error testing ${combination}:`, error.message);
                }
            }
            
            // Clean up temp file
            fs.unlinkSync(tempFactorFile);
            
            if (validCombinations > 0) {
                const avgROI = totalROI / validCombinations;
                const avgAccuracy = totalAccuracy / validCombinations;
                
                results.push({
                    thresholds,
                    avgROI,
                    avgAccuracy,
                    validCombinations,
                    score: avgROI * 0.7 + avgAccuracy * 0.3 // Weighted score
                });
                
                console.log(`  ✅ Average ROI: ${avgROI.toFixed(2)}%, Accuracy: ${avgAccuracy.toFixed(2)}%`);
            }
            
        } catch (error) {
            console.log(`  ❌ Error with threshold combination:`, error.message);
        }
        
        // Save progress every 50 combinations
        if ((i + 1) % 50 === 0) {
            saveOptimizationResults(results, `threshold_optimization_progress_${i + 1}.json`);
        }
    }
    
    // Sort results by score
    results.sort((a, b) => b.score - a.score);
    
    console.log('\n🏆 TOP 10 THRESHOLD COMBINATIONS:');
    for (let i = 0; i < Math.min(10, results.length); i++) {
        const result = results[i];
        console.log(`\n${i + 1}. Score: ${result.score.toFixed(3)} | ROI: ${result.avgROI.toFixed(2)}% | Accuracy: ${result.avgAccuracy.toFixed(2)}%`);
        console.log('Thresholds:', JSON.stringify(result.thresholds, null, 2));
    }
    
    // Save final results
    saveOptimizationResults(results, 'threshold_optimization_results.json');
    
    return results;
}

function saveOptimizationResults(results, filename) {
    const output = {
        timestamp: new Date().toISOString(),
        totalCombinations: results.length,
        bestThresholds: results.slice(0, 10),
        summary: {
            bestScore: results[0]?.score || 0,
            bestROI: Math.max(...results.map(r => r.avgROI)),
            bestAccuracy: Math.max(...results.map(r => r.avgAccuracy))
        }
    };
    
    fs.writeFileSync(`./results/${filename}`, JSON.stringify(output, null, 2));
    console.log(`💾 Results saved to ./results/${filename}`);
}

// Run optimization if called directly
if (require.main === module) {
    optimizeThresholds().catch(console.error);
}

module.exports = {
    optimizeThresholds,
    generateThresholdCombinations,
    generateFactorDefinitionsWithThresholds,
    THRESHOLD_RANGES
}; 