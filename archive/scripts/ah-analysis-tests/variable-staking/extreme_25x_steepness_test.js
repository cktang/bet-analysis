const fs = require('fs');

console.log('🚀 EXTREME 25x STEEPNESS BETTING TEST');
console.log('='.repeat(60));
console.log('💡 Testing REAL-WORLD HKJC constraints:');
console.log('   - Minimum bet: $200');
console.log('   - Maximum preferred: $5000 (25x steepness!)');
console.log('   - Strategy: Extreme aggressive scaling on quarter handicaps');
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

// Helper function to calculate Asian Handicap result
function calculateAHResult(homeScore, awayScore, homeHandicap, betSide) {
    const handicaps = homeHandicap.includes('/') ? 
        homeHandicap.split('/').map(h => parseFloat(h)) : 
        [parseFloat(homeHandicap)];
    
    const results = [];
    
    handicaps.forEach(hcp => {
        if (betSide === 'home') {
            const adjustedHomeScore = homeScore + hcp;
            if (adjustedHomeScore > awayScore) results.push('win');
            else if (adjustedHomeScore < awayScore) results.push('lose');
            else results.push('push');
        } else {
            const awayHcp = -hcp;
            const adjustedAwayScore = awayScore + awayHcp;
            if (adjustedAwayScore > homeScore) results.push('win');
            else if (adjustedAwayScore < homeScore) results.push('lose');
            else results.push('push');
        }
    });
    
    if (results.length === 1) {
        return results[0];
    }
    
    const [result1, result2] = results;
    
    if (result1 === 'win' && result2 === 'win') return 'win';
    if (result1 === 'lose' && result2 === 'lose') return 'lose';
    if (result1 === 'push' && result2 === 'push') return 'push';
    
    if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
    if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
    if ((result1 === 'win' && result2 === 'lose') || (result1 === 'lose' && result2 === 'win')) return 'half-win';
    
    return 'push';
}

// Extreme 25x steepness betting strategies
const extremeBettingStrategies = {
    'Conservative': {
        name: 'Conservative Baseline',
        description: 'Original winning strategy (3.33x steepness)',
        calculateStake: (odds) => {
            if (odds >= 2.5) return Math.min(odds * 100, 800);
            else if (odds >= 2.0) return Math.min(odds * 80, 500);
            else return Math.min(odds * 50, 300);
        }
    },
            'Extreme25x': {
            name: 'Extreme 25x Realistic',
            description: '$200 min to $5000 max (realistic AH range 1.80-2.35)',
            calculateStake: (odds) => {
                // Realistic AH odds: Linear scaling from $200 (at 1.80 odds) to $5000 (at 2.35+ odds)
                const minOdds = 1.80;
                const maxOdds = 2.35;  // Based on actual max AH odds of 2.32
                const minStake = 200;
                const maxStake = 5000;
                
                if (odds <= minOdds) return minStake;
                if (odds >= maxOdds) return maxStake;
                
                // Linear interpolation across realistic AH range
                const ratio = (odds - minOdds) / (maxOdds - minOdds);
                return minStake + (ratio * (maxStake - minStake));
            }
        },
            'Extreme25xTiered': {
            name: 'Extreme 25x Tiered Realistic',
            description: 'Realistic AH tiers: $200-$5000 across 1.80-2.35 odds',
            calculateStake: (odds) => {
                if (odds < 1.80) return 200; // Minimum bet
                else if (odds < 2.0) return 200 + (odds - 1.80) * 1000; // $200-$400
                else if (odds < 2.2) return 400 + (odds - 2.0) * 3000; // $400-$1000  
                else if (odds < 2.3) return 1000 + (odds - 2.2) * 20000; // $1000-$3000
                else return Math.min(3000 + (odds - 2.3) * 40000, 5000); // $3000-$5000
            }
        }
};

