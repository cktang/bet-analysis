const fs = require('fs');

console.log('🎯 COMPREHENSIVE ALL HANDICAPS vs 1X2 COMPARISON');
console.log('='.repeat(60));
console.log('💡 ALL extreme odds Asian Handicaps:');
console.log('   Strategy A: Bet against extreme favorite (AH)');
console.log('   Strategy B: Bet against extreme favorite (1X2)');
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
    // Single handicaps (pure integers or halves)
    const singlePatterns = [
        '0', '-0.5', '+0.5', '-1', '+1', '-1.5', '+1.5', '-2', '+2', '-2.5', '+2.5', '-3', '+3'
    ];
    
    // If it's a single pattern, it's NOT a quarter handicap
    if (singlePatterns.includes(handicap)) {
        return false;
    }
    
    // If it contains a slash, it's a split/quarter handicap
    if (handicap.includes('/')) {
        return true;
    }
    
    return false;
}

// Helper function to calculate Asian Handicap result for ANY handicap
function calculateAHResult(homeScore, awayScore, homeHandicap, betSide) {
    // Handle single handicaps (e.g., "-1", "+0.5") and split handicaps (e.g., "0/-0.5")
    const handicaps = homeHandicap.includes('/') ? 
        homeHandicap.split('/').map(h => parseFloat(h)) : 
        [parseFloat(homeHandicap)];
    
    const results = [];
    
    handicaps.forEach(hcp => {
        if (betSide === 'away') {
            // When betting away, reverse the handicap
            const awayHcp = -hcp;
            const adjustedAwayScore = awayScore + awayHcp;
            
            if (adjustedAwayScore > homeScore) results.push('win');
            else if (adjustedAwayScore < homeScore) results.push('lose');
            else results.push('push');
        } else {
            // When betting home, use handicap as is
            const adjustedHomeScore = homeScore + hcp;
            
            if (adjustedHomeScore > awayScore) results.push('win');
            else if (adjustedHomeScore < awayScore) results.push('lose');
            else results.push('push');
        }
    });
    
    // For single handicaps, return the single result
    if (results.length === 1) {
        return results[0];
    }
    
    // For split handicaps, combine results
    const [result1, result2] = results;
    
    if (result1 === 'win' && result2 === 'win') return 'win';
    if (result1 === 'lose' && result2 === 'lose') return 'lose';
    if (result1 === 'push' && result2 === 'push') return 'push';
    
    // Half results
    if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
    if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
    if ((result1 === 'win' && result2 === 'lose') || (result1 === 'lose' && result2 === 'win')) return 'half-win';
    
    return 'push'; // fallback
}

// Find ALL extreme odds Asian Handicap cases
function findAllExtremeCases() {
    const cases = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        
        // NO FILTERING - include ALL Asian Handicap types
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        const homeWinOdds = matchInfo.homeWinOdds;
        const drawOdds = matchInfo.drawOdds;
        const awayWinOdds = matchInfo.awayWinOdds;
        
        if (!homeWinOdds || !drawOdds || !awayWinOdds) return;
        
        // Either home OR away team must have extreme odds (≤1.72)
        const isExtremeCase = homeOdds <= 1.72 || awayOdds <= 1.72;
        if (!isExtremeCase) return;
        
        // Determine which side to bet (bet against the extreme favorite)
        const betSide = homeOdds <= 1.72 ? 'away' : 'home';
        const quarterOdds = betSide === 'away' ? awayOdds : homeOdds;
        
        cases.push({
            date: matchInfo.date,
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            handicap: ah.homeHandicap,
            betSide: betSide,
            quarterOdds: quarterOdds,
            homeWinOdds: homeWinOdds,
            drawOdds: drawOdds,
            awayWinOdds: awayWinOdds,
            homeScore: matchInfo.homeScore,
            awayScore: matchInfo.awayScore,
            homeWin: matchInfo.homeScore > matchInfo.awayScore,
            draw: matchInfo.homeScore === matchInfo.awayScore,
            awayWin: matchInfo.awayScore > matchInfo.homeScore,
            week: match.preMatch?.fbref?.week || 'Unknown',
            extremeOdds: homeOdds <= 1.72 ? homeOdds : awayOdds,
            isQuarter: isQuarterHandicap(ah.homeHandicap)
        });
    });
    
    return cases;
}

