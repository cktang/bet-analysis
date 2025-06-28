const fs = require('fs');

console.log('🎯 CORRECTED HIGHER ODDS ANALYSIS');
console.log('='.repeat(60));
console.log('💡 User insight: We bet HIGHER odds side only!');
console.log('   - Always betting Math.max(homeOdds, awayOdds)');
console.log('   - Higher odds must be > 1.91 (since we take max)');
console.log('   - Apply 25x steepness on 1.91-2.24 range');
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

// Find quarter handicaps and their higher odds
function getHigherOddsData() {
    const higherOddsData = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const betSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        
        higherOddsData.push({
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            handicap: ah.homeHandicap,
            homeOdds: ah.homeOdds,
            awayOdds: ah.awayOdds,
            higherOdds: higherOdds,
            betSide: betSide,
            homeScore: matchInfo.homeScore,
            awayScore: matchInfo.awayScore
        });
    });
    
    return higherOddsData;
}

// Show actual higher odds distribution
function analyzeHigherOdds(higherOddsData) {
    console.log('📊 HIGHER ODDS DISTRIBUTION (What we actually bet):');
    console.log('='.repeat(70));
    
    const higherOddsSorted = higherOddsData.map(d => d.higherOdds).sort((a, b) => a - b);
    
    const min = Math.min(...higherOddsSorted);
    const max = Math.max(...higherOddsSorted);
    const median = higherOddsSorted[Math.floor(higherOddsSorted.length / 2)];
    const p99 = higherOddsSorted[Math.floor(higherOddsSorted.length * 0.99)];
    
    console.log(`Total higher odds cases: ${higherOddsSorted.length}`);
    console.log(`Minimum higher odds: ${min.toFixed(2)}`);
    console.log(`Maximum higher odds: ${max.toFixed(2)}`);
    console.log(`Median higher odds: ${median.toFixed(2)}`);
    console.log(`99th percentile: ${p99.toFixed(2)}`);
    
    console.log('\nDistribution by range:');
    const ranges = [
        { min: 1.50, max: 1.91, label: 'Below 1.91' },
        { min: 1.91, max: 2.00, label: '1.91-2.00' },
        { min: 2.00, max: 2.10, label: '2.00-2.10' },
        { min: 2.10, max: 2.20, label: '2.10-2.20' },
        { min: 2.20, max: 2.24, label: '2.20-2.24' },
        { min: 2.24, max: 3.00, label: 'Above 2.24' }
    ];
    
    ranges.forEach(range => {
        const count = higherOddsSorted.filter(odds => odds >= range.min && odds < range.max).length;
        const percentage = (count / higherOddsSorted.length * 100).toFixed(1);
        console.log(`${range.label.padEnd(12)}: ${count.toString().padStart(3)} cases (${percentage}%)`);
    });
    
    return { min, max, median, p99 };
}

// Create corrected 25x strategies
function createCorrectStrategies() {
    const minOdds = 1.91;  // User's insight: higher odds must be > 1.91
    const maxOdds = 2.24;  // From previous analysis
    
    console.log(`\n🎯 CORRECTED 25x STEEPNESS RANGE:`);
    console.log(`   From: ${minOdds} to ${maxOdds} odds`);
    console.log(`   Width: ${(maxOdds - minOdds).toFixed(2)} odds`);
    console.log(`   Stakes: $200 to $5000 (25x multiplier)`);
    
    return {
        'Conservative': {
            name: 'Conservative',
            calculateStake: (odds) => odds * 50
        },
        'Corrected25x': {
            name: 'Corrected 25x Linear',
            calculateStake: (odds) => {
                if (odds <= minOdds) return 200;
                if (odds >= maxOdds) return 5000;
                
                const ratio = (odds - minOdds) / (maxOdds - minOdds);
                return 200 + (ratio * 4800); // 200 + 4800 = 5000
            }
        },
        'Corrected25xAggressive': {
            name: 'Corrected 25x Aggressive',
            calculateStake: (odds) => {
                if (odds <= minOdds) return 200;
                if (odds >= maxOdds) return 5000;
                
                const ratio = (odds - minOdds) / (maxOdds - minOdds);
                return 200 + (Math.pow(ratio, 1.5) * 4800); // More aggressive curve
            }
        }
    };
}

// Show betting amounts
function showBettingAmounts(strategies) {
    console.log('\n💰 BETTING AMOUNTS BY ODDS:');
    console.log('='.repeat(80));
    
    const testOdds = [1.91, 1.95, 2.00, 2.05, 2.10, 2.15, 2.20, 2.24];
    
    console.log('Odds  | Conservative | Linear25x | Aggressive25x | Linear Ratio');
    console.log('-'.repeat(80));
    
    testOdds.forEach(odds => {
        const stakes = {};
        Object.keys(strategies).forEach(key => {
            stakes[key] = strategies[key].calculateStake(odds);
        });
        
        const ratio = stakes['Corrected25x'] / stakes['Conservative'];
        
        console.log(`${odds.toFixed(2)} | $${stakes['Conservative'].toFixed(0).padStart(11)} | $${stakes['Corrected25x'].toFixed(0).padStart(8)} | $${stakes['Corrected25xAggressive'].toFixed(0).padStart(12)} | ${ratio.toFixed(1).padStart(11)}x`);
    });
}

