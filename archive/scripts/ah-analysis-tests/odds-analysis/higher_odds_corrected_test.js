const fs = require('fs');

console.log('🎯 HIGHER ODDS SIDE ANALYSIS - CORRECTED');
console.log('='.repeat(60));
console.log('💡 Key insight: We bet the HIGHER odds side only!');
console.log('   - Always betting Math.max(homeOdds, awayOdds)');
console.log('   - Need distribution of HIGHER side, not all odds');
console.log('   - Apply 25x steepness on actual higher odds range (1.91-2.24)');
console.log('');

// Load data
const data2022 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const data2023 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2023-2024-enhanced.json', 'utf8'));  
const data2024 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

const allMatches = [
    ...Object.values(data2022.matches || {}),
    ...Object.values(data2023.matches || {}),
    ...Object.values(data2024.matches || {})
];

console.log(`📊 Total matches loaded: ${allMatches.length}\n`);

// Helper function to check if handicap is quarter handicap
function isQuarterHandicap(handicap) {
    const singlePatterns = [
        '0', '-0.5', '+0.5', '-1', '+1', '-1.5', '+1.5', '-2', '+2', '-2.5', '+2.5', '-3', '+3'
    ];
    
    if (singlePatterns.includes(handicap)) {
        return false;
    }
    
    if (handicap.includes('/')) {
        return true;
    }
    
    return false;
}

// Analyze HIGHER odds distribution specifically
function analyzeHigherOddsDistribution() {
    const higherOddsData = [];
    let quarterMatches = 0;
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        
        if (!homeOdds || !awayOdds) return;
        
        quarterMatches++;
        
        // Only collect the HIGHER odds (what we actually bet)
        const higherOdds = Math.max(homeOdds, awayOdds);
        const lowerOdds = Math.min(homeOdds, awayOdds);
        const betSide = homeOdds > awayOdds ? 'home' : 'away';
        
        higherOddsData.push({
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            handicap: ah.homeHandicap,
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            higherOdds: higherOdds,
            lowerOdds: lowerOdds,
            betSide: betSide,
            oddsDifference: higherOdds - lowerOdds,
            homeScore: matchInfo.homeScore,
            awayScore: matchInfo.awayScore
        });
    });
    
    console.log(`📊 Found ${quarterMatches} quarter handicap matches`);
    console.log(`📈 Collected ${higherOddsData.length} HIGHER odds for betting\n`);
    
    return higherOddsData;
}

// Show HIGHER odds distribution
function showHigherOddsDistribution(higherOddsData) {
    console.log('📊 HIGHER ODDS DISTRIBUTION (What we actually bet):');
    console.log('='.repeat(70));
    
    // Sort higher odds to find percentiles
    const higherOddsSorted = higherOddsData.map(d => d.higherOdds).sort((a, b) => a - b);
    
    const min = Math.min(...higherOddsSorted);
    const p10 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.1)];
    const p25 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.25)];
    const p50 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.5)];
    const p75 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.75)];
    const p90 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.9)];
    const p95 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.95)];
    const p99 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.99)];
    const max = Math.max(...higherOddsSorted);
    
    console.log('HIGHER ODDS Percentiles (betting range):');
    console.log(`  Minimum: ${min.toFixed(2)}`);
    console.log(`  10th percentile: ${p10.toFixed(2)}`);
    console.log(`  25th percentile: ${p25.toFixed(2)}`);
    console.log(`  50th percentile (median): ${p50.toFixed(2)}`);
    console.log(`  75th percentile: ${p75.toFixed(2)}`);
    console.log(`  90th percentile: ${p90.toFixed(2)}`);
    console.log(`  95th percentile: ${p95.toFixed(2)}`);
    console.log(`  99th percentile: ${p99.toFixed(2)}`);
    console.log(`  Maximum: ${max.toFixed(2)}`);
    
    return { min, p10, p25, p50, p75, p90, p95, p99, max };
}

