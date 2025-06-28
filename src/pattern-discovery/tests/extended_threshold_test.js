const { SimpleThresholdTester } = require('./simple_threshold_test');

/**
 * Extended threshold testing based on trapped odds discovery
 */
async function runExtendedThresholdTest() {
    console.log('🚀 Extended Threshold Testing - Finding Optimal Combinations...\n');
    
    const tester = new SimpleThresholdTester();
    const results = [];
    
    // Test fine-grained trapped odds around the optimal 1.80 range
    const fineTunedOddsTests = [
        { name: 'trapped_1.76', value: 1.76 },
        { name: 'trapped_1.77', value: 1.77 },
        { name: 'trapped_1.78', value: 1.78 },
        { name: 'trapped_1.79', value: 1.79 },
        { name: 'trapped_1.80', value: 1.80 }, // best so far
        { name: 'trapped_1.81', value: 1.81 },
        { name: 'trapped_1.82', value: 1.82 },
        { name: 'trapped_1.83', value: 1.83 },
        { name: 'trapped_1.84', value: 1.84 },
    ];
    
    console.log('📊 FINE-TUNING TRAPPED ODDS AROUND 1.80:');
    for (const test of fineTunedOddsTests) {
        const result = tester.testTargetCombinationWithThresholds(test.name, test.value);
        if (result) {
            results.push(result);
        }
    }
    
    // Test combination of different week limits with optimal trapped odds
    const weekOddsCombinations = [
        { weekLimit: 3, oddsLimit: 1.78, name: 'combined_3weeks_1.78' },
        { weekLimit: 3, oddsLimit: 1.80, name: 'combined_3weeks_1.80' },
        { weekLimit: 3, oddsLimit: 1.82, name: 'combined_3weeks_1.82' },
        { weekLimit: 4, oddsLimit: 1.78, name: 'combined_4weeks_1.78' },
        { weekLimit: 4, oddsLimit: 1.80, name: 'combined_4weeks_1.80' },
        { weekLimit: 4, oddsLimit: 1.82, name: 'combined_4weeks_1.82' },
        { weekLimit: 5, oddsLimit: 1.78, name: 'combined_5weeks_1.78' },
        { weekLimit: 5, oddsLimit: 1.80, name: 'combined_5weeks_1.80' },
        { weekLimit: 5, oddsLimit: 1.82, name: 'combined_5weeks_1.82' },
    ];
    
    console.log('\n📊 TESTING WEEK/ODDS COMBINATIONS:');
    for (const combo of weekOddsCombinations) {
        console.log(`\n🧪 Testing: ${combo.name} (week ≤ ${combo.weekLimit}, odds ≤ ${combo.oddsLimit})`);
        
        const filteredMatches = tester.matchData.filter(match => {
            // Quarter handicap filter
            if (!match.asianHandicapOdds.homeHandicap.includes('/')) return false;
            
            // Week filter
            if (match.fbref.week > combo.weekLimit) return false;
            
            // Trapped odds filter
            const minOdds = Math.min(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds);
            if (minOdds > combo.oddsLimit) return false;
            
            return true;
        });
        
        console.log(`   📊 Found ${filteredMatches.length} matching matches`);
        
        if (filteredMatches.length >= 20) {
            // Test this combination manually
            const bettingRecords = [];
            for (const match of filteredMatches) {
                const AsianHandicapCalculator = require('../utils/AsianHandicapCalculator');
                const result = AsianHandicapCalculator.calculate(
                    match.fbref.homeScore,
                    match.fbref.awayScore,
                    match.asianHandicapOdds.homeHandicap,
                    'away',
                    match.asianHandicapOdds.awayOdds,
                    200
                );
                
                bettingRecords.push({
                    week: match.fbref.week,
                    result: result.outcome,
                    profit: result.profit
                });
            }
            
            // Calculate results
            const wins = bettingRecords.filter(r => r.result === 'win').length;
            const totalProfit = bettingRecords.reduce((sum, r) => sum + r.profit, 0);
            const totalStake = bettingRecords.length * 200;
            const roi = (totalProfit / totalStake) * 100;
            const winRate = (wins / bettingRecords.length) * 100;
            
            console.log(`   ✅ ROI: ${roi.toFixed(2)}% | Win Rate: ${winRate.toFixed(1)}% | Bets: ${bettingRecords.length}`);
            
            results.push({
                testName: combo.name,
                weekLimit: combo.weekLimit,
                oddsLimit: combo.oddsLimit,
                totalROI: Math.round(roi * 100) / 100,
                accuracy: Math.round(winRate * 100) / 100,
                totalBets: bettingRecords.length,
                score: roi * 0.6 + winRate * 0.4
            });
        } else {
            console.log(`   ⚠️  Too few matches (${filteredMatches.length}), skipping`);
        }
    }
    
    // Sort all results by ROI
    results.sort((a, b) => b.totalROI - a.totalROI);
    
    console.log('\n🏆 ALL RESULTS (Sorted by ROI):');
    console.log('Rank | Test Name                  | ROI     | Win Rate | Bets | Score');
    console.log('-----|----------------------------|---------|----------|------|-------');
    
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const rank = (i + 1).toString().padStart(4);
        const name = r.testName.padEnd(26);
        const roi = `${r.totalROI.toFixed(1)}%`.padStart(7);
        const winRate = `${r.accuracy.toFixed(1)}%`.padStart(8);
        const bets = r.totalBets.toString().padStart(4);
        const score = r.score.toFixed(1).padStart(5);
        
        console.log(`${rank} | ${name} | ${roi} | ${winRate} | ${bets} | ${score}`);
    }
    
    console.log(`\n🎯 OPTIMAL THRESHOLD FOUND:`);
    const best = results[0];
    console.log(`   Strategy: ${best.testName}`);
    console.log(`   ROI: ${best.totalROI}%`);
    console.log(`   Win Rate: ${best.accuracy}%`);
    console.log(`   Sample Size: ${best.totalBets} bets`);
    
    if (best.weekLimit && best.oddsLimit) {
        console.log(`   Optimal Thresholds: Week ≤ ${best.weekLimit}, Odds ≤ ${best.oddsLimit}`);
    }
    
    return results;
}

// Run if called directly
if (require.main === module) {
    runExtendedThresholdTest().catch(console.error);
}

module.exports = { runExtendedThresholdTest }; 