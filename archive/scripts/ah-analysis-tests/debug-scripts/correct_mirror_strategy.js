const fs = require('fs');

console.log('🔧 TESTING CORRECT MIRROR STRATEGY');
console.log('='.repeat(80));
console.log('🎯 Home Underdog + HIGHER ODDS (true mirror of home advantage strategy)');
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

// CORRECTED Asian Handicap calculation (same as before)
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

// RECALCULATE ALL STRATEGIES WITH CORRECT LOGIC
function testAllStrategies() {
    console.log('📊 TESTING ALL QUARTER HANDICAP STRATEGIES:');
    console.log('='.repeat(60));
    
    // Strategy 1: Home Advantage + Higher Odds
    let homeAdv_totalProfit = 0, homeAdv_totalStaked = 0, homeAdv_totalBets = 0;
    let homeAdv_wins = 0, homeAdv_halfWins = 0, homeAdv_losses = 0, homeAdv_halfLosses = 0;
    
    // Strategy 2: Home Advantage + Lower Odds  
    let homeAdvLow_totalProfit = 0, homeAdvLow_totalStaked = 0, homeAdvLow_totalBets = 0;
    let homeAdvLow_wins = 0, homeAdvLow_halfWins = 0, homeAdvLow_losses = 0, homeAdvLow_halfLosses = 0;
    
    // Strategy 3: Home Underdog + Higher Odds
    let homeUndHigh_totalProfit = 0, homeUndHigh_totalStaked = 0, homeUndHigh_totalBets = 0;
    let homeUndHigh_wins = 0, homeUndHigh_halfWins = 0, homeUndHigh_losses = 0, homeUndHigh_halfLosses = 0;
    
    // Strategy 4: Home Underdog + Lower Odds
    let homeUndLow_totalProfit = 0, homeUndLow_totalStaked = 0, homeUndLow_totalBets = 0;
    let homeUndLow_wins = 0, homeUndLow_halfWins = 0, homeUndLow_losses = 0, homeUndLow_halfLosses = 0;
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        const isHomeAdvantage = homeHasAdvantage(ah.homeHandicap);
        const isHomeUnderdog = homeIsUnderdog(ah.homeHandicap);
        
        if (!isHomeAdvantage && !isHomeUnderdog) return; // Skip neutral
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const lowerOdds = Math.min(ah.homeOdds, ah.awayOdds);
        const higherOddsSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        const lowerOddsSide = ah.homeOdds < ah.awayOdds ? 'home' : 'away';
        
        const higherStake = calculateSimpleStake(higherOdds);
        const lowerStake = calculateSimpleStake(lowerOdds);
        
        const higherResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, higherOddsSide);
        const lowerResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, lowerOddsSide);
        
        if (!higherResult || !lowerResult) return;
        
        // Calculate profits for both betting approaches
        const calculateProfit = (result, stake, odds) => {
            if (result === 'win') return stake * (odds - 1);
            if (result === 'half-win') return stake * (odds - 1) / 2;
            if (result === 'push') return 0;
            if (result === 'half-lose') return -stake / 2;
            return -stake;
        };
        
        const higherProfit = calculateProfit(higherResult, higherStake, higherOdds);
        const lowerProfit = calculateProfit(lowerResult, lowerStake, lowerOdds);
        
        // Update statistics based on match type
        if (isHomeAdvantage) {
            // Home Advantage + Higher Odds
            homeAdv_totalProfit += higherProfit;
            homeAdv_totalStaked += higherStake;
            homeAdv_totalBets++;
            if (higherResult === 'win') homeAdv_wins++;
            else if (higherResult === 'half-win') homeAdv_halfWins++;
            else if (higherResult === 'half-lose') homeAdv_halfLosses++;
            else if (higherResult === 'lose') homeAdv_losses++;
            
            // Home Advantage + Lower Odds
            homeAdvLow_totalProfit += lowerProfit;
            homeAdvLow_totalStaked += lowerStake;
            homeAdvLow_totalBets++;
            if (lowerResult === 'win') homeAdvLow_wins++;
            else if (lowerResult === 'half-win') homeAdvLow_halfWins++;
            else if (lowerResult === 'half-lose') homeAdvLow_halfLosses++;
            else if (lowerResult === 'lose') homeAdvLow_losses++;
        } else {
            // Home Underdog + Higher Odds
            homeUndHigh_totalProfit += higherProfit;
            homeUndHigh_totalStaked += higherStake;
            homeUndHigh_totalBets++;
            if (higherResult === 'win') homeUndHigh_wins++;
            else if (higherResult === 'half-win') homeUndHigh_halfWins++;
            else if (higherResult === 'half-lose') homeUndHigh_halfLosses++;
            else if (higherResult === 'lose') homeUndHigh_losses++;
            
            // Home Underdog + Lower Odds
            homeUndLow_totalProfit += lowerProfit;
            homeUndLow_totalStaked += lowerStake;
            homeUndLow_totalBets++;
            if (lowerResult === 'win') homeUndLow_wins++;
            else if (lowerResult === 'half-win') homeUndLow_halfWins++;
            else if (lowerResult === 'half-lose') homeUndLow_halfLosses++;
            else if (lowerResult === 'lose') homeUndLow_losses++;
        }
    });
    
    // Calculate final results
    const calculateMetrics = (profit, staked, wins, halfWins, totalBets) => {
        const roi = staked > 0 ? ((profit / staked) * 100).toFixed(2) : '0.00';
        const winRate = totalBets > 0 ? (((wins + halfWins * 0.5) / totalBets) * 100).toFixed(1) : '0.0';
        return { roi, winRate, profit: profit.toFixed(0), staked: staked.toFixed(0) };
    };
    
    const homeAdv = calculateMetrics(homeAdv_totalProfit, homeAdv_totalStaked, homeAdv_wins, homeAdv_halfWins, homeAdv_totalBets);
    const homeAdvLow = calculateMetrics(homeAdvLow_totalProfit, homeAdvLow_totalStaked, homeAdvLow_wins, homeAdvLow_halfWins, homeAdvLow_totalBets);
    const homeUndHigh = calculateMetrics(homeUndHigh_totalProfit, homeUndHigh_totalStaked, homeUndHigh_wins, homeUndHigh_halfWins, homeUndHigh_totalBets);
    const homeUndLow = calculateMetrics(homeUndLow_totalProfit, homeUndLow_totalStaked, homeUndLow_wins, homeUndLow_halfWins, homeUndLow_totalBets);
    
    console.log('🏠 HOME ADVANTAGE QUARTER HANDICAPS:');
    console.log(`  📈 Higher Odds: ${homeAdv.roi}% ROI, ${homeAdv.winRate}% win rate (${homeAdv_totalBets} bets, $${homeAdv.staked} staked, $${homeAdv.profit} profit)`);
    console.log(`  📉 Lower Odds:  ${homeAdvLow.roi}% ROI, ${homeAdvLow.winRate}% win rate (${homeAdvLow_totalBets} bets, $${homeAdvLow.staked} staked, $${homeAdvLow.profit} profit)`);
    
    console.log('\n🏃 HOME UNDERDOG QUARTER HANDICAPS:');
    console.log(`  📈 Higher Odds: ${homeUndHigh.roi}% ROI, ${homeUndHigh.winRate}% win rate (${homeUndHigh_totalBets} bets, $${homeUndHigh.staked} staked, $${homeUndHigh.profit} profit)`);
    console.log(`  📉 Lower Odds:  ${homeUndLow.roi}% ROI, ${homeUndLow.winRate}% win rate (${homeUndLow_totalBets} bets, $${homeUndLow.staked} staked, $${homeUndLow.profit} profit)`);
    
    return { homeAdv, homeAdvLow, homeUndHigh, homeUndLow };
}

