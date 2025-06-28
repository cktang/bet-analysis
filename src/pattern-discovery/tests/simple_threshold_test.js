const fs = require('fs');
const path = require('path');
const AsianHandicapCalculator = require('../utils/AsianHandicapCalculator');

/**
 * SIMPLE THRESHOLD TESTING
 * Direct approach: Test threshold variations by applying them at match-level filtering
 */

class SimpleThresholdTester {
    constructor() {
        this.matchData = [];
        this.loadData();
    }

    loadData() {
        try {
            const dataDir = path.join(__dirname, '../../data/enhanced');
            const files = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
            
            files.forEach(file => {
                const filePath = path.join(dataDir, file);
                if (fs.existsSync(filePath)) {
                    const yearData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    if (yearData.matches) {
                        const matchesArray = Object.values(yearData.matches).map(matchWrapper => {
                            const match = matchWrapper.preMatch.match;
                            match.fbref = {
                                ...matchWrapper.preMatch.fbref,
                                week: parseInt(matchWrapper.preMatch.fbref.week),
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                homeScore: match.homeScore,
                                awayScore: match.awayScore
                            };
                            return match;
                        });
                        this.matchData.push(...matchesArray);
                    }
                }
            });
            
            // Filter valid matches
            this.matchData = this.matchData.filter(match => 
                match.asianHandicapOdds && 
                match.asianHandicapOdds.homeHandicap &&
                match.asianHandicapOdds.homeOdds &&
                match.asianHandicapOdds.awayOdds &&
                match.fbref && match.fbref.week &&
                match.fbref.homeScore !== undefined &&
                match.fbref.awayScore !== undefined
            );
            
            console.log(`✅ Loaded ${this.matchData.length} valid matches`);
            
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    /**
     * Test our target combination with different threshold values
     */
    testTargetCombinationWithThresholds(thresholdName, thresholdValue) {
        console.log(`\n🧪 Testing: ${thresholdName} = ${thresholdValue}`);
        
        // Apply filters based on our target combination:
        // side-away_size-fix_time-veryEarly_handicapType-quarter
        const filteredMatches = this.matchData.filter(match => {
            // 1. Quarter handicap filter
            if (!match.asianHandicapOdds.homeHandicap.includes('/')) {
                return false;
            }
            
            // 2. Very early season filter (THRESHOLD TO TEST)
            let weekLimit = 4; // default
            if (thresholdName.includes('veryEarly')) {
                weekLimit = thresholdValue;
            } else if (thresholdName.includes('ultraEarly')) {
                weekLimit = thresholdValue; // use ultraEarly as veryEarly equivalent
            }
            
            if (match.fbref.week > weekLimit) {
                return false;
            }
            
            // 3. Optional: Apply odds-based filters if testing those thresholds
            if (thresholdName.includes('trapped')) {
                const minOdds = Math.min(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds);
                if (minOdds > thresholdValue) {
                    return false;
                }
            }
            
            if (thresholdName.includes('sweetSpot')) {
                const maxOdds = Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds);
                // For sweet spot, threshold value should be an object with min/max
                if (typeof thresholdValue === 'object') {
                    if (maxOdds < thresholdValue.min || maxOdds > thresholdValue.max) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        console.log(`   📊 Found ${filteredMatches.length} matching matches`);
        
        if (filteredMatches.length < 20) {
            console.log(`   ⚠️  Too few matches (${filteredMatches.length}), skipping`);
            return null;
        }
        
        // Create betting records (bet AWAY side as per our target combination)
        const bettingRecords = [];
        for (const match of filteredMatches) {
            const stake = 200; // fixed stake as per target combination
            const betSide = 'away';
            
            const result = AsianHandicapCalculator.calculate(
                match.fbref.homeScore,
                match.fbref.awayScore,
                match.asianHandicapOdds.homeHandicap,
                betSide,
                match.asianHandicapOdds.awayOdds,
                stake
            );
            
            bettingRecords.push({
                week: match.fbref.week,
                betSide: betSide,
                handicap: match.asianHandicapOdds.homeHandicap,
                odds: match.asianHandicapOdds.awayOdds,
                stake: stake,
                result: result.outcome,
                payout: result.payout,
                profit: result.profit
            });
        }
        
        return this.calculateResults(thresholdName, bettingRecords, thresholdValue);
    }
    
    calculateResults(testName, bettingRecords, thresholdValue) {
        if (bettingRecords.length === 0) {
            return null;
        }
        
        let wins = 0, losses = 0, pushes = 0;
        let totalStake = 0, totalPayout = 0, totalProfit = 0, totalOdds = 0;
        
        for (const record of bettingRecords) {
            if (record.result === 'win') wins++;
            else if (record.result === 'loss') losses++;
            else pushes++;
            
            totalStake += record.stake;
            totalPayout += record.payout;
            totalProfit += record.profit;
            totalOdds += record.odds;
        }
        
        const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
        const winRate = (wins / bettingRecords.length) * 100;
        const averageOdds = totalOdds / bettingRecords.length;
        const averageStake = totalStake / bettingRecords.length;
        
        console.log(`   ✅ ROI: ${roi.toFixed(2)}% | Win Rate: ${winRate.toFixed(1)}% | Bets: ${bettingRecords.length} | Avg Odds: ${averageOdds.toFixed(2)}`);
        
        return {
            testName: testName,
            thresholdValue: thresholdValue,
            totalROI: Math.round(roi * 100) / 100,
            accuracy: Math.round(winRate * 100) / 100,
            totalBets: bettingRecords.length,
            wins: wins,
            losses: losses,
            pushes: pushes,
            averageStake: averageStake,
            averageOdds: Math.round(averageOdds * 100) / 100,
            totalProfit: Math.round(totalProfit * 100) / 100,
            totalStake: totalStake,
            score: roi * 0.6 + winRate * 0.4
        };
    }
}

/**
 * Run threshold tests
 */
async function runSimpleThresholdTest() {
    console.log('🚀 Starting SIMPLE Threshold Testing...');
    console.log('Target: Away team bets on quarter handicaps in early season\n');
    
    const tester = new SimpleThresholdTester();
    const results = [];
    
    // Test different early season thresholds
    const earlySeasonTests = [
        { name: 'veryEarly_2weeks', value: 2 },
        { name: 'veryEarly_3weeks', value: 3 },
        { name: 'veryEarly_4weeks', value: 4 }, // current baseline
        { name: 'veryEarly_5weeks', value: 5 },
        { name: 'veryEarly_6weeks', value: 6 },
        { name: 'veryEarly_7weeks', value: 7 },
        { name: 'veryEarly_8weeks', value: 8 },
    ];
    
    console.log('📊 TESTING EARLY SEASON WEEK THRESHOLDS:');
    for (const test of earlySeasonTests) {
        const result = tester.testTargetCombinationWithThresholds(test.name, test.value);
        if (result) {
            results.push(result);
        }
    }
    
    // Test different trapped odds thresholds
    const trappedOddsTests = [
        { name: 'trapped_1.60', value: 1.60 },
        { name: 'trapped_1.65', value: 1.65 },
        { name: 'trapped_1.70', value: 1.70 },
        { name: 'trapped_1.72', value: 1.72 }, // current baseline
        { name: 'trapped_1.75', value: 1.75 },
        { name: 'trapped_1.80', value: 1.80 },
        { name: 'trapped_1.85', value: 1.85 },
    ];
    
    console.log('\n📊 TESTING TRAPPED ODDS THRESHOLDS (Quarter + Early + Trapped):');
    for (const test of trappedOddsTests) {
        const result = tester.testTargetCombinationWithThresholds(test.name, test.value);
        if (result) {
            results.push(result);
        }
    }
    
    // Sort results by ROI
    results.sort((a, b) => b.totalROI - a.totalROI);
    
    console.log('\n🏆 RESULTS SUMMARY (Sorted by ROI):');
    console.log('Rank | Test Name              | ROI     | Win Rate | Bets | Avg Odds | Score');
    console.log('-----|------------------------|---------|----------|------|----------|-------');
    
    for (let i = 0; i < Math.min(15, results.length); i++) {
        const r = results[i];
        const rank = (i + 1).toString().padStart(4);
        const name = r.testName.padEnd(22);
        const roi = `${r.totalROI.toFixed(1)}%`.padStart(7);
        const winRate = `${r.accuracy.toFixed(1)}%`.padStart(8);
        const bets = r.totalBets.toString().padStart(4);
        const odds = r.averageOdds.toFixed(2).padStart(8);
        const score = r.score.toFixed(1).padStart(5);
        
        console.log(`${rank} | ${name} | ${roi} | ${winRate} | ${bets} | ${odds} | ${score}`);
    }
    
    // Find best improvements
    const baseline = results.find(r => r.testName === 'veryEarly_4weeks');
    if (baseline) {
        console.log(`\n📈 IMPROVEMENTS OVER BASELINE (4 weeks):`);
        console.log(`Baseline: ${baseline.totalROI}% ROI, ${baseline.accuracy}% win rate, ${baseline.totalBets} bets`);
        
        const improvements = results
            .filter(r => r.testName !== 'veryEarly_4weeks' && r.totalROI > baseline.totalROI)
            .slice(0, 5);
            
        if (improvements.length > 0) {
            console.log('\nTest Name              | ROI     | ROI Improvement | Bets | Win Rate Improvement');
            console.log('-----------------------|---------|-----------------|------|--------------------');
            
            for (const imp of improvements) {
                const name = imp.testName.padEnd(22);
                const roi = `${imp.totalROI.toFixed(1)}%`.padStart(7);
                const roiImp = `+${(imp.totalROI - baseline.totalROI).toFixed(1)}%`.padStart(15);
                const bets = imp.totalBets.toString().padStart(4);
                const winImp = `${imp.accuracy >= baseline.accuracy ? '+' : ''}${(imp.accuracy - baseline.accuracy).toFixed(1)}%`.padStart(18);
                console.log(`${name} | ${roi} | ${roiImp} | ${bets} | ${winImp}`);
            }
        } else {
            console.log('❌ No improvements found over baseline');
        }
    }
    
    // Save results
    const output = {
        timestamp: new Date().toISOString(),
        method: 'simple_direct_threshold_testing',
        baseline: baseline,
        allResults: results,
        bestResult: results[0],
        summary: {
            totalTests: results.length,
            bestROI: Math.max(...results.map(r => r.totalROI)),
            bestWinRate: Math.max(...results.map(r => r.accuracy)),
            avgImprovement: baseline ? (results[0].totalROI - baseline.totalROI) : 0
        }
    };
    
    fs.writeFileSync('./results/simple_threshold_test_results.json', JSON.stringify(output, null, 2));
    console.log('\n💾 Results saved to ./results/simple_threshold_test_results.json');
    
    return results;
}

// Export for use
module.exports = {
    SimpleThresholdTester,
    runSimpleThresholdTest
};

// Run if called directly
if (require.main === module) {
    runSimpleThresholdTest().catch(console.error);
} 