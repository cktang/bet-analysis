const fs = require('fs');

console.log('🚨 DEBUGGING IMPOSSIBLE LOSS: 56.7% WIN RATE BUT NEGATIVE ROI');
console.log('='.repeat(80));
console.log('🎯 Early Season -1.5/-2 Home Advantage case');
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

// Debug the impossible case
function debugImpossibleCase() {
    console.log('🔍 FINDING ALL EARLY SEASON -1.5/-2 HOME ADVANTAGE BETS:');
    console.log('='.repeat(70));
    
    let betCount = 0;
    let totalStaked = 0;
    let totalProfit = 0;
    let wins = 0;
    let halfWins = 0;
    let losses = 0;
    let halfLosses = 0;
    let pushes = 0;
    
    allMatches.forEach((match, index) => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        const fbref = match.preMatch?.fbref;
        
        if (!ah?.homeHandicap || !matchInfo || !fbref?.week) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        // Check for our target: Early season (1-8), -1.5/-2 handicap, home advantage
        const week = fbref.week;
        if (week < 1 || week > 8) return;
        
        const handicapLine = ah.homeHandicap;
        if (handicapLine !== '-1.5/-2') return;
        
        if (!homeHasAdvantage(handicapLine)) return;
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const lowerOdds = Math.min(ah.homeOdds, ah.awayOdds);
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
        
        betCount++;
        totalStaked += stake;
        totalProfit += profit;
        
        // Show each individual bet
        console.log(`\nBet ${betCount}: ${matchInfo.homeTeam} vs ${matchInfo.awayTeam} (${matchInfo.homeScore}-${matchInfo.awayScore})`);
        console.log(`  Week: ${week}, Handicap: ${handicapLine}`);
        console.log(`  Odds: Home ${ah.homeOdds}, Away ${ah.awayOdds}`);
        console.log(`  Higher odds: ${higherOdds} (${higherOddsSide}), Lower odds: ${lowerOdds}`);
        console.log(`  Stake: $${stake}, Result: ${betResult}, Profit: $${profit.toFixed(0)}`);
        
        // Detailed handicap calculation
        console.log(`  🔍 Handicap calculation:`);
        console.log(`    Home score + handicap: ${matchInfo.homeScore} + (-1.5) = ${matchInfo.homeScore - 1.5}, ${matchInfo.homeScore} + (-2) = ${matchInfo.homeScore - 2}`);
        console.log(`    Away score: ${matchInfo.awayScore}`);
        
        if (higherOddsSide === 'home') {
            console.log(`    Betting HOME: Need adjusted home > away`);
            console.log(`    Line 1: ${matchInfo.homeScore - 1.5} > ${matchInfo.awayScore}? ${matchInfo.homeScore - 1.5 > matchInfo.awayScore ? 'WIN' : matchInfo.homeScore - 1.5 === matchInfo.awayScore ? 'PUSH' : 'LOSE'}`);
            console.log(`    Line 2: ${matchInfo.homeScore - 2} > ${matchInfo.awayScore}? ${matchInfo.homeScore - 2 > matchInfo.awayScore ? 'WIN' : matchInfo.homeScore - 2 === matchInfo.awayScore ? 'PUSH' : 'LOSE'}`);
        } else {
            console.log(`    Betting AWAY: Need adjusted home < away`);
            console.log(`    Line 1: ${matchInfo.homeScore - 1.5} < ${matchInfo.awayScore}? ${matchInfo.homeScore - 1.5 < matchInfo.awayScore ? 'WIN' : matchInfo.homeScore - 1.5 === matchInfo.awayScore ? 'PUSH' : 'LOSE'}`);
            console.log(`    Line 2: ${matchInfo.homeScore - 2} < ${matchInfo.awayScore}? ${matchInfo.homeScore - 2 < matchInfo.awayScore ? 'WIN' : matchInfo.homeScore - 2 === matchInfo.awayScore ? 'PUSH' : 'LOSE'}`);
        }
    });
    
    // Calculate final metrics
    const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
    const winRate = betCount > 0 ? (((wins + halfWins * 0.5) / betCount) * 100) : 0;
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`=`.repeat(50));
    console.log(`Total Bets: ${betCount}`);
    console.log(`Total Staked: $${totalStaked.toFixed(0)}`);
    console.log(`Total Profit: $${totalProfit.toFixed(0)}`);
    console.log(`ROI: ${roi.toFixed(2)}%`);
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`Breakdown: W:${wins} HW:${halfWins} P:${pushes} HL:${halfLosses} L:${losses}`);
    
    console.log(`\n🔍 MATHEMATICAL CHECK:`);
    console.log(`Expected profit if all wins paid at average 2.0 odds:`);
    console.log(`${wins} full wins * average stake * 1.0 + ${halfWins} half wins * average stake * 0.5 - ${losses} losses * average stake - ${halfLosses} half losses * average stake * 0.5`);
    
    return { betCount, totalStaked, totalProfit, roi, winRate, wins, halfWins, losses, halfLosses, pushes };
}

debugImpossibleCase();

console.log('\n✅ Debug of impossible case complete!'); 