// Create betting amount table
function createBettingTable() {
    console.log('💰 YOUR BETTING AMOUNTS BY ODDS LEVEL:');
    console.log('='.repeat(80));
    
    const oddsToTest = [1.60, 1.70, 1.80, 1.90, 2.00, 2.10, 2.20, 2.30, 2.35]; // Realistic AH odds range
    
    console.log('Odds  | Conservative | Extreme25x | Tiered25x | 25x Multiplier');
    console.log('-'.repeat(80));
    
    oddsToTest.forEach(odds => {
        const stakes = {};
        Object.keys(extremeBettingStrategies).forEach(strategyKey => {
            stakes[strategyKey] = extremeBettingStrategies[strategyKey].calculateStake(odds);
        });
        
        const ratio = stakes['Extreme25x'] / stakes['Conservative'];
        
        console.log(`${odds.toFixed(2).padStart(5)} | $${stakes['Conservative'].toFixed(0).padStart(11)} | $${stakes['Extreme25x'].toFixed(0).padStart(9)} | $${stakes['Extreme25xTiered'].toFixed(0).padStart(8)} | ${ratio.toFixed(1).padStart(13)}x`);
    });
}

// Test extreme betting
function testExtremeBetting() {
    const results = {};
    
    Object.keys(extremeBettingStrategies).forEach(strategyKey => {
        results[strategyKey] = {
            name: extremeBettingStrategies[strategyKey].name,
            totalStaked: 0,
            totalProfit: 0,
            bets: 0,
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
    
    let quarterMatchCount = 0;
    let sampleBetsShown = 0;
    
    console.log('\n📊 EXTREME BETTING EXAMPLES (first 15 cases):');
    console.log('-'.repeat(110));
    console.log('Match                              | Odds | Extreme25x | Tiered25x | Result   | Extreme Profit');
    console.log('-'.repeat(110));
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        if (!homeOdds || !awayOdds) return;
        
        quarterMatchCount++;
        
        const betSide = homeOdds > awayOdds ? 'home' : 'away';
        const higherOdds = Math.max(homeOdds, awayOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        Object.keys(extremeBettingStrategies).forEach(strategyKey => {
            const strategy = extremeBettingStrategies[strategyKey];
            const stake = strategy.calculateStake(higherOdds);
            
            let profit = 0;
            let resultCode = '';
            
            if (betResult === 'win') {
                profit = stake * (higherOdds - 1);
                results[strategyKey].wins++;
                resultCode = 'WIN';
            } else if (betResult === 'half-win') {
                profit = (stake * (higherOdds - 1)) / 2;
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
            
            if (sampleBetsShown < 15 && strategyKey === 'Extreme25x') {
                const matchStr = `${matchInfo.homeTeam.slice(0,12)} vs ${matchInfo.awayTeam.slice(0,12)}`;
                const extreme25xStake = extremeBettingStrategies['Extreme25x'].calculateStake(higherOdds);
                const tieredStake = extremeBettingStrategies['Extreme25xTiered'].calculateStake(higherOdds);
                
                console.log(`${matchStr.padEnd(34)} | ${higherOdds.toFixed(2).padStart(4)} | $${extreme25xStake.toFixed(0).padStart(9)} | $${tieredStake.toFixed(0).padStart(8)} | ${resultCode.padEnd(8)} | $${profit.toFixed(0).padStart(13)}`);
                sampleBetsShown++;
            }
        });
    });
    
    console.log('-'.repeat(110));
    console.log(`\nProcessed ${quarterMatchCount} quarter handicap matches\n`);
    
    return results;
}

// Display results
function displayResults(results) {
    console.log('🚀 EXTREME 25x STEEPNESS RESULTS:');
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

// Run the test
createBettingTable();
const results = testExtremeBetting();
displayResults(results);

// Find best extreme strategy
let bestExtreme = null;
let bestROI = -Infinity;

Object.keys(results).forEach(key => {
    if (key === 'Conservative') return;
    const roi = (results[key].totalProfit / results[key].totalStaked) * 100;
    if (roi > bestROI) {
        bestROI = roi;
        bestExtreme = { key, roi, profit: results[key].totalProfit };
    }
});

console.log('\n🏆 BEST 25x STRATEGY RESULTS:');
console.log('='.repeat(60));
console.log(`Winner: ${extremeBettingStrategies[bestExtreme.key].name}`);
console.log(`ROI: ${bestExtreme.roi.toFixed(2)}%`);
console.log(`Total Profit: $${bestExtreme.profit.toFixed(0)}`);

if (bestExtreme.roi > 0) {
    console.log('\n🔥 25x STEEPNESS WORKS!');
    console.log('✅ Your aggressive $200-$5000 scaling is profitable');
    console.log('✅ Higher risk, higher reward strategy validated!');
} else {
    console.log('\n❌ 25x steepness too aggressive for consistent profit');
}
