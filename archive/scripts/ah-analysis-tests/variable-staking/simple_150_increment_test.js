const fs = require('fs');

console.log('💰 SIMPLE $150 INCREMENT BETTING STRATEGY');
console.log('='.repeat(80));
console.log('🎯 Rule: Start $200 at 1.91 odds, add $150 per 0.01 increment');
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

// Simple stake calculation
function calculateSimpleStake(odds) {
    const baseOdds = 1.91;
    const baseStake = 200;
    const increment = 150;
    
    if (odds < baseOdds) return baseStake;
    
    const steps = Math.round((odds - baseOdds) / 0.01);
    return baseStake + (steps * increment);
}

// Show betting table
console.log('📋 SIMPLE BETTING TABLE:');
console.log('='.repeat(50));
console.log('Odds  | Stake   | Increment | Profit if Win');
console.log('-'.repeat(50));

for (let odds = 1.91; odds <= 2.32; odds += 0.01) {
    const stake = calculateSimpleStake(odds);
    const steps = Math.round((odds - 1.91) / 0.01);
    const profitIfWin = stake * (odds - 1);
    
    console.log(`${odds.toFixed(2)} | $${stake.toString().padStart(6)} | ${steps.toString().padStart(8)} | $${profitIfWin.toFixed(0).padStart(10)}`);
}

// Helper functions
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

function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return null;
    }
    
    const scoreDiff = homeScore - awayScore;
    const adjustedDiff = betSide === 'home' ? scoreDiff : -scoreDiff;
    
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

// Test the simple strategy
console.log('\n📊 TESTING SIMPLE $150 INCREMENT STRATEGY:');
console.log('='.repeat(80));

const results = {
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

console.log('Sample betting results:');
console.log('Match                         | Odds | Stake  | Result   | Profit');
console.log('-'.repeat(70));

let samples = 0;

allMatches.forEach(match => {
    const ah = match.preMatch?.match?.asianHandicapOdds;
    const matchInfo = match.preMatch?.match;
    
    if (!ah?.homeHandicap || !matchInfo) return;
    if (!isQuarterHandicap(ah.homeHandicap)) return;
    if (!ah.homeOdds || !ah.awayOdds) return;
    if (typeof matchInfo.homeScore === 'undefined') return;
    
    const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
    const betSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
    
    const stake = calculateSimpleStake(higherOdds);
    const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
    
    if (!betResult) return;
    
    let profit = 0;
    let resultCode = '';
    
    if (betResult === 'win') {
        profit = stake * (higherOdds - 1);
        results.wins++;
        resultCode = 'WIN';
    } else if (betResult === 'half-win') {
        profit = stake * (higherOdds - 1) / 2;
        results.halfWins++;
        resultCode = 'HALF-WIN';
    } else if (betResult === 'push') {
        profit = 0;
        resultCode = 'PUSH';
    } else if (betResult === 'half-lose') {
        profit = -stake / 2;
        results.halfLosses++;
        resultCode = 'HALF-LOSE';
    } else {
        profit = -stake;
        results.losses++;
        resultCode = 'LOSE';
    }
    
    results.totalStaked += stake;
    results.totalProfit += profit;
    results.bets++;
    
    if (profit > 1000) results.bigWins++;
    if (profit < -1000) results.bigLosses++;
    
    results.maxWin = Math.max(results.maxWin, profit);
    results.maxLoss = Math.min(results.maxLoss, profit);
    
    // Show first 15 examples
    if (samples < 15) {
        const matchStr = `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`.slice(0, 28);
        console.log(`${matchStr.padEnd(29)} | ${higherOdds.toFixed(2)} | $${stake.toString().padStart(5)} | ${resultCode.padEnd(8)} | $${profit.toFixed(0).padStart(6)}`);
        samples++;
    }
});

console.log('-'.repeat(70));

// Display results
const roi = (results.totalProfit / results.totalStaked) * 100;
const winRate = ((results.wins + results.halfWins * 0.5) / results.bets) * 100;
const avgStake = results.totalStaked / results.bets;

console.log('\n🚀 SIMPLE $150 INCREMENT RESULTS:');
console.log('='.repeat(60));
console.log(`Total Bets: ${results.bets}`);
console.log(`Total Staked: $${results.totalStaked.toFixed(0)}`);
console.log(`Total Profit: $${results.totalProfit.toFixed(0)}`);
console.log(`ROI: ${roi.toFixed(2)}%`);
console.log(`Win Rate: ${winRate.toFixed(1)}%`);
console.log(`Average Stake: $${avgStake.toFixed(0)}`);
console.log(`Max Win: $${results.maxWin.toFixed(0)}`);
console.log(`Max Loss: $${Math.abs(results.maxLoss).toFixed(0)}`);
console.log(`Big Wins (>$1000): ${results.bigWins}`);
console.log(`Big Losses (>$1000): ${results.bigLosses}`);

if (roi > 0) {
    console.log('\n✅ SIMPLE STRATEGY IS PROFITABLE!');
} else {
    console.log('\n❌ Simple strategy shows losses');
}

// Show key stats
console.log('\n📊 SIMPLE STRATEGY BREAKDOWN:');
console.log('='.repeat(50));
console.log(`Rule: $200 + ($150 × steps of 0.01)`);
console.log(`Maximum stake at 2.32 odds: $${calculateSimpleStake(2.32)}`);
console.log(`Steepness ratio: ${(calculateSimpleStake(2.32) / 200).toFixed(1)}x`);

// Compare common odds
console.log('\n🎯 COMMON ODDS STAKES:');
console.log('1.95 odds: $' + calculateSimpleStake(1.95));
console.log('2.00 odds: $' + calculateSimpleStake(2.00));
console.log('2.10 odds: $' + calculateSimpleStake(2.10));
console.log('2.20 odds: $' + calculateSimpleStake(2.20));

console.log('\n✅ Simple $150 increment test complete!'); 