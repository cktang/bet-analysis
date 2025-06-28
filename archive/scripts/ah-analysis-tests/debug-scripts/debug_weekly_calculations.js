const fs = require('fs');

console.log('🔍 DEBUGGING WEEKLY CALCULATION ERRORS');
console.log('='.repeat(80));
console.log('🎯 Verifying ROI, win rate, and profit calculations');
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

// CORRECT Asian Handicap calculation (using the fixed logic)
function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return null;
    }
    
    if (!handicap.includes('/')) return null;
    
    const parts = handicap.split('/');
    const h1 = parseFloat(parts[0]);
    const h2 = parseFloat(parts[1]);
    
    // Apply handicap to HOME team score (handicap is always from home perspective)
    const homeScoreWithH1 = homeScore + h1;
    const homeScoreWithH2 = homeScore + h2;
    
    // Determine results for each line based on who we're betting on
    let result1, result2;
    
    if (betSide === 'home') {
        // Betting on home team
        result1 = homeScoreWithH1 > awayScore ? 'win' : (homeScoreWithH1 === awayScore ? 'push' : 'lose');
        result2 = homeScoreWithH2 > awayScore ? 'win' : (homeScoreWithH2 === awayScore ? 'push' : 'lose');
    } else {
        // Betting on away team (reverse the logic)
        result1 = homeScoreWithH1 < awayScore ? 'win' : (homeScoreWithH1 === awayScore ? 'push' : 'lose');
        result2 = homeScoreWithH2 < awayScore ? 'win' : (homeScoreWithH2 === awayScore ? 'push' : 'lose');
    }
    
    // Combine results
    if (result1 === 'win' && result2 === 'win') return 'win';
    if (result1 === 'lose' && result2 === 'lose') return 'lose';
    if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
    if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
    return 'push';
}

// Helper functions
function calculateSimpleStake(odds) {
    const baseOdds = 1.91;
    const baseStake = 200;
    const increment = 150;
    
    if (odds < baseOdds) return baseStake;
    
    const steps = Math.round((odds - baseOdds) / 0.01);
    return baseStake + (steps * increment);
}

function isQuarterHandicap(handicap) {
    return handicap && handicap.includes('/');
}

function homeHasAdvantage(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        return h1 < 0 && h2 < 0;
    }
    return false;
}

function homeIsUnderdog(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        return h1 > 0 && h2 > 0;
    }
    return false;
}

// Debug specific calculations
function debugCalculations() {
    console.log('🔬 DEBUGGING SPECIFIC EXAMPLES:');
    console.log('='.repeat(60));
    
    // Focus on suspicious results
    const debugTargets = [
        { period: 'Late (25-38)', handicap: '+2/+2.5', type: 'Home Underdog' },
        { period: 'Early (1-8)', handicap: '+0.5/+1', type: 'Home Underdog' },
        { period: 'Late (25-38)', handicap: '+1.5/+2', type: 'Home Underdog' }
    ];
    
    debugTargets.forEach(target => {
        console.log(`\n🎯 DEBUGGING: ${target.period} ${target.handicap} (${target.type})`);
        console.log('-'.repeat(50));
        
        let bets = 0;
        let totalStaked = 0;
        let totalProfit = 0;
        let wins = 0;
        let halfWins = 0;
        let losses = 0;
        let halfLosses = 0;
        let pushes = 0;
        let totalOdds = 0;
        
        allMatches.forEach((match, index) => {
            const ah = match.preMatch?.match?.asianHandicapOdds;
            const matchInfo = match.preMatch?.match;
            const fbref = match.preMatch?.fbref;
            
            if (!ah?.homeHandicap || !matchInfo || !fbref?.week) return;
            if (!isQuarterHandicap(ah.homeHandicap)) return;
            if (!ah.homeOdds || !ah.awayOdds) return;
            if (typeof matchInfo.homeScore === 'undefined') return;
            
            // Check if this matches our target
            const isHomeAdvantage = homeHasAdvantage(ah.homeHandicap);
            const isHomeUnderdog = homeIsUnderdog(ah.homeHandicap);
            
            if (!isHomeAdvantage && !isHomeUnderdog) return;
            
            const week = fbref.week;
            let period;
            if (week >= 1 && week <= 8) period = 'Early (1-8)';
            else if (week >= 9 && week <= 16) period = 'Mid-Early (9-16)';
            else if (week >= 17 && week <= 24) period = 'Mid-Late (17-24)';
            else if (week >= 25 && week <= 38) period = 'Late (25-38)';
            else return;
            
            const handicapLine = ah.homeHandicap;
            const handicapType = isHomeAdvantage ? 'Home Advantage' : 'Home Underdog';
            
            // Skip if doesn't match our target
            if (period !== target.period || handicapLine !== target.handicap || handicapType !== target.type) return;
            
            const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
            const higherOddsSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
            
            const stake = calculateSimpleStake(higherOdds);
            const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, higherOddsSide);
            
            if (!betResult) return;
            
            // Calculate profit
            let profit = 0;
            if (betResult === 'win') {
                profit = stake * (higherOdds - 1);
                wins++;
            } else if (betResult === 'half-win') {
                profit = stake * (higherOdds - 1) / 2;
                halfWins++;
            } else if (betResult === 'push') {
                profit = 0;
                pushes++;
            } else if (betResult === 'half-lose') {
                profit = -stake / 2;
                halfLosses++;
            } else {
                profit = -stake;
                losses++;
            }
            
            bets++;
            totalStaked += stake;
            totalProfit += profit;
            totalOdds += higherOdds;
            
            // Show first few individual bets for verification
            if (bets <= 3) {
                console.log(`  Bet ${bets}: ${matchInfo.homeTeam} vs ${matchInfo.awayTeam} (${matchInfo.homeScore}-${matchInfo.awayScore})`);
                console.log(`    Handicap: ${handicapLine}, Bet: ${higherOddsSide} @${higherOdds}, Stake: $${stake}`);
                console.log(`    Result: ${betResult}, Profit: $${profit.toFixed(0)}`);
            }
        });
        
        // Calculate final metrics with verification
        const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        const winRate = bets > 0 ? (((wins + halfWins * 0.5) / bets) * 100) : 0;
        const avgOdds = bets > 0 ? (totalOdds / bets) : 0;
        
        console.log(`\n📊 CALCULATED RESULTS:`);
        console.log(`  Total Bets: ${bets}`);
        console.log(`  Total Staked: $${totalStaked.toFixed(0)}`);
        console.log(`  Total Profit: $${totalProfit.toFixed(0)}`);
        console.log(`  ROI: ${roi.toFixed(2)}%`);
        console.log(`  Win Rate: ${winRate.toFixed(1)}%`);
        console.log(`  Avg Odds: ${avgOdds.toFixed(2)}`);
        console.log(`  Breakdown: W:${wins} HW:${halfWins} P:${pushes} HL:${halfLosses} L:${losses}`);
        
        // Verification calculations
        console.log(`\n🔍 VERIFICATION:`);
        console.log(`  Expected total results: ${wins + halfWins + pushes + halfLosses + losses} = ${bets}? ${wins + halfWins + pushes + halfLosses + losses === bets ? '✅' : '❌'}`);
        console.log(`  ROI check: ${totalProfit.toFixed(0)} / ${totalStaked.toFixed(0)} * 100 = ${roi.toFixed(2)}%`);
        console.log(`  Win rate check: (${wins} + ${halfWins}*0.5) / ${bets} * 100 = ${winRate.toFixed(1)}%`);
    });
}

debugCalculations();

console.log('\n✅ Debug calculation complete!'); 