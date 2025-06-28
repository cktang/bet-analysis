const fs = require('fs');
const OptimizedDiscovery = require('./optimized_discovery');

/**
 * QUICK THRESHOLD TESTING
 * Start simple: test the most likely impactful thresholds on our best combinations
 */

// Our best performing combination to optimize
const TARGET_COMBINATION = 'side-away_size-fix_time-veryEarly_handicapType-quarter'; // 19.94% ROI

// Most likely impactful threshold variations to test
const THRESHOLD_TESTS = {
    // Early season timing (most critical based on your results)
    veryEarly_timing: [
        { name: 'veryEarly_3weeks', veryEarlyWeek: 3 },
        { name: 'veryEarly_4weeks', veryEarlyWeek: 4 }, // current
        { name: 'veryEarly_5weeks', veryEarlyWeek: 5 },
        { name: 'veryEarly_6weeks', veryEarlyWeek: 6 },
    ],
    
    // Ultra early timing (60%+ ROI potential)
    ultraEarly_timing: [
        { name: 'ultraEarly_4weeks', ultraEarlyWeek: 4 },
        { name: 'ultraEarly_5weeks', ultraEarlyWeek: 5 },
        { name: 'ultraEarly_6weeks', ultraEarlyWeek: 6 }, // current
        { name: 'ultraEarly_7weeks', ultraEarlyWeek: 7 },
        { name: 'ultraEarly_8weeks', ultraEarlyWeek: 8 },
    ],
    
    // Trapped odds (HKJC inefficiency)
    trapped_odds: [
        { name: 'trapped_1.65', trappedOdds: 1.65 },
        { name: 'trapped_1.70', trappedOdds: 1.70 },
        { name: 'trapped_1.72', trappedOdds: 1.72 }, // current
        { name: 'trapped_1.75', trappedOdds: 1.75 },
        { name: 'trapped_1.80', trappedOdds: 1.80 },
    ],
    
    // Sweet spot range (optimal value zone)
    sweetspot_range: [
        { name: 'sweetspot_1.95-2.25', sweetSpotMin: 1.95, sweetSpotMax: 2.25 },
        { name: 'sweetspot_2.00-2.30', sweetSpotMin: 2.00, sweetSpotMax: 2.30 }, // current
        { name: 'sweetspot_2.05-2.35', sweetSpotMin: 2.05, sweetSpotMax: 2.35 },
        { name: 'sweetspot_1.90-2.20', sweetSpotMin: 1.90, sweetSpotMax: 2.20 },
    ]
};

/**
 * Create modified factor definitions with new threshold
 */
function createModifiedFactors(thresholdChanges) {
    const originalFactors = require('./factor_definitions');
    const modified = JSON.parse(JSON.stringify(originalFactors)); // deep copy
    
    // Apply threshold changes
    if (thresholdChanges.veryEarlyWeek) {
        modified.time.veryEarly.expression = `fbref.week >= 1 && fbref.week <= ${thresholdChanges.veryEarlyWeek}`;
    }
    
    if (thresholdChanges.ultraEarlyWeek) {
        modified.time.ultraEarly.expression = `fbref.week >= 1 && fbref.week <= ${thresholdChanges.ultraEarlyWeek}`;
    }
    
    if (thresholdChanges.trappedOdds) {
        modified.oddsLevel.trapped.expression = `Math.min(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= ${thresholdChanges.trappedOdds}`;
        modified.handicapType.trappedQuarter.expression = `match.asianHandicapOdds.homeHandicap.includes('/') && (match.asianHandicapOdds.homeOdds <= ${thresholdChanges.trappedOdds} || match.asianHandicapOdds.awayOdds <= ${thresholdChanges.trappedOdds})`;
    }
    
    if (thresholdChanges.sweetSpotMin || thresholdChanges.sweetSpotMax) {
        const min = thresholdChanges.sweetSpotMin || 2.00;
        const max = thresholdChanges.sweetSpotMax || 2.30;
        modified.oddsLevel.sweetSpot.expression = `Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= ${min} && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= ${max}`;
    }
    
    return modified;
}

/**
 * Test a single threshold variation
 */
