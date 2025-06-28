const fs = require('fs');

console.log('🔥 TESTING HOME UNDERDOG QUARTER HANDICAP MIRROR STRATEGY');
console.log('='.repeat(80));
console.log('💡 HYPOTHESIS: When home team is underdog in quarter handicaps,');
console.log('💡 bet the LOWER odds side (opposite of home advantage strategy)');
console.log('💡 Expected: Strong positive ROI mirroring the losing cases!');
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

// Simple stake calculation (same as before)
function calculateSimpleStake(odds) {
    const baseOdds = 1.91;
    const baseStake = 200;
    const increment = 150;
    
    if (odds < baseOdds) return baseStake;
    
    const steps = Math.round((odds - baseOdds) / 0.01);
    return baseStake + (steps * increment);
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

// NEW: Check if home team is UNDERDOG (getting positive handicaps)
function homeIsUnderdog(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        // Home is underdog if BOTH handicap values are positive
        return h1 > 0 && h2 > 0;
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

// Test the MIRROR strategy
function testMirrorStrategy() {
    let totalProfit = 0;
    let totalStaked = 0;
    let totalBets = 0;
    let wins = 0;
    let halfWins = 0;
    let losses = 0;
    let halfLosses = 0;
    
    const bettingRecords = [];
    const handicapBreakdown = {};
    
    console.log('🔍 Processing home underdog quarter handicap matches...');
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!homeIsUnderdog(ah.homeHandicap)) return; // Only home underdog cases
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        // MIRROR STRATEGY: Bet LOWER odds side (opposite of previous strategy)
        const lowerOdds = Math.min(ah.homeOdds, ah.awayOdds);
        const betSide = ah.homeOdds < ah.awayOdds ? 'Home' : 'Away';
        const betSideKey = ah.homeOdds < ah.awayOdds ? 'home' : 'away';
        
        const stake = calculateSimpleStake(lowerOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSideKey);
        
        if (!betResult) return;
        
        let profit = 0;
        let outcome = '';
        
        if (betResult === 'win') {
            profit = stake * (lowerOdds - 1);
            outcome = 'Win';
            wins++;
        } else if (betResult === 'half-win') {
            profit = stake * (lowerOdds - 1) / 2;
            outcome = 'Half Win';
            halfWins++;
        } else if (betResult === 'push') {
            profit = 0;
            outcome = 'Push';
        } else if (betResult === 'half-lose') {
            profit = -stake / 2;
            outcome = 'Half Loss';
            halfLosses++;
        } else {
            profit = -stake;
            outcome = 'Loss';
            losses++;
        }
        
        totalProfit += profit;
        totalStaked += stake;
        totalBets++;
        
        // Track handicap breakdown
        if (!handicapBreakdown[ah.homeHandicap]) {
            handicapBreakdown[ah.homeHandicap] = {
                bets: 0,
                profit: 0,
                staked: 0,
                wins: 0,
                losses: 0
            };
        }
        
        handicapBreakdown[ah.homeHandicap].bets++;
        handicapBreakdown[ah.homeHandicap].profit += profit;
        handicapBreakdown[ah.homeHandicap].staked += stake;
        if (outcome === 'Win' || outcome === 'Half Win') {
            handicapBreakdown[ah.homeHandicap].wins++;
        } else if (outcome === 'Loss' || outcome === 'Half Loss') {
            handicapBreakdown[ah.homeHandicap].losses++;
        }
        
        bettingRecords.push({
            date: matchInfo.date,
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            score: `${matchInfo.homeScore}-${matchInfo.awayScore}`,
            handicap: ah.homeHandicap,
            betSide: betSide,
            betOdds: lowerOdds.toFixed(2),
            stake: stake,
            profit: Math.round(profit),
            outcome: outcome
        });
    });
    
    // Calculate final results  
    const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(2) : '0.00';
    const winRate = totalBets > 0 ? (((wins + halfWins * 0.5) / totalBets) * 100).toFixed(1) : '0.0';
    
    console.log('\n🎯 MIRROR STRATEGY RESULTS:');
    console.log('='.repeat(60));
    console.log(`📊 Total Bets: ${totalBets}`);
    console.log(`💰 Total Staked: $${totalStaked.toFixed(0)}`);
    console.log(`📈 Total Profit: $${totalProfit.toFixed(0)}`);
    console.log(`🚀 ROI: ${roi}%`);
    console.log(`🎲 Win Rate: ${winRate}%`);
    console.log(`✅ Wins: ${wins}, Half-Wins: ${halfWins}`);
    console.log(`❌ Losses: ${losses}, Half-Losses: ${halfLosses}`);
    
    console.log('\n📋 HANDICAP BREAKDOWN:');
    console.log('='.repeat(60));
    Object.entries(handicapBreakdown)
        .sort((a, b) => (b[1].profit / b[1].staked) - (a[1].profit / a[1].staked))
        .forEach(([handicap, stats]) => {
            const handicapROI = ((stats.profit / stats.staked) * 100).toFixed(1);
            const handicapWinRate = ((stats.wins / stats.bets) * 100).toFixed(1);
            console.log(`${handicap.padEnd(12)}: ${stats.bets.toString().padStart(3)} bets, ${handicapROI.padStart(6)}% ROI, ${handicapWinRate.padStart(4)}% wins`);
        });
    
    console.log('\n📝 FIRST 10 BETTING RECORDS:');
    console.log('='.repeat(60));
    bettingRecords.slice(0, 10).forEach(record => {
        const profitColor = record.profit > 0 ? '✅' : record.profit < 0 ? '❌' : '➖';
        console.log(`${profitColor} ${record.date} | ${record.homeTeam} vs ${record.awayTeam} | ${record.score} | ${record.handicap} | Bet ${record.betSide} @${record.betOdds} | $${record.stake} | ${record.outcome} | $${record.profit}`);
    });
    
    return {
        totalBets,
        totalStaked,
        totalProfit,
        roi,
        winRate,
        handicapBreakdown,
        bettingRecords
    };
}

// Run the mirror strategy test
const results = testMirrorStrategy();

console.log('\n🔥 MIRROR STRATEGY ANALYSIS COMPLETE!');
console.log('='.repeat(80));

if (parseFloat(results.roi) > 20) {
    console.log('🚀 INCREDIBLE! Mirror strategy shows strong positive ROI!');
    console.log('💡 The trapped mechanism DOES work both ways!');
    console.log('🎯 We can exploit BOTH sides of quarter handicap mispricing!');
} else if (parseFloat(results.roi) > 5) {
    console.log('✅ Good! Mirror strategy shows positive ROI!');
    console.log('💡 Some edge exists betting lower odds on home underdogs');
} else if (parseFloat(results.roi) > 0) {
    console.log('📈 Modest positive ROI on mirror strategy');
} else {
    console.log('❌ Mirror strategy shows losses - hypothesis may be wrong');
    console.log('🤔 Or sample size may be too small to detect edge');
}

console.log(`\n📊 COMPARISON TO HOME ADVANTAGE STRATEGY:`);
console.log(`🏠 Home Advantage (betting higher odds): +57.65% ROI, 379 bets`);
console.log(`🏃 Home Underdog (betting lower odds): ${results.roi}% ROI, ${results.totalBets} bets`);

console.log('\n✅ Analysis complete!'); 