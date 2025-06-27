const fs = require('fs');

console.log('🎯 HIGHER ODDS SIDE ANALYSIS');
console.log('='.repeat(60));
console.log('💡 Key insight: We bet the HIGHER odds side only!');
console.log('   - Always betting Math.max(homeOdds, awayOdds)');
console.log('   - Need distribution of HIGHER side, not all odds');
console.log('   - Apply 25x steepness on actual higher odds range');
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
            oddsDifference: higherOdds - lowerOdds
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

// Create corrected 25x steepness strategies
function createCorrectedStrategies(stats) {
    const minOdds = Math.max(stats.min, 1.91); // User suggested minimum
    const maxOdds = Math.min(stats.p99, 2.24); // User suggested maximum from previous analysis
    
    console.log(`\n🎯 CORRECTED 25x STEEPNESS RANGE:`);
    console.log(`   Minimum higher odds: ${minOdds.toFixed(2)}`);
    console.log(`   Maximum higher odds: ${maxOdds.toFixed(2)}`);
    console.log(`   Actual betting range: ${minOdds.toFixed(2)} to ${maxOdds.toFixed(2)}`);
    console.log(`   Range width: ${(maxOdds - minOdds).toFixed(2)} odds`);
    
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
        'Corrected25xTiered': {
            name: 'Corrected 25x Tiered',
            description: `Smart tiers across ${minOdds.toFixed(2)}-${maxOdds.toFixed(2)} range`,
            calculateStake: (odds) => {
                // Create smart tiers across the narrow actual range
                if (odds < minOdds) return 200;
                else if (odds < minOdds + 0.05) return 200 + (odds - minOdds) * 6000; // Quick ramp up
                else if (odds < minOdds + 0.15) return 500 + (odds - (minOdds + 0.05)) * 10000; // Mid range
                else if (odds < minOdds + 0.25) return 1500 + (odds - (minOdds + 0.15)) * 15000; // Higher range
                else return Math.min(3000 + (odds - (minOdds + 0.25)) * 25000, 5000); // Max range
            }
        }
    };
    
    return strategies;
}

// Test corrected strategies
function testCorrectedStrategies(higherOddsData, strategies) {
    console.log('\n💰 CORRECTED BETTING AMOUNTS:');
    console.log('='.repeat(80));
    
    const testOdds = [1.91, 1.95, 2.00, 2.05, 2.10, 2.15, 2.20, 2.24];
    
    console.log('Odds  | Conservative | Linear25x | Tiered25x | Linear Ratio');
    console.log('-'.repeat(80));
    
    testOdds.forEach(odds => {
        const stakes = {};
        Object.keys(strategies).forEach(key => {
            stakes[key] = strategies[key].calculateStake(odds);
        });
        
        const ratio = stakes['Corrected25xLinear'] / stakes['Conservative'];
        
        console.log(`${odds.toFixed(2)} | $${stakes['Conservative'].toFixed(0).padStart(11)} | $${stakes['Corrected25xLinear'].toFixed(0).padStart(8)} | $${stakes['Corrected25xTiered'].toFixed(0).padStart(8)} | ${ratio.toFixed(1).padStart(11)}x`);
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
    
    // Calculate AH result helper
    function calculateAHResult(homeScore, awayScore, handicap, betSide) {
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
    
    console.log('\n📊 TESTING CORRECTED STRATEGIES:');
    console.log('='.repeat(60));
    
    let sampleCount = 0;
    
    higherOddsData.forEach(data => {
        // Find the actual match result
        const matchInfo = allMatches.find(m => {
            const match = m.preMatch?.match;
            return match && `${match.homeTeam} vs ${match.awayTeam}` === data.match;
        })?.preMatch?.match;
        
        if (!matchInfo || typeof matchInfo.homeScore === 'undefined') return;
        
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, data.handicap, data.betSide);
        
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
                console.log(`${data.match.slice(0,30).padEnd(30)} | ${data.higherOdds.toFixed(2)} | $${stake.toFixed(0).padStart(4)} | ${resultCode.padEnd(8)} | $${profit.toFixed(0).padStart(6)}`);
                sampleCount++;
            }
        });
    });
    
    return results;
}

// Display results
function displayResults(results) {
    console.log('\n🚀 CORRECTED 25x STEEPNESS RESULTS:');
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

console.log('\n🏆 CORRECTED 25x STRATEGY RESULTS:');
console.log('='.repeat(60));
console.log(`Winner: ${strategies[bestStrategy.key].name}`);
console.log(`ROI: ${bestStrategy.roi.toFixed(2)}%`);
console.log(`Total Profit: $${bestStrategy.profit.toFixed(0)}`);

if (bestStrategy.roi > 0) {
    console.log('\n🔥 CORRECTED 25x STEEPNESS WORKS!');
    console.log('✅ Proper higher odds range (1.91-2.24) validates strategy');
    console.log('✅ 25x steepness across realistic AH gradient confirmed!');
} else {
    console.log('\n❌ Even corrected 25x steepness shows issues');
}

console.log('\n✅ Higher odds analysis complete!'); 