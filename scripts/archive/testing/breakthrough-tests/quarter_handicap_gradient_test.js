const fs = require('fs');

console.log('🎯 QUARTER HANDICAP GRADIENT BETTING TEST');
console.log('='.repeat(60));
console.log('💡 Testing: "Bet higher odds side in QUARTER handicaps only"');
console.log('   - Focus: ONLY quarter handicaps (where trapped mechanism works)');
console.log('   - Strategy: Higher odds = bigger bet (gradient-based sizing)');
console.log('   - Theory: Trapped mechanism creates value in quarter handicaps');
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
    // Single handicaps (pure integers or halves) are NOT quarter handicaps
    const singlePatterns = [
        '0', '-0.5', '+0.5', '-1', '+1', '-1.5', '+1.5', '-2', '+2', '-2.5', '+2.5', '-3', '+3'
    ];
    
    if (singlePatterns.includes(handicap)) {
        return false;
    }
    
    // If it contains a slash, it's a split/quarter handicap
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

// Betting strategies optimized for quarter handicaps
const quarterBettingStrategies = {
    'Fixed': {
        name: 'Fixed Stake',
        description: 'Bet same amount on every higher odds side',
        calculateStake: (odds) => 100
    },
    'Linear': {
        name: 'Linear Proportional',
        description: 'Bet proportionally to odds (higher odds = bigger bet)',
        calculateStake: (odds) => Math.min(odds * 60, 400) // Increased scaling for quarters
    },
    'Square': {
        name: 'Square Proportional', 
        description: 'Bet proportionally to odds squared (aggressive scaling)',
        calculateStake: (odds) => Math.min(odds * odds * 25, 600) // Increased scaling
    },
    'Trapped': {
        name: 'Trapped-Optimized',
        description: 'Aggressive scaling for trapped quarter handicaps',
        calculateStake: (odds) => {
            if (odds >= 2.5) return Math.min(odds * 100, 800); // Very aggressive on high odds
            else if (odds >= 2.0) return Math.min(odds * 80, 500);
            else return Math.min(odds * 50, 300);
        }
    }
};

// Test quarter handicap gradient betting
function testQuarterGradientBetting() {
    const results = {};
    
    // Initialize results for each strategy
    Object.keys(quarterBettingStrategies).forEach(strategyKey => {
        results[strategyKey] = {
            name: quarterBettingStrategies[strategyKey].name,
            totalStaked: 0,
            totalProfit: 0,
            bets: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            halfWins: 0,
            halfLosses: 0,
            extremeOddsCases: 0
        };
    });
    
    let quarterMatchCount = 0;
    let sampleBetsShown = 0;
    
    console.log('📊 QUARTER HANDICAP BETTING LOG (first 20 cases):');
    console.log('-'.repeat(120));
    console.log('Match                              | Handicap   | Higher | Odds | Fixed | Linear| Trapped| Result');
    console.log('                                   |            | Side   |      | Stake | Stake | Stake  |       ');
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
        
        // Check if this is an extreme odds case (≤1.72)
        const isExtremeCase = lowerOdds <= 1.72;
        
        // Calculate result for our bet
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        // Test each betting strategy
        Object.keys(quarterBettingStrategies).forEach(strategyKey => {
            const strategy = quarterBettingStrategies[strategyKey];
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
            
            if (isExtremeCase) {
                results[strategyKey].extremeOddsCases++;
            }
            
            // Log sample bets
            if (sampleBetsShown < 20 && strategyKey === 'Fixed') {
                const matchStr = `${matchInfo.homeTeam.slice(0,12)} vs ${matchInfo.awayTeam.slice(0,12)}`;
                const sideStr = betSide === 'home' ? 'H' : 'A';
                
                const fixedStake = quarterBettingStrategies['Fixed'].calculateStake(higherOdds);
                const linearStake = quarterBettingStrategies['Linear'].calculateStake(higherOdds);
                const trappedStake = quarterBettingStrategies['Trapped'].calculateStake(higherOdds);
                
                console.log(`${matchStr.padEnd(34)} | ${ah.homeHandicap.padEnd(10)} | ${sideStr.padEnd(6)} | ${higherOdds.toFixed(2).padStart(4)} | ${fixedStake.toFixed(0).padStart(5)} | ${linearStake.toFixed(0).padStart(5)} | ${trappedStake.toFixed(0).padStart(6)} | ${resultCode.padEnd(8)}`);
                sampleBetsShown++;
            }
        });
    });
    
    console.log('-'.repeat(120));
    console.log(`\n📊 Processed ${quarterMatchCount} quarter handicap matches\n`);
    
    return results;
}

