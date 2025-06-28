const fs = require('fs');

console.log('🔍 GRADIENT ANALYSIS RE-EXAMINATION');
console.log('='.repeat(60));
console.log('🚨 INVESTIGATING THE CONTRADICTION:');
console.log('   - Gradient analysis: Higher odds teams outperform (+12.911 slope)');
console.log('   - Betting test: Higher odds teams lose money (-2.37% ROI)');
console.log('   - Something is wrong - let\'s find out what!');
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

// Helper function to calculate Asian Handicap result (EXACT same as betting test)
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

// Collect data with EXACTLY the same methodology as both previous analyses
function collectDataForComparison() {
    const gradientData = []; // For gradient analysis (all teams)
    const bettingData = [];  // For betting test (higher odds only)
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        
        if (!homeOdds || !awayOdds) return;
        
        // HOME TEAM DATA (for gradient analysis)
        const homeResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, 'home');
        let homeWins = 0;
        if (homeResult === 'win') homeWins = 1;
        else if (homeResult === 'half-win') homeWins = 0.5;
        else if (homeResult === 'push') homeWins = 0.5;
        
        gradientData.push({
            team: 'Home',
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            odds: homeOdds,
            impliedProb: 1 / homeOdds,
            actualWins: homeWins,
            result: homeResult,
            handicap: ah.homeHandicap
        });
        
        // AWAY TEAM DATA (for gradient analysis)
        const awayResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, 'away');
        let awayWins = 0;
        if (awayResult === 'win') awayWins = 1;
        else if (awayResult === 'half-win') awayWins = 0.5;
        else if (awayResult === 'push') awayWins = 0.5;
        
        gradientData.push({
            team: 'Away',
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            odds: awayOdds,
            impliedProb: 1 / awayOdds,
            actualWins: awayWins,
            result: awayResult,
            handicap: ah.homeHandicap
        });
        
        // HIGHER ODDS SIDE DATA (for betting test comparison)
        const betSide = homeOdds > awayOdds ? 'home' : 'away';
        const higherOdds = Math.max(homeOdds, awayOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        let betWins = 0;
        if (betResult === 'win') betWins = 1;
        else if (betResult === 'half-win') betWins = 0.5;
        else if (betResult === 'push') betWins = 0.5;
        
        bettingData.push({
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            betSide: betSide,
            odds: higherOdds,
            impliedProb: 1 / higherOdds,
            actualWins: betWins,
            result: betResult,
            handicap: ah.homeHandicap
        });
    });
    
    return { gradientData, bettingData };
}

// Detailed gradient analysis with cross-validation
function detailedGradientAnalysis(gradientData) {
    console.log('🔍 DETAILED GRADIENT ANALYSIS:');
    console.log('='.repeat(60));
    
    const oddsRanges = [
        { min: 1.00, max: 1.40, label: '1.00-1.40' },
        { min: 1.40, max: 1.60, label: '1.40-1.60' },
        { min: 1.60, max: 1.80, label: '1.60-1.80' },
        { min: 1.80, max: 2.00, label: '1.80-2.00' },
        { min: 2.00, max: 2.50, label: '2.00-2.50' },
        { min: 2.50, max: 3.00, label: '2.50-3.00' },
        { min: 3.00, max: 5.00, label: '3.00-5.00' }
    ];
    
    console.log('Odds Range   | Cases | Expected | Actual  | Difference | Betting ROI');
    console.log('-'.repeat(70));
    
    const gradientPoints = [];
    
    oddsRanges.forEach(range => {
        const rangeCases = gradientData.filter(d => d.odds >= range.min && d.odds < range.max);
        if (rangeCases.length === 0) return;
        
        const totalWins = rangeCases.reduce((sum, case_) => sum + case_.actualWins, 0);
        const actualWinRate = totalWins / rangeCases.length;
        const avgImpliedProb = rangeCases.reduce((sum, case_) => sum + case_.impliedProb, 0) / rangeCases.length;
        const expectedWinRate = avgImpliedProb;
        
        const difference = actualWinRate - expectedWinRate;
        const differencePercent = difference * 100;
        
        // Calculate what ROI would be if betting this range
        let profit = 0;
        rangeCases.forEach(case_ => {
            if (case_.actualWins === 1) {
                profit += 100 * (case_.odds - 1);
            } else if (case_.actualWins === 0.5) {
                profit += 50 * (case_.odds - 1);
            } else {
                profit -= 100;
            }
        });
        
        const roi = (profit / (rangeCases.length * 100)) * 100;
        
        console.log(`${range.label.padEnd(12)} | ${rangeCases.length.toString().padStart(5)} | ${(expectedWinRate * 100).toFixed(1).padStart(8)} | ${(actualWinRate * 100).toFixed(1).padStart(7)} | ${differencePercent.toFixed(1).padStart(8)}% | ${roi.toFixed(1).padStart(8)}%`);
        
        gradientPoints.push({
            range: range.label,
            midpoint: (range.min + range.max) / 2,
            cases: rangeCases.length,
            expectedWinRate,
            actualWinRate,
            difference: differencePercent,
            roi: roi
        });
    });
    
    return gradientPoints;
}

