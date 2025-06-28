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
        name: 'Extreme 25x Steepness',
        description: '$200 min to $5000 max (25x steepness)',
        calculateStake: (odds) => {
            // Linear scaling from $200 (at 1.80 odds) to $5000 (at 3.50+ odds)
            const minOdds = 1.80;
            const maxOdds = 3.50;
            const minStake = 200;
            const maxStake = 5000;
            
            if (odds <= minOdds) return minStake;
            if (odds >= maxOdds) return maxStake;
            
            // Linear interpolation between min and max
            const ratio = (odds - minOdds) / (maxOdds - minOdds);
            return minStake + (ratio * (maxStake - minStake));
        }
    },
    'Extreme25xTiered': {
        name: 'Extreme 25x Tiered',
        description: '$200 min to $5000 max with smart tiers',
        calculateStake: (odds) => {
            if (odds < 1.80) return 200; // Minimum bet
            else if (odds < 2.0) return 200 + (odds - 1.80) * 500; // $200-$300
            else if (odds < 2.5) return 300 + (odds - 2.0) * 1400; // $300-$1000
            else if (odds < 3.0) return 1000 + (odds - 2.5) * 3000; // $1000-$2500
            else return Math.min(2500 + (odds - 3.0) * 5000, 5000); // $2500-$5000 (cap)
        }
    }
};

// Create betting amount table for different odds
function createBettingTable() {
    console.log('💰 BETTING AMOUNTS BY ODDS LEVEL:');
    console.log('='.repeat(80));
    
    const oddsToTest = [1.60, 1.70, 1.80, 1.90, 2.00, 2.20, 2.50, 2.80, 3.00, 3.50, 4.00];
    
    console.log('Odds  | Conservative | Extreme25x | Tiered25x | 25x/Conservative');
    console.log('-'.repeat(80));
    
    oddsToTest.forEach(odds => {
        const stakes = {};
        Object.keys(extremeBettingStrategies).forEach(strategyKey => {
            stakes[strategyKey] = extremeBettingStrategies[strategyKey].calculateStake(odds);
        });
        
        const ratio = stakes['Extreme25x'] / stakes['Conservative'];
        
        console.log(`${odds.toFixed(2).padStart(5)} | $${stakes['Conservative'].toFixed(0).padStart(11)} | $${stakes['Extreme25x'].toFixed(0).padStart(9)} | $${stakes['Extreme25xTiered'].toFixed(0).padStart(8)} | ${ratio.toFixed(1).padStart(16)}`);
    });
}