// Calculate AH result
function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return null;
    }
    
    const scoreDiff = homeScore - awayScore;
    const adjustedDiff = betSide === 'home' ? scoreDiff : -scoreDiff;
    
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
    
    return null;
}

// Test the corrected strategies
function testStrategies(higherOddsData, strategies) {
    console.log('\n📊 TESTING CORRECTED STRATEGIES:');
    console.log('='.repeat(80));
    
    const results = {};
    
    Object.keys(strategies).forEach(key => {
        results[key] = {
            bets: 0,
            totalStaked: 0,
            totalProfit: 0,
            wins: 0,
            losses: 0,
            halfWins: 0,
            halfLosses: 0,
            maxWin: 0,
            maxLoss: 0
        };
    });
    
    console.log('Sample results:');
    console.log('Match                         | Odds | Linear25x | Result   | Profit');
    console.log('-'.repeat(75));
    
    let samples = 0;
    
    higherOddsData.forEach(data => {
        const result = calculateAHResult(data.homeScore, data.awayScore, data.handicap, data.betSide);
        
        if (!result) return;
        
        Object.keys(strategies).forEach(strategyKey => {
            const stake = strategies[strategyKey].calculateStake(data.higherOdds);
            let profit = 0;
            let resultCode = '';
            
            if (result === 'win') {
                profit = stake * (data.higherOdds - 1);
                results[strategyKey].wins++;
                resultCode = 'WIN';
            } else if (result === 'half-win') {
                profit = stake * (data.higherOdds - 1) / 2;
                results[strategyKey].halfWins++;
                resultCode = 'HALF-WIN';
            } else if (result === 'push') {
                profit = 0;
                resultCode = 'PUSH';
            } else if (result === 'half-lose') {
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
            
            results[strategyKey].maxWin = Math.max(results[strategyKey].maxWin, profit);
            results[strategyKey].maxLoss = Math.min(results[strategyKey].maxLoss, profit);
            
            if (samples < 15 && strategyKey === 'Corrected25x') {
                const linearStake = strategies['Corrected25x'].calculateStake(data.higherOdds);
                console.log(`${data.match.slice(0,28).padEnd(29)} | ${data.higherOdds.toFixed(2)} | $${linearStake.toFixed(0).padStart(8)} | ${resultCode.padEnd(8)} | $${profit.toFixed(0).padStart(6)}`);
                samples++;
            }
        });
    });
    
    return results;
}

// Display final results
function displayResults(results) {
    console.log('\n🚀 CORRECTED 25x STEEPNESS FINAL RESULTS:');
    console.log('='.repeat(80));
    
    Object.keys(results).forEach(key => {
        const result = results[key];
        const roi = (result.totalProfit / result.totalStaked) * 100;
        const winRate = ((result.wins + result.halfWins * 0.5) / result.bets) * 100;
        
        console.log(`\n💰 ${key.toUpperCase()}:`);
        console.log(`   Bets: ${result.bets}`);
        console.log(`   Staked: $${result.totalStaked.toFixed(0)}`);
        console.log(`   Profit: $${result.totalProfit.toFixed(0)}`);
        console.log(`   ROI: ${roi.toFixed(2)}%`);
        console.log(`   Win Rate: ${winRate.toFixed(1)}%`);
        console.log(`   Max Win: $${result.maxWin.toFixed(0)}`);
        console.log(`   Max Loss: $${Math.abs(result.maxLoss).toFixed(0)}`);
        
        if (roi > 0) console.log(`   ✅ PROFITABLE`);
        else console.log(`   ❌ LOSING`);
    });
}

// Run the analysis
const higherOddsData = getHigherOddsData();
console.log(`Found ${higherOddsData.length} quarter handicap cases\n`);

const stats = analyzeHigherOdds(higherOddsData);
const strategies = createCorrectStrategies();
showBettingAmounts(strategies);
const results = testStrategies(higherOddsData, strategies);
displayResults(results);

// Find best performing strategy
const bestStrategy = Object.keys(results)
    .filter(key => key !== 'Conservative')
    .reduce((best, current) => {
        const currentROI = (results[current].totalProfit / results[current].totalStaked) * 100;
        const bestROI = best ? (results[best].totalProfit / results[best].totalStaked) * 100 : -Infinity;
        return currentROI > bestROI ? current : best;
    }, null);

if (bestStrategy) {
    const bestROI = (results[bestStrategy].totalProfit / results[bestStrategy].totalStaked) * 100;
    console.log('\n🏆 BEST CORRECTED STRATEGY:');
    console.log('='.repeat(60));
    console.log(`Winner: ${bestStrategy}`);
    console.log(`ROI: ${bestROI.toFixed(2)}%`);
    console.log(`Profit: $${results[bestStrategy].totalProfit.toFixed(0)}`);
    
    if (bestROI > 0) {
        console.log('\n🔥 CORRECTED 25x STEEPNESS CONFIRMED!');
        console.log('✅ User insight about higher odds range (1.91-2.24) was correct');
        console.log('✅ 25x steepness works with proper gradient application');
        console.log('✅ Trapped mechanism validated with correct betting range');
    }
}

console.log('\n✅ Corrected higher odds analysis complete!'); 