// Create corrected 25x steepness strategies using user's guidance
function createCorrectedStrategies(stats) {
    // User guidance: higher side must be > 1.91, max around 2.24
    const minOdds = 1.91; 
    const maxOdds = 2.24; 
    
    console.log(`\n🎯 CORRECTED 25x STEEPNESS RANGE (User Guided):`);
    console.log(`   Minimum higher odds: ${minOdds.toFixed(2)} (since we bet higher side)`);
    console.log(`   Maximum higher odds: ${maxOdds.toFixed(2)} (99th percentile realistic)`);
    console.log(`   Actual betting range: ${minOdds.toFixed(2)} to ${maxOdds.toFixed(2)}`);
    console.log(`   Range width: ${(maxOdds - minOdds).toFixed(2)} odds`);
    console.log(`   25x steepness: $200 to $5000 across this narrow range`);
    
    const strategies = {
        'Conservative': {
            name: 'Conservative Baseline',
            description: 'Fixed stake baseline',
            calculateStake: (odds) => odds * 50 // Conservative baseline
        },
        'Corrected25xLinear': {
            name: 'Corrected 25x Linear',
            description: `$200 to $5000 across ${minOdds.toFixed(2)}-${maxOdds.toFixed(2)} odds`,
            calculateStake: (odds) => {
                const minStake = 200;
                const maxStake = 5000;
                
                if (odds <= minOdds) return minStake;
                if (odds >= maxOdds) return maxStake;
                
                // Linear interpolation across ACTUAL higher odds range
                const ratio = (odds - minOdds) / (maxOdds - minOdds);
                return minStake + (ratio * (maxStake - minStake));
            }
        },
        'Corrected25xExponential': {
            name: 'Corrected 25x Exponential',
            description: `Exponential growth across ${minOdds.toFixed(2)}-${maxOdds.toFixed(2)}`,
            calculateStake: (odds) => {
                const minStake = 200;
                const maxStake = 5000;
                
                if (odds <= minOdds) return minStake;
                if (odds >= maxOdds) return maxStake;
                
                // Exponential growth for aggressive scaling
                const normalizedOdds = (odds - minOdds) / (maxOdds - minOdds);
                const expRatio = Math.pow(normalizedOdds, 2); // Quadratic growth
                return minStake + (expRatio * (maxStake - minStake));
            }
        }
    };
    
    return strategies;
}

// Calculate AH result helper
function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return null;
    }
    
    const scoreDiff = homeScore - awayScore;
    let adjustedDiff;
    
    if (betSide === 'home') {
        adjustedDiff = scoreDiff;
    } else {
        adjustedDiff = -scoreDiff;
    }
    
    // Parse quarter handicap
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        const result1 = adjustedDiff > h1 ? 'win' : (adjustedDiff === h1 ? 'push' : 'lose');
        const result2 = adjustedDiff > h2 ? 'win' : (adjustedDiff === h2 ? 'push' : 'lose');
        
        if (result1 === 'win' && result2 === 'win') return 'win';
        if (result1 === 'lose' && result2 === 'lose') return 'lose';
        if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
        if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
        return 'push';
    }
    
    return 'push'; // Shouldn't happen with quarter handicaps
}

// Test corrected strategies
function testCorrectedStrategies(higherOddsData, strategies) {
    console.log('\n💰 CORRECTED BETTING AMOUNTS BY ODDS:');
    console.log('='.repeat(80));
    
    const testOdds = [1.91, 1.95, 2.00, 2.05, 2.10, 2.15, 2.20, 2.24];
    
    console.log('Odds  | Conservative | Linear25x | Exp25x | Linear Ratio | Exp Ratio');
    console.log('-'.repeat(80));
    
    testOdds.forEach(odds => {
        const stakes = {};
        Object.keys(strategies).forEach(key => {
            stakes[key] = strategies[key].calculateStake(odds);
        });
        
        const linearRatio = stakes['Corrected25xLinear'] / stakes['Conservative'];
        const expRatio = stakes['Corrected25xExponential'] / stakes['Conservative'];
        
        console.log(`${odds.toFixed(2)} | $${stakes['Conservative'].toFixed(0).padStart(11)} | $${stakes['Corrected25xLinear'].toFixed(0).padStart(8)} | $${stakes['Corrected25xExponential'].toFixed(0).padStart(6)} | ${linearRatio.toFixed(1).padStart(11)}x | ${expRatio.toFixed(1).padStart(8)}x`);
    });
    
    // Now test actual betting results
    const results = {};
    
    Object.keys(strategies).forEach(strategyKey => {
        results[strategyKey] = {
            name: strategies[strategyKey].name,
            bets: 0,
            totalStaked: 0,
            totalProfit: 0,
            wins: 0,
            losses: 0,
            halfWins: 0,
            halfLosses: 0,
            maxWin: 0,
            maxLoss: 0,
            bigWins: 0,
            bigLosses: 0
        };
    });
    
    console.log('\n📊 CORRECTED STRATEGY TEST RESULTS:');
    console.log('='.repeat(80));
    console.log('Sample betting results:');
    console.log('Match                         | Odds | LinearStake | ExpStake | Result   | LinearProfit');
    console.log('-'.repeat(80));
    
    let sampleCount = 0;
    let processedCount = 0;
    
    higherOddsData.forEach(data => {
        const betResult = calculateAHResult(data.homeScore, data.awayScore, data.handicap, data.betSide);
        
        if (!betResult) return; // Skip if no result available
        
        processedCount++;
        
        Object.keys(strategies).forEach(strategyKey => {
            const strategy = strategies[strategyKey];
            const stake = strategy.calculateStake(data.higherOdds);
            
            let profit = 0;
            let resultCode = '';
            
            if (betResult === 'win') {
                profit = stake * (data.higherOdds - 1);
                results[strategyKey].wins++;
                resultCode = 'WIN';
            } else if (betResult === 'half-win') {
                profit = stake * (data.higherOdds - 1) / 2;
                results[strategyKey].halfWins++;
                resultCode = 'HALF-WIN';
            } else if (betResult === 'push') {
                profit = 0;
                resultCode = 'PUSH';
            } else if (betResult === 'half-lose') {
                profit = -stake / 2;
                results[strategyKey].halfLosses++;
                resultCode = 'HALF-LOSE';
            } else {
                profit = -stake;
                results[strategyKey].losses++;
                resultCode = 'LOSE';
            }
            
            results[strategyKey].totalStaked += stake;
            results[strategyKey].totalProfit += profit;
            results[strategyKey].bets++;
            
            if (profit > 1000) results[strategyKey].bigWins++;
            if (profit < -1000) results[strategyKey].bigLosses++;
            
            results[strategyKey].maxWin = Math.max(results[strategyKey].maxWin, profit);
            results[strategyKey].maxLoss = Math.min(results[strategyKey].maxLoss, profit);
            
            // Show first 10 examples for Linear strategy
            if (sampleCount < 10 && strategyKey === 'Corrected25xLinear') {
                const linearStake = strategies['Corrected25xLinear'].calculateStake(data.higherOdds);
                const expStake = strategies['Corrected25xExponential'].calculateStake(data.higherOdds);
                
                console.log(`${data.match.slice(0,28).padEnd(29)} | ${data.higherOdds.toFixed(2)} | $${linearStake.toFixed(0).padStart(10)} | $${expStake.toFixed(0).padStart(7)} | ${resultCode.padEnd(8)} | $${profit.toFixed(0).padStart(11)}`);
                sampleCount++;
            }
        });
    });
    
    console.log(`\nProcessed ${processedCount} matches with results\n`);
    
    return results;
}