// Test extreme betting on quarter handicaps
function testExtremeBetting() {
    const results = {};
    
    // Initialize results for each strategy
    Object.keys(extremeBettingStrategies).forEach(strategyKey => {
        results[strategyKey] = {
            name: extremeBettingStrategies[strategyKey].name,
            totalStaked: 0,
            totalProfit: 0,
            bets: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            halfWins: 0,
            halfLosses: 0,
            maxWin: 0,
            maxLoss: 0,
            bigWins: 0, // Wins over $1000
            bigLosses: 0, // Losses over $1000
            detailedResults: []
        };
    });
    
    let quarterMatchCount = 0;
    let sampleBetsShown = 0;
    
    console.log('\n📊 EXTREME BETTING LOG (first 15 quarter handicap cases):');
    console.log('-'.repeat(120));
    console.log('Match                              | Handicap   | Odds | Extreme25x | Tiered25x | Result   | Extreme Profit');
    console.log('-'.repeat(120));
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        
        // ONLY quarter handicaps
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        
        if (!homeOdds || !awayOdds) return;
        
        quarterMatchCount++;
        
        // Identify higher odds side (the underdog)
        const betSide = homeOdds > awayOdds ? 'home' : 'away';
        const higherOdds = Math.max(homeOdds, awayOdds);
        const lowerOdds = Math.min(homeOdds, awayOdds);
        
        // Calculate result for our bet
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        // Test each betting strategy
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
                results[strategyKey].pushes++;
                resultCode = 'PUSH';
            } else if (betResult === 'half-lose') {
                profit = -stake / 2;
                results[strategyKey].halfLosses++;
                resultCode = 'HALF-LOSE';
            } else { // lose
                profit = -stake;
                results[strategyKey].losses++;
                resultCode = 'LOSE';
            }
            
            results[strategyKey].totalStaked += stake;
            results[strategyKey].totalProfit += profit;
            results[strategyKey].bets++;
            
            // Track extremes
            if (profit > 1000) results[strategyKey].bigWins++;
            if (profit < -1000) results[strategyKey].bigLosses++;
            
            results[strategyKey].maxWin = Math.max(results[strategyKey].maxWin, profit);
            results[strategyKey].maxLoss = Math.min(results[strategyKey].maxLoss, profit);
            
            // Store detailed result for analysis
            results[strategyKey].detailedResults.push({
                match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
                handicap: ah.homeHandicap,
                odds: higherOdds,
                stake: stake,
                result: betResult,
                profit: profit
            });
            
            // Log sample bets (show Extreme25x strategy)
            if (sampleBetsShown < 15 && strategyKey === 'Extreme25x') {
                const matchStr = `${matchInfo.homeTeam.slice(0,12)} vs ${matchInfo.awayTeam.slice(0,12)}`;
                
                const extreme25xStake = extremeBettingStrategies['Extreme25x'].calculateStake(higherOdds);
                const tieredStake = extremeBettingStrategies['Extreme25xTiered'].calculateStake(higherOdds);
                
                console.log(`${matchStr.padEnd(34)} | ${ah.homeHandicap.padEnd(10)} | ${higherOdds.toFixed(2).padStart(4)} | $${extreme25xStake.toFixed(0).padStart(9)} | $${tieredStake.toFixed(0).padStart(8)} | ${resultCode.padEnd(8)} | $${profit.toFixed(0).padStart(13)}`);
                sampleBetsShown++;
            }
        });
    });
    
    console.log('-'.repeat(120));
    console.log(`\n📊 Processed ${quarterMatchCount} quarter handicap matches\n`);
    
    return results;
}

// Display extreme betting results
function displayExtremeResults(results) {
    console.log('🚀 EXTREME 25x STEEPNESS RESULTS:');
    console.log('='.repeat(100));
    
    Object.keys(results).forEach(strategyKey => {
        const result = results[strategyKey];
        const roi = (result.totalProfit / result.totalStaked) * 100;
        const winRate = ((result.wins + result.halfWins * 0.5 + result.pushes * 0.5) / result.bets) * 100;
        const avgStake = result.totalStaked / result.bets;
        const avgProfit = result.totalProfit / result.bets;
        
        console.log(`\n💰 ${result.name.toUpperCase()}:`);
        console.log(`   Description: ${extremeBettingStrategies[strategyKey].description}`);
        console.log(`   Total Quarter Bets: ${result.bets}`);
        console.log(`   Total Staked: $${result.totalStaked.toFixed(0)}`);
        console.log(`   Total Profit/Loss: $${result.totalProfit.toFixed(0)}`);
        console.log(`   ROI: ${roi.toFixed(2)}%`);
        console.log(`   Win Rate: ${winRate.toFixed(1)}%`);
        console.log(`   Average Stake: $${avgStake.toFixed(0)}`);
        console.log(`   Average Profit per Bet: $${avgProfit.toFixed(0)}`);
        console.log(`   Max Single Win: $${result.maxWin.toFixed(0)}`);
        console.log(`   Max Single Loss: $${Math.abs(result.maxLoss).toFixed(0)}`);
        console.log(`   Big Wins (>$1000): ${result.bigWins}`);
        console.log(`   Big Losses (>$1000): ${result.bigLosses}`);
        
        // Performance indicator
        if (roi > 5) console.log(`   🔥 EXCELLENT PERFORMANCE!`);
        else if (roi > 0) console.log(`   ✅ PROFITABLE`);
        else console.log(`   ❌ LOSS MAKING`);
        
        // Risk warning for extreme strategies
        if (avgStake > 1000) {
            console.log(`   ⚠️ HIGH RISK: Average stake over $1000`);
        }
    });
}