// Cross-validate with betting test data
function crossValidateBettingData(bettingData) {
    console.log('\n🎯 BETTING TEST CROSS-VALIDATION:');
    console.log('='.repeat(60));
    console.log('Analyzing ONLY higher odds sides (exactly like betting test)');
    
    const totalWins = bettingData.reduce((sum, bet) => sum + bet.actualWins, 0);
    const actualWinRate = totalWins / bettingData.length;
    const avgImpliedProb = bettingData.reduce((sum, bet) => sum + bet.impliedProb, 0) / bettingData.length;
    const expectedWinRate = avgImpliedProb;
    
    console.log(`\n📊 Higher Odds Side Performance:`);
    console.log(`   Total Bets: ${bettingData.length}`);
    console.log(`   Expected Win Rate: ${(expectedWinRate * 100).toFixed(1)}%`);
    console.log(`   Actual Win Rate: ${(actualWinRate * 100).toFixed(1)}%`);
    console.log(`   Difference: ${((actualWinRate - expectedWinRate) * 100).toFixed(1)}%`);
    
    // Calculate actual ROI
    let totalProfit = 0;
    bettingData.forEach(bet => {
        if (bet.actualWins === 1) {
            totalProfit += 100 * (bet.odds - 1);
        } else if (bet.actualWins === 0.5) {
            totalProfit += 50 * (bet.odds - 1);
        } else {
            totalProfit -= 100;
        }
    });
    
    const roi = (totalProfit / (bettingData.length * 100)) * 100;
    console.log(`   Calculated ROI: ${roi.toFixed(2)}%`);
    
    // Break down by odds ranges for higher odds only
    console.log('\n📈 Higher Odds Performance by Range:');
    console.log('Range      | Cases | Win Rate | Expected | Difference | ROI');
    console.log('-'.repeat(60));
    
    const ranges = [
        { min: 1.80, max: 2.00, label: '1.80-2.00' },
        { min: 2.00, max: 2.20, label: '2.00-2.20' },
        { min: 2.20, max: 2.50, label: '2.20-2.50' },
        { min: 2.50, max: 3.00, label: '2.50-3.00' },
        { min: 3.00, max: 5.00, label: '3.00+' }
    ];
    
    ranges.forEach(range => {
        const rangeBets = bettingData.filter(bet => bet.odds >= range.min && bet.odds < range.max);
        if (rangeBets.length === 0) return;
        
        const rangeWins = rangeBets.reduce((sum, bet) => sum + bet.actualWins, 0);
        const rangeWinRate = rangeWins / rangeBets.length;
        const rangeExpected = rangeBets.reduce((sum, bet) => sum + bet.impliedProb, 0) / rangeBets.length;
        const rangeDiff = (rangeWinRate - rangeExpected) * 100;
        
        let rangeProfit = 0;
        rangeBets.forEach(bet => {
            if (bet.actualWins === 1) rangeProfit += 100 * (bet.odds - 1);
            else if (bet.actualWins === 0.5) rangeProfit += 50 * (bet.odds - 1);
            else rangeProfit -= 100;
        });
        
        const rangeROI = (rangeProfit / (rangeBets.length * 100)) * 100;
        
        console.log(`${range.label.padEnd(10)} | ${rangeBets.length.toString().padStart(5)} | ${(rangeWinRate * 100).toFixed(1).padStart(8)} | ${(rangeExpected * 100).toFixed(1).padStart(8)} | ${rangeDiff.toFixed(1).padStart(8)}% | ${rangeROI.toFixed(1).padStart(6)}%`);
    });
}