// Display quarter handicap results
function displayQuarterResults(results) {
    console.log('🎯 QUARTER HANDICAP GRADIENT RESULTS:');
    console.log('='.repeat(80));
    
    Object.keys(results).forEach(strategyKey => {
        const result = results[strategyKey];
        const roi = (result.totalProfit / result.totalStaked) * 100;
        const winRate = ((result.wins + result.halfWins * 0.5 + result.pushes * 0.5) / result.bets) * 100;
        const avgStake = result.totalStaked / result.bets;
        
        console.log(`\n📈 ${result.name.toUpperCase()}:`);
        console.log(`   Description: ${quarterBettingStrategies[strategyKey].description}`);
        console.log(`   Total Quarter Bets: ${result.bets}`);
        console.log(`   Extreme Odds Cases: ${result.extremeOddsCases} (${(result.extremeOddsCases/result.bets*100).toFixed(1)}%)`);
        console.log(`   Total Staked: ${result.totalStaked.toFixed(0)} units`);
        console.log(`   Total Profit/Loss: ${result.totalProfit.toFixed(0)} units`);
        console.log(`   ROI: ${roi.toFixed(2)}%`);
        console.log(`   Win Rate: ${winRate.toFixed(1)}%`);
        console.log(`   Average Stake: ${avgStake.toFixed(0)} units`);
        console.log(`   Results Breakdown:`);
        console.log(`     Wins: ${result.wins} | Half-Wins: ${result.halfWins} | Pushes: ${result.pushes}`);
        console.log(`     Half-Losses: ${result.halfLosses} | Losses: ${result.losses}`);
        
        // Performance indicator
        if (roi > 10) console.log(`   🔥 EXCELLENT PERFORMANCE!`);
        else if (roi > 5) console.log(`   ✅ VERY PROFITABLE`);
        else if (roi > 0) console.log(`   ✅ PROFITABLE`);
        else if (roi > -5) console.log(`   ⚠️ MARGINAL LOSS`);
        else console.log(`   ❌ SIGNIFICANT LOSS`);
    });
}

// Run the quarter handicap test
console.log('🎯 RUNNING QUARTER HANDICAP GRADIENT TEST');
console.log('='.repeat(60));

const results = testQuarterGradientBetting();
displayQuarterResults(results);

// Find best performing strategy for quarter handicaps
let bestQuarterStrategy = null;
let bestQuarterROI = -Infinity;

Object.keys(results).forEach(strategyKey => {
    const result = results[strategyKey];
    const roi = (result.totalProfit / result.totalStaked) * 100;
    
    if (roi > bestQuarterROI) {
        bestQuarterROI = roi;
        bestQuarterStrategy = {
            key: strategyKey,
            name: result.name,
            roi: roi,
            profit: result.totalProfit,
            staked: result.totalStaked,
            bets: result.bets
        };
    }
});

console.log('\n🏆 BEST QUARTER HANDICAP STRATEGY:');
console.log('='.repeat(60));
console.log(`🥇 Winner: ${bestQuarterStrategy.name}`);
console.log(`📈 ROI: ${bestQuarterStrategy.roi.toFixed(2)}%`);
console.log(`💰 Total Profit: ${bestQuarterStrategy.profit.toFixed(0)} units`);
console.log(`💸 Total Staked: ${bestQuarterStrategy.staked.toFixed(0)} units`);
console.log(`🎯 Total Bets: ${bestQuarterStrategy.bets}`);

console.log('\n🎯 QUARTER HANDICAP THEORY VALIDATION:');
console.log('='.repeat(60));

if (bestQuarterStrategy.roi > 5) {
    console.log('🔥 QUARTER HANDICAP GRADIENT THEORY CONFIRMED!');
    console.log('✅ Betting higher odds in quarter handicaps is profitable');
    console.log('✅ Trapped mechanism creates systematic value in quarter markets');
    console.log('✅ Proportional betting amplifies the quarter handicap edge');
    console.log('\n💡 The trapped mechanism works specifically in quarter handicaps');
    console.log('   where HKJC cannot escape to pure half handicaps!');
} else if (bestQuarterStrategy.roi > 0) {
    console.log('⚡ Quarter handicap edge exists but is modest');
    console.log('✅ Still profitable, confirming trapped theory');
    console.log('   But effect may be smaller than expected');
} else {
    console.log('❌ Quarter handicap gradient theory not validated');
    console.log('   Even in quarter handicaps, higher odds betting loses money');
    console.log('   Trapped mechanism may be more specific than theorized');
}

console.log('\n✅ Quarter handicap gradient test complete!'); 