// Show the best and worst cases for extreme betting
function showExtremeExamples(results) {
    console.log('\n🎲 EXTREME BETTING EXAMPLES:');
    console.log('='.repeat(90));
    
    const extremeResults = results['Extreme25x'].detailedResults;
    
    // Sort by profit to find best and worst
    const sortedResults = extremeResults.sort((a, b) => b.profit - a.profit);
    
    console.log('🏆 TOP 10 BIGGEST WINS:');
    console.log('Match                                | Odds | Stake   | Profit   | ROI');
    console.log('-'.repeat(75));
    
    sortedResults.slice(0, 10).forEach(result => {
        const roi = (result.profit / result.stake) * 100;
        const matchStr = result.match.slice(0, 35);
        console.log(`${matchStr.padEnd(36)} | ${result.odds.toFixed(2)} | $${result.stake.toFixed(0).padStart(6)} | $${result.profit.toFixed(0).padStart(7)} | ${roi.toFixed(0)}%`);
    });
    
    console.log('\n💀 TOP 10 BIGGEST LOSSES:');
    console.log('Match                                | Odds | Stake   | Loss     | Impact');
    console.log('-'.repeat(75));
    
    sortedResults.slice(-10).forEach(result => {
        const matchStr = result.match.slice(0, 35);
        console.log(`${matchStr.padEnd(36)} | ${result.odds.toFixed(2)} | $${result.stake.toFixed(0).padStart(6)} | $${Math.abs(result.profit).toFixed(0).padStart(7)} | OUCH!`);
    });
}

// Run the comprehensive extreme test
createBettingTable();
const results = testExtremeBetting();
displayExtremeResults(results);
showExtremeExamples(results);

// Find the best extreme strategy
let bestExtremeStrategy = null;
let bestExtremeROI = -Infinity;

Object.keys(results).forEach(strategyKey => {
    if (strategyKey === 'Conservative') return; // Skip baseline
    
    const result = results[strategyKey];
    const roi = (result.totalProfit / result.totalStaked) * 100;
    
    if (roi > bestExtremeROI) {
        bestExtremeROI = roi;
        bestExtremeStrategy = {
            key: strategyKey,
            name: result.name,
            roi: roi,
            profit: result.totalProfit,
            staked: result.totalStaked
        };
    }
});

console.log('\n🏆 BEST EXTREME 25x STRATEGY:');
console.log('='.repeat(60));
console.log(`🥇 Winner: ${bestExtremeStrategy.name}`);
console.log(`📈 ROI: ${bestExtremeStrategy.roi.toFixed(2)}%`);
console.log(`💰 Total Profit: $${bestExtremeStrategy.profit.toFixed(0)}`);
console.log(`💸 Total Staked: $${bestExtremeStrategy.staked.toFixed(0)}`);

console.log('\n🎯 EXTREME STEEPNESS VALIDATION:');
console.log('='.repeat(60));

if (bestExtremeStrategy.roi > 5) {
    console.log('🔥 25x STEEPNESS CONFIRMED PROFITABLE!');
    console.log('✅ Extreme aggression captures massive trapped value');
    console.log('✅ Your $200-$5000 scaling works with quarter handicaps');
    console.log('✅ High-risk, high-reward strategy validated!');
} else if (bestExtremeStrategy.roi > 0) {
    console.log('⚡ 25x steepness is profitable but risky');
    console.log('✅ Strategy works but requires strong risk tolerance');
} else {
    console.log('❌ 25x steepness too aggressive - amplifies losses');
    console.log('   Consider reducing maximum stake size');
}

console.log('\n💡 Your real-world HKJC constraints tested!'); 