async function testThresholdVariation(testName, thresholdChanges) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   Changes: ${JSON.stringify(thresholdChanges)}`);
    
    try {
        // Create modified factors
        const modifiedFactors = createModifiedFactors(thresholdChanges);
        
        // Temporarily save modified factors
        const tempFile = './temp_factors.js';
        fs.writeFileSync(tempFile, `module.exports = ${JSON.stringify(modifiedFactors, null, 2)};`);
        
        // Clear require cache and temporarily override
        delete require.cache[require.resolve('./factor_definitions')];
        const originalFactorDefinitions = require('./factor_definitions');
        
        // Override the module
        require.cache[require.resolve('./factor_definitions')] = {
            exports: modifiedFactors
        };
        
        // Create new discovery instance with modified factors
        const discovery = new OptimizedDiscovery();
        discovery.flattenFactors();
        
        // Find or create the target combination
        const combinations = discovery.generateCombinationsOptimized(4); // 4-factor combinations to match our target
        const targetCombo = combinations.find(combo => combo.name.includes('side-away') && 
                                              combo.name.includes('size-fix') && 
                                              combo.name.includes('time-veryEarly') && 
                                              combo.name.includes('handicapType-quarter'));
        
        if (!targetCombo) {
            throw new Error(`Target combination not found`);
        }
        
        // Test the combination
        const result = discovery.testCombination(targetCombo);
        
        // Restore original module
        require.cache[require.resolve('./factor_definitions')] = {
            exports: originalFactorDefinitions
        };
        
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
        
        console.log(`   ✅ ROI: ${result.roi.toFixed(2)}% | Win Rate: ${result.winRate.toFixed(1)}% | Bets: ${result.bets} | Avg Stake: ${result.averageStake.toFixed(0)}`);
        
        return {
            testName,
            thresholdChanges,
            totalROI: result.roi,
            accuracy: result.winRate,
            totalBets: result.bets,
            averageStake: result.averageStake,
            totalProfit: result.totalProfit,
            score: result.roi * 0.6 + result.winRate * 0.4 // Simple scoring
        };
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

/**
 * Run all threshold tests
 */
async function runQuickThresholdTest() {
    console.log('🚀 Starting Quick Threshold Testing...');
    console.log(`Target combination: ${TARGET_COMBINATION}`);
    
    const results = [];
    
    // Test baseline first (current settings)
    console.log('\n📊 BASELINE TEST (Current Settings):');
    const baseline = await testThresholdVariation('baseline', {});
    if (baseline) {
        results.push(baseline);
    }
    
    // Test each threshold category
    for (const [category, tests] of Object.entries(THRESHOLD_TESTS)) {
        console.log(`\n📁 TESTING CATEGORY: ${category.toUpperCase()}`);
        
        for (const test of tests) {
            const result = await testThresholdVariation(test.name, test);
            if (result) {
                results.push(result);
            }
        }
    }
    
    // Sort results by score
    results.sort((a, b) => b.score - a.score);
    
    console.log('\n🏆 RESULTS SUMMARY (Top 10):');
    console.log('Rank | Test Name                | ROI     | Accuracy | Bets | Score');
    console.log('-----|--------------------------|---------|----------|------|-------');
    
    for (let i = 0; i < Math.min(10, results.length); i++) {
        const r = results[i];
        const rank = (i + 1).toString().padStart(4);
        const name = r.testName.padEnd(24);
        const roi = `${r.totalROI.toFixed(1)}%`.padStart(7);
        const acc = `${r.accuracy.toFixed(1)}%`.padStart(8);
        const bets = r.totalBets.toString().padStart(4);
        const score = r.score.toFixed(1).padStart(5);
        
        console.log(`${rank} | ${name} | ${roi} | ${acc} | ${bets} | ${score}`);
    }
    
    // Show best improvements
    if (baseline && results.length > 1) {
        console.log('\n📈 BEST IMPROVEMENTS OVER BASELINE:');
        const improvements = results
            .filter(r => r.testName !== 'baseline')
            .map(r => ({
                ...r,
                roiImprovement: r.totalROI - baseline.totalROI,
                accuracyImprovement: r.accuracy - baseline.accuracy
            }))
            .filter(r => r.roiImprovement > 0)
            .sort((a, b) => b.roiImprovement - a.roiImprovement);
        
        if (improvements.length > 0) {
            console.log('Test Name                | ROI Improvement | Accuracy Improvement');
            console.log('-------------------------|-----------------|--------------------');
            
            for (const imp of improvements.slice(0, 5)) {
                const name = imp.testName.padEnd(24);
                const roiImp = `+${imp.roiImprovement.toFixed(1)}%`.padStart(15);
                const accImp = `${imp.accuracyImprovement >= 0 ? '+' : ''}${imp.accuracyImprovement.toFixed(1)}%`.padStart(18);
                console.log(`${name} | ${roiImp} | ${accImp}`);
            }
        } else {
            console.log('❌ No improvements found over baseline');
        }
    }
    
    // Save results
    const output = {
        timestamp: new Date().toISOString(),
        targetCombination: TARGET_COMBINATION,
        baseline: baseline,
        allResults: results,
        bestResult: results[0],
        summary: {
            totalTests: results.length,
            bestROI: Math.max(...results.map(r => r.totalROI)),
            bestAccuracy: Math.max(...results.map(r => r.accuracy)),
            avgImprovement: baseline ? (results[0].totalROI - baseline.totalROI) : 0
        }
    };
    
    fs.writeFileSync('./results/quick_threshold_test_results.json', JSON.stringify(output, null, 2));
    console.log('\n💾 Results saved to ./results/quick_threshold_test_results.json');
    
    return results;
}

// Export for use
module.exports = {
    runQuickThresholdTest,
    testThresholdVariation,
    THRESHOLD_TESTS
};

// Run if called directly
if (require.main === module) {
    runQuickThresholdTest().catch(console.error);
} 