// Run the complete analysis
const results = testAllStrategies();

console.log('\n🎯 COMPLETE QUARTER HANDICAP ANALYSIS:');
console.log('='.repeat(80));
console.log('🏠 HOME ADVANTAGE:');
console.log(`  ✅ Higher Odds: ${results.homeAdv.roi}% ROI (our current strategy)`);
console.log(`  ❌ Lower Odds:  ${results.homeAdvLow.roi}% ROI`);

console.log('\n🏃 HOME UNDERDOG:');  
console.log(`  📊 Higher Odds: ${results.homeUndHigh.roi}% ROI (TRUE MIRROR TEST)`);
console.log(`  📊 Lower Odds:  ${results.homeUndLow.roi}% ROI (previous wrong test)`);

console.log('\n💡 INSIGHTS:');
const homeAdvEdge = parseFloat(results.homeAdv.roi);
const mirrorEdge = parseFloat(results.homeUndHigh.roi);

if (homeAdvEdge > 0 && mirrorEdge > 0) {
    console.log('✅ BOTH strategies work! Trapped mechanism exists on BOTH sides!');
} else if (homeAdvEdge > 0 && mirrorEdge <= 0) {
    console.log('✅ ASYMMETRIC edge confirmed - only works when home has advantage');
} else {
    console.log('🤔 Unexpected results - need further investigation');
}

console.log('\n✅ Complete analysis finished!'); 