// Check for house edge impact
function analyzeHouseEdge(data) {
    console.log('\n💰 HOUSE EDGE ANALYSIS:');
    console.log('='.repeat(60));
    
    // Calculate average total implied probability across all matches
    let totalImpliedProb = 0;
    let matchCount = 0;
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        if (!ah?.homeOdds || !ah?.awayOdds) return;
        
        const homeImplied = 1 / ah.homeOdds;
        const awayImplied = 1 / ah.awayOdds;
        const totalImplied = homeImplied + awayImplied;
        
        totalImpliedProb += totalImplied;
        matchCount++;
    });
    
    const avgTotalImplied = totalImpliedProb / matchCount;
    const houseEdge = (avgTotalImplied - 1) * 100;
    
    console.log(`📊 Average Total Implied Probability: ${(avgTotalImplied * 100).toFixed(2)}%`);
    console.log(`🏦 House Edge: ${houseEdge.toFixed(2)}%`);
    console.log(`💡 This means even a team that performs exactly as expected`);
    console.log(`   would lose ${houseEdge.toFixed(1)}% due to the house edge alone!`);
    
    return houseEdge;
}

// Run comprehensive re-examination
console.log('🎯 COMPREHENSIVE RE-EXAMINATION');
console.log('='.repeat(60));

const { gradientData, bettingData } = collectDataForComparison();
console.log(`📊 Gradient Analysis Data: ${gradientData.length} data points`);
console.log(`🎯 Betting Test Data: ${bettingData.length} higher odds bets\n`);

const gradientPoints = detailedGradientAnalysis(gradientData);
crossValidateBettingData(bettingData);
const houseEdge = analyzeHouseEdge();

// Calculate true gradient slope
function calculateTrueGradientSlope(gradientPoints) {
    if (gradientPoints.length < 2) return 0;
    
    const validPoints = gradientPoints.filter(p => p.cases > 20); // Only ranges with sufficient data
    if (validPoints.length < 2) return 0;
    
    const n = validPoints.length;
    const sumX = validPoints.reduce((sum, p) => sum + p.midpoint, 0);
    const sumY = validPoints.reduce((sum, p) => sum + p.difference, 0);
    const sumXY = validPoints.reduce((sum, p) => sum + (p.midpoint * p.difference), 0);
    const sumX2 = validPoints.reduce((sum, p) => sum + (p.midpoint * p.midpoint), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
}

const trueSlope = calculateTrueGradientSlope(gradientPoints);

console.log('\n🔍 RE-EXAMINATION CONCLUSIONS:');
console.log('='.repeat(60));

console.log(`📈 True Gradient Slope: ${trueSlope.toFixed(3)}`);
console.log(`🏦 House Edge Impact: ${houseEdge.toFixed(2)}%`);

if (Math.abs(trueSlope) < 1) {
    console.log('\n❌ GRADIENT EFFECT IS WEAK OR NON-EXISTENT');
    console.log('   The original gradient analysis may have been flawed');
    console.log('   Higher odds teams do NOT systematically outperform');
} else if (trueSlope > 0) {
    console.log('\n✅ GRADIENT EFFECT EXISTS BUT...');
    console.log(`   House edge (${houseEdge.toFixed(1)}%) overwhelms the advantage`);
    console.log('   Statistical outperformance ≠ Profitable betting opportunity');
} else {
    console.log('\n📉 NEGATIVE GRADIENT CONFIRMED');
    console.log('   Lower odds teams actually outperform (opposite of theory)');
}

console.log('\n🎯 FINAL VERDICT:');
if (houseEdge > Math.abs(trueSlope * 2)) {
    console.log('🏦 HOUSE EDGE DOMINATES: Any market inefficiency is too small');
    console.log('   to overcome the bookmaker\'s built-in advantage');
} else {
    console.log('🔍 METHODOLOGY ERROR: Need to investigate calculation flaws');
}

console.log('\n✅ Re-examination complete!'); 