// Compare the two strategies
function compareStrategies(cases) {
    const strategyA = { name: 'Asian Handicap (Against Extreme Favorite)', bets: 0, profit: 0, wins: 0 };
    const strategyB = { name: '1X2 (Against Extreme Favorite)', bets: 0, profit: 0, wins: 0 };
    
    let detailCount = 0;
    console.log('📊 SAMPLE CASE-BY-CASE COMPARISON (first 20 cases):');
    console.log('-'.repeat(120));
    console.log('Match                    | Side| AH Odds| 1X2 Odds| Result | AH Profit | 1X2 Profit | Better   | Handicap      | Type');
    console.log('-'.repeat(120));
    
    cases.forEach(case_ => {
        const betAmount = 100;
        
        // Strategy A: Bet Asian Handicap against extreme favorite
        const ahResult = calculateAHResult(case_.homeScore, case_.awayScore, case_.handicap, case_.betSide);
        let ahProfit = 0;
        
        if (ahResult === 'win') {
            ahProfit = betAmount * (case_.quarterOdds - 1);
            strategyA.wins++;
        } else if (ahResult === 'half-win') {
            ahProfit = (betAmount * (case_.quarterOdds - 1)) / 2;
            strategyA.wins += 0.5;
        } else if (ahResult === 'push') {
            ahProfit = 0;
            strategyA.wins += 0.5;
        } else if (ahResult === 'half-lose') {
            ahProfit = -betAmount / 2;
        } else { // lose
            ahProfit = -betAmount;
        }
        
        strategyA.bets++;
        strategyA.profit += ahProfit;
        
        // Strategy B: Bet 1X2 against extreme favorite
        let oneX2Profit = 0;
        let oneX2Won = false;
        
        if (case_.betSide === 'away') {
            // Betting against home favorite = bet draw + away
            const drawAwayOdds = 1 / ((1/case_.drawOdds) + (1/case_.awayWinOdds));
            if (case_.awayWin || case_.draw) {
                oneX2Profit = betAmount * (drawAwayOdds - 1);
                oneX2Won = true;
                strategyB.wins++;
            } else {
                oneX2Profit = -betAmount;
            }
        } else {
            // Betting against away favorite = bet home + draw
            const homeDrawOdds = 1 / ((1/case_.homeWinOdds) + (1/case_.drawOdds));
            if (case_.homeWin || case_.draw) {
                oneX2Profit = betAmount * (homeDrawOdds - 1);
                oneX2Won = true;
                strategyB.wins++;
            } else {
                oneX2Profit = -betAmount;
            }
        }
        
        strategyB.bets++;
        strategyB.profit += oneX2Profit;
        
        // Show sample cases
        if (detailCount < 20) {
            const betterStrategy = ahProfit > oneX2Profit ? 'AH' : 
                                 oneX2Profit > ahProfit ? '1X2' : 'TIE';
            
            const matchStr = `${case_.homeTeam.slice(0,8)} vs ${case_.awayTeam.slice(0,8)}`;
            const actualResult = `${case_.homeScore}-${case_.awayScore}`;
            const oneX2Odds = case_.betSide === 'away' ? 
                1 / ((1/case_.drawOdds) + (1/case_.awayWinOdds)) :
                1 / ((1/case_.homeWinOdds) + (1/case_.drawOdds));
            
            const handicapType = case_.isQuarter ? 'Q' : 'S'; // Quarter or Single
            
            console.log(`${matchStr.padEnd(24)} | ${case_.betSide.padEnd(3)} | ${case_.quarterOdds.toFixed(2).padStart(6)} | ${oneX2Odds.toFixed(2).padStart(7)} | ${actualResult.padEnd(6)} | ${ahProfit.toFixed(0).padStart(9)} | ${oneX2Profit.toFixed(0).padStart(10)} | ${betterStrategy.padEnd(8)} | ${case_.handicap.padEnd(13)} | ${handicapType}`);
            detailCount++;
        }
    });
    
    return { strategyA, strategyB };
}

// Run the comprehensive analysis
console.log('🎯 COMPREHENSIVE ALL HANDICAPS ANALYSIS');
console.log('='.repeat(60));

const cases = findAllExtremeCases();
console.log(`📈 Found ${cases.length} cases of Asian Handicaps with extreme odds\n`);

if (cases.length === 0) {
    console.log('❌ No cases found');
    return;
}

// Break down by handicap type
const handicapBreakdown = {};
const quarterVsSingle = { quarter: 0, single: 0 };

cases.forEach(case_ => {
    handicapBreakdown[case_.handicap] = (handicapBreakdown[case_.handicap] || 0) + 1;
    if (case_.isQuarter) quarterVsSingle.quarter++;
    else quarterVsSingle.single++;
});

console.log('📊 Handicap Type Summary:');
console.log(`   Quarter Handicaps: ${quarterVsSingle.quarter} cases`);
console.log(`   Single Handicaps: ${quarterVsSingle.single} cases`);
console.log('');

console.log('📊 Top Handicap Distributions:');
Object.entries(handicapBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([handicap, count]) => {
        const type = isQuarterHandicap(handicap) ? '(Q)' : '(S)';
        console.log(`   ${handicap} ${type}: ${count} cases`);
    });
console.log('');

const { strategyA, strategyB } = compareStrategies(cases);

console.log('\n📊 COMPREHENSIVE STRATEGY COMPARISON:');
console.log('='.repeat(60));

console.log(`${strategyA.name}:`);
console.log(`  Bets: ${strategyA.bets}`);
console.log(`  Wins: ${strategyA.wins}`);
console.log(`  Win Rate: ${(strategyA.wins / strategyA.bets * 100).toFixed(1)}%`);
console.log(`  Profit: ${strategyA.profit.toFixed(0)} units`);
console.log(`  ROI: ${(strategyA.profit / (strategyA.bets * 100) * 100).toFixed(1)}%`);