// Display results
function displayResults(results) {
    console.log('🚀 CORRECTED 25x STEEPNESS RESULTS:');
    console.log('='.repeat(80));
    
    Object.keys(results).forEach(strategyKey => {
        const result = results[strategyKey];
        const roi = (result.totalProfit / result.totalStaked) * 100;
        const winRate = ((result.wins + result.halfWins * 0.5) / result.bets) * 100;
        const avgStake = result.totalStaked / result.bets;
        
        console.log(`\n💰 ${result.name.toUpperCase()}:`);
        console.log(`   Total Bets: ${result.bets}`);
        console.log(`   Total Staked: $${result.totalStaked.toFixed(0)}`);
        console.log(`   Total Profit: $${result.totalProfit.toFixed(0)}`);
        console.log(`   ROI: ${roi.toFixed(2)}%`);
        console.log(`   Win Rate: ${winRate.toFixed(1)}%`);
        console.log(`   Average Stake: $${avgStake.toFixed(0)}`);
        console.log(`   Max Win: $${result.maxWin.toFixed(0)}`);
        console.log(`   Max Loss: $${Math.abs(result.maxLoss).toFixed(0)}`);
        console.log(`   Big Wins (>$1000): ${result.bigWins}`);
        console.log(`   Big Losses (>$1000): ${result.bigLosses}`);
        
        if (roi > 0) console.log(`   ✅ PROFITABLE!`);
        else console.log(`   ❌ LOSS MAKING`);
    });
}

// Run the corrected analysis
const higherOddsData = analyzeHigherOddsDistribution();
const stats = showHigherOddsDistribution(higherOddsData);
const strategies = createCorrectedStrategies(stats);
const results = testCorrectedStrategies(higherOddsData, strategies);
displayResults(results);

// Find best strategy
let bestStrategy = null;
let bestROI = -Infinity;

Object.keys(results).forEach(key => {
    if (key === 'Conservative') return;
    const roi = (results[key].totalProfit / results[key].totalStaked) * 100;
    if (roi > bestROI) {
        bestROI = roi;
        bestStrategy = { key, roi, profit: results[key].totalProfit };
    }
});

console.log('\n🏆 CORRECTED 25x STRATEGY FINAL RESULTS:');
console.log('='.repeat(60));
console.log(`🥇 Winner: ${strategies[bestStrategy.key].name}`);
console.log(`📈 ROI: ${bestStrategy.roi.toFixed(2)}%`);
console.log(`💰 Total Profit: $${bestStrategy.profit.toFixed(0)}`);

if (bestStrategy.roi > 0) {
    console.log('\n🔥 CORRECTED 25x STEEPNESS WORKS!');
    console.log('✅ Proper higher odds range (1.91-2.24) validates strategy');
    console.log('✅ 25x steepness across realistic narrow AH gradient confirmed!');
    console.log('✅ User insight about betting higher side only was crucial!');
} else {
    console.log('\n❌ Even corrected 25x steepness shows issues');
    console.log('   May need to reconsider the trapped mechanism theory');
}

console.log('\n✅ Higher odds corrected analysis complete!'); 