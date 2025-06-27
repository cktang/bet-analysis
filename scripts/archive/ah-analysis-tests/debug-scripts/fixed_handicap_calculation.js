const fs = require('fs');

console.log('🔧 FIXING HANDICAP CALCULATION LOGIC AND RECALCULATING');
console.log('='.repeat(80));
console.log('💡 Using CORRECT Asian Handicap calculation rules');
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

// CORRECTED Asian Handicap calculation
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

// Test the corrected calculation with examples
console.log('🧪 TESTING CORRECTED CALCULATION WITH EXAMPLES:');
console.log('='.repeat(60));

// Test Leicester vs Brentford: 2-2, -0.5/-1, bet Home
const testResult1 = calculateAHResult(2, 2, '-0.5/-1', 'home');
console.log('Leicester vs Brentford: 2-2, -0.5/-1, bet Home →', testResult1);
console.log('  Leicester 2 + (-0.5) = 1.5 vs Brentford 2 → Leicester LOSES line 1');
console.log('  Leicester 2 + (-1) = 1 vs Brentford 2 → Leicester LOSES line 2');
console.log('  Expected: lose, Calculated:', testResult1);

// Test Tottenham vs Southampton: 4-1, -1/-1.5, bet Away  
const testResult2 = calculateAHResult(4, 1, '-1/-1.5', 'away');
console.log('\nTottenham vs Southampton: 4-1, -1/-1.5, bet Away →', testResult2);
console.log('  Tottenham 4 + (-1) = 3 vs Southampton 1 → Away LOSES line 1');
console.log('  Tottenham 4 + (-1.5) = 2.5 vs Southampton 1 → Away LOSES line 2');
console.log('  Expected: lose, Calculated:', testResult2);

console.log('\n' + '='.repeat(80));

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

// RECALCULATE HOME ADVANTAGE STRATEGY (betting higher odds when home favored)
function recalculateHomeAdvantageStrategy() {
    console.log('🏠 RECALCULATING HOME ADVANTAGE STRATEGY (corrected)');
    console.log('='.repeat(60));
    
    let totalProfit = 0;
    let totalStaked = 0;
    let totalBets = 0;
    let wins = 0, halfWins = 0, losses = 0, halfLosses = 0, pushes = 0;
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!homeHasAdvantage(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const betSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        
        const stake = calculateSimpleStake(higherOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        if (!betResult) return;
        
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
        
        totalProfit += profit;
        totalStaked += stake;
        totalBets++;
    });
    
    const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(2) : '0.00';
    const winRate = totalBets > 0 ? (((wins + halfWins * 0.5) / totalBets) * 100).toFixed(1) : '0.0';
    
    console.log(`📊 Results: ${totalBets} bets, $${totalStaked} staked, $${totalProfit.toFixed(0)} profit`);
    console.log(`🚀 ROI: ${roi}%, Win Rate: ${winRate}%`);
    console.log(`✅ W:${wins} HW:${halfWins} P:${pushes} HL:${halfLosses} L:${losses}`);
    
    return { totalBets, totalStaked, totalProfit, roi, winRate };
}

// RECALCULATE HOME UNDERDOG STRATEGY (betting lower odds when home underdog)
function recalculateHomeUnderdogStrategy() {
    console.log('\n🏃 RECALCULATING HOME UNDERDOG STRATEGY (corrected)');
    console.log('='.repeat(60));
    
    let totalProfit = 0;
    let totalStaked = 0;
    let totalBets = 0;
    let wins = 0, halfWins = 0, losses = 0, halfLosses = 0, pushes = 0;
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!homeIsUnderdog(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        const lowerOdds = Math.min(ah.homeOdds, ah.awayOdds);
        const betSide = ah.homeOdds < ah.awayOdds ? 'home' : 'away';
        
        const stake = calculateSimpleStake(lowerOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        if (!betResult) return;
        
        let profit = 0;
        
        if (betResult === 'win') {
            profit = stake * (lowerOdds - 1);
            wins++;
        } else if (betResult === 'half-win') {
            profit = stake * (lowerOdds - 1) / 2;
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
        
        totalProfit += profit;
        totalStaked += stake;
        totalBets++;
    });
    
    const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(2) : '0.00';
    const winRate = totalBets > 0 ? (((wins + halfWins * 0.5) / totalBets) * 100).toFixed(1) : '0.0';
    
    console.log(`📊 Results: ${totalBets} bets, $${totalStaked} staked, $${totalProfit.toFixed(0)} profit`);
    console.log(`🚀 ROI: ${roi}%, Win Rate: ${winRate}%`);
    console.log(`✅ W:${wins} HW:${halfWins} P:${pushes} HL:${halfLosses} L:${losses}`);
    
    return { totalBets, totalStaked, totalProfit, roi, winRate };
}

// Run both corrected calculations
const homeAdvantageResults = recalculateHomeAdvantageStrategy();
const homeUnderdogResults = recalculateHomeUnderdogStrategy();

console.log('\n🎯 CORRECTED COMPARISON:');
console.log('='.repeat(80));
console.log(`🏠 Home Advantage (higher odds): ${homeAdvantageResults.roi}% ROI, ${homeAdvantageResults.totalBets} bets`);
console.log(`🏃 Home Underdog (lower odds): ${homeUnderdogResults.roi}% ROI, ${homeUnderdogResults.totalBets} bets`);

console.log('\n✨ Now let\'s see the REAL results with correct calculations!');
console.log('✅ Analysis complete!'); 