console.log(`\n${strategyB.name}:`);
console.log(`  Bets: ${strategyB.bets}`);
console.log(`  Wins: ${strategyB.wins}`);
console.log(`  Win Rate: ${(strategyB.wins / strategyB.bets * 100).toFixed(1)}%`);
console.log(`  Profit: ${strategyB.profit.toFixed(0)} units`);
console.log(`  ROI: ${(strategyB.profit / (strategyB.bets * 100) * 100).toFixed(1)}%`);

console.log('\n🎯 COMPREHENSIVE ANALYSIS:');
const profitDiff = strategyA.profit - strategyB.profit;
const winner = profitDiff > 0 ? 'Asian Handicap' : '1X2';

console.log(`💰 Profit difference: ${Math.abs(profitDiff).toFixed(0)} units`);
console.log(`🏆 Winner: ${winner}`);
console.log(`📊 Advantage: ${Math.abs(profitDiff / (cases.length * 100) * 100).toFixed(1)}% ROI difference`);

// Compare Quarter vs Single handicaps
const quarterCases = cases.filter(c => c.isQuarter);
const singleCases = cases.filter(c => !c.isQuarter);

console.log('\n🔍 QUARTER vs SINGLE HANDICAP BREAKDOWN:');
console.log('-'.repeat(60));

if (quarterCases.length > 0) {
    let qAhProfit = 0, qOneX2Profit = 0;
    quarterCases.forEach(case_ => {
        const betAmount = 100;
        const ahResult = calculateAHResult(case_.homeScore, case_.awayScore, case_.handicap, case_.betSide);
        
        if (ahResult === 'win') qAhProfit += betAmount * (case_.quarterOdds - 1);
        else if (ahResult === 'half-win') qAhProfit += (betAmount * (case_.quarterOdds - 1)) / 2;
        else if (ahResult === 'push') qAhProfit += 0;
        else if (ahResult === 'half-lose') qAhProfit += -betAmount / 2;
        else qAhProfit += -betAmount;
        
        if (case_.betSide === 'away') {
            const drawAwayOdds = 1 / ((1/case_.drawOdds) + (1/case_.awayWinOdds));
            if (case_.awayWin || case_.draw) qOneX2Profit += betAmount * (drawAwayOdds - 1);
            else qOneX2Profit += -betAmount;
        } else {
            const homeDrawOdds = 1 / ((1/case_.homeWinOdds) + (1/case_.drawOdds));
            if (case_.homeWin || case_.draw) qOneX2Profit += betAmount * (homeDrawOdds - 1);
            else qOneX2Profit += -betAmount;
        }
    });
    
    const qAhROI = (qAhProfit / (quarterCases.length * 100) * 100);
    const qOneX2ROI = (qOneX2Profit / (quarterCases.length * 100) * 100);
    
    console.log(`Quarter Handicaps (${quarterCases.length} cases):`);
    console.log(`  AH ROI: ${qAhROI.toFixed(1)}%`);
    console.log(`  1X2 ROI: ${qOneX2ROI.toFixed(1)}%`);
    console.log(`  AH Advantage: ${(qAhROI - qOneX2ROI).toFixed(1)}%`);
}

if (singleCases.length > 0) {
    let sAhProfit = 0, sOneX2Profit = 0;
    singleCases.forEach(case_ => {
        const betAmount = 100;
        const ahResult = calculateAHResult(case_.homeScore, case_.awayScore, case_.handicap, case_.betSide);
        
        if (ahResult === 'win') sAhProfit += betAmount * (case_.quarterOdds - 1);
        else if (ahResult === 'push') sAhProfit += 0;
        else sAhProfit += -betAmount;
        
        if (case_.betSide === 'away') {
            const drawAwayOdds = 1 / ((1/case_.drawOdds) + (1/case_.awayWinOdds));
            if (case_.awayWin || case_.draw) sOneX2Profit += betAmount * (drawAwayOdds - 1);
            else sOneX2Profit += -betAmount;
        } else {
            const homeDrawOdds = 1 / ((1/case_.homeWinOdds) + (1/case_.drawOdds));
            if (case_.homeWin || case_.draw) sOneX2Profit += betAmount * (homeDrawOdds - 1);
            else sOneX2Profit += -betAmount;
        }
    });
    
    const sAhROI = (sAhProfit / (singleCases.length * 100) * 100);
    const sOneX2ROI = (sOneX2Profit / (singleCases.length * 100) * 100);
    
    console.log(`\nSingle Handicaps (${singleCases.length} cases):`);
    console.log(`  AH ROI: ${sAhROI.toFixed(1)}%`);
    console.log(`  1X2 ROI: ${sOneX2ROI.toFixed(1)}%`);
    console.log(`  AH Advantage: ${(sAhROI - sOneX2ROI).toFixed(1)}%`);
}

console.log('\n✅ Full comprehensive comparison complete!'); 