const fs = require('fs');

console.log('🗓️ SEASONAL GRADIENT PATTERN ANALYSIS');
console.log('='.repeat(60));
console.log('🔍 How does the inverse odds gradient change throughout the season?');
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

// Define season periods
const seasonPhases = [
    { min: 1, max: 8, label: "Early Season (Weeks 1-8)" },
    { min: 9, max: 20, label: "Mid Season (Weeks 9-20)" },
    { min: 21, max: 38, label: "Late Season (Weeks 21-38)" }
];

// Define key odds ranges (simplified)
const keyOddsRanges = [
    { min: 1.60, max: 1.75, label: "Strong Favorites (1.60-1.75)" },
    { min: 1.75, max: 1.90, label: "Mild Favorites (1.75-1.90)" },
    { min: 1.90, max: 2.10, label: "Near Even (1.90-2.10)" },
    { min: 2.10, max: 2.50, label: "Underdogs (2.10-2.50)" }
];

function analyzeSeasonalGradient(weekMin, weekMax, oddsMin, oddsMax) {
    const quarterCases = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        const week = match.preMatch?.fbref?.week;
        
        if (!ah?.homeHandicap || !matchInfo || !ah.homeOdds || !ah.awayOdds || !week) return;
        if (!ah.homeHandicap.includes('/')) return; // Quarter handicaps only
        if (week < weekMin || week > weekMax) return; // Season filter
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        
        // Check if either side falls in our odds range
        const homeInRange = homeOdds >= oddsMin && homeOdds < oddsMax;
        const awayInRange = awayOdds >= oddsMin && awayOdds < oddsMax;
        
        if (homeInRange || awayInRange) {
            // Calculate AH result
            const handicapValues = ah.homeHandicap.split('/').map(h => parseFloat(h));
            const avgHandicap = handicapValues.reduce((a, b) => a + b) / handicapValues.length;
            const adjustedHomeScore = matchInfo.homeScore + avgHandicap;
            
            let ahWinner = 'draw';
            if (adjustedHomeScore > matchInfo.awayScore) ahWinner = 'home';
            if (adjustedHomeScore < matchInfo.awayScore) ahWinner = 'away';
            
            quarterCases.push({
                homeTeam: matchInfo.homeTeam,
                awayTeam: matchInfo.awayTeam,
                homeScore: matchInfo.homeScore,
                awayScore: matchInfo.awayScore,
                handicap: ah.homeHandicap,
                homeOdds: homeOdds,
                awayOdds: awayOdds,
                ahWinner: ahWinner,
                homeInRange: homeInRange,
                awayInRange: awayInRange,
                week: week
            });
        }
    });
    
    return quarterCases;
}

function calculateSeasonalStats(cases) {
    if (cases.length === 0) return null;
    
    let totalBets = 0, totalWins = 0, totalProfit = 0;
    let totalOddsSum = 0;
    
    cases.forEach(case_ => {
        const betAmount = 100;
        
        // Home bets (when home odds in range)
        if (case_.homeInRange) {
            totalBets++;
            totalOddsSum += case_.homeOdds;
            
            if (case_.ahWinner === 'home') {
                totalWins++;
                totalProfit += betAmount * (case_.homeOdds - 1);
            } else if (case_.ahWinner === 'draw') {
                totalWins += 0.5;
                totalProfit += (betAmount * (case_.homeOdds - 1)) / 2;
            } else {
                totalProfit -= betAmount;
            }
        }
        
        // Away bets (when away odds in range)
        if (case_.awayInRange) {
            totalBets++;
            totalOddsSum += case_.awayOdds;
            
            if (case_.ahWinner === 'away') {
                totalWins++;
                totalProfit += betAmount * (case_.awayOdds - 1);
            } else if (case_.ahWinner === 'draw') {
                totalWins += 0.5;
                totalProfit += (betAmount * (case_.awayOdds - 1)) / 2;
            } else {
                totalProfit -= betAmount;
            }
        }
    });
    
    if (totalBets === 0) return null;
    
    const avgOdds = totalOddsSum / totalBets;
    const winRate = (totalWins / totalBets * 100);
    const expectedWinRate = (1 / avgOdds * 100);
    const performanceGap = winRate - expectedWinRate;
    const roi = (totalProfit / (totalBets * 100) * 100);
    
    return {
        cases: cases.length,
        bets: totalBets,
        wins: totalWins,
        winRate: winRate,
        avgOdds: avgOdds,
        expectedWinRate: expectedWinRate,
        performanceGap: performanceGap,
        roi: roi
    };
}

// Run seasonal gradient analysis
console.log('🗓️ SEASONAL GRADIENT ANALYSIS');
console.log('='.repeat(80));
console.log('📊 Pattern: How inverse gradient changes through season');
console.log('');

console.log('PERFORMANCE GAP BY SEASON & ODDS RANGE (Quarter Handicaps Only):');
console.log('-'.repeat(85));
console.log('Season Phase             | Odds Range          | Gap%  | ROI%  | Avg Odds | Sample');
console.log('-'.repeat(85));

const gradientMatrix = [];

seasonPhases.forEach(season => {
    keyOddsRanges.forEach(oddsRange => {
        const cases = analyzeSeasonalGradient(season.min, season.max, oddsRange.min, oddsRange.max);
        const stats = calculateSeasonalStats(cases);
        
        if (stats && stats.bets >= 10) { // Minimum sample size
            console.log(
                `${season.label.padEnd(24)} | ${oddsRange.label.padEnd(19)} | ${stats.performanceGap.toFixed(1).padStart(5)}% | ${stats.roi.toFixed(1).padStart(5)}% | ${stats.avgOdds.toFixed(2).padStart(8)} | ${stats.bets.toString().padStart(6)}`
            );
            
            gradientMatrix.push({
                season: season.label,
                oddsRange: oddsRange.label,
                midOdds: (oddsRange.min + oddsRange.max) / 2,
                seasonPhase: season.min, // For sorting
                stats: stats
            });
        }
    });
});

console.log('\n🎯 GRADIENT STRENGTH BY SEASON:');
console.log('-'.repeat(50));

seasonPhases.forEach(season => {
    console.log(`\n📅 ${season.label}:`);
    
    const seasonData = gradientMatrix.filter(d => d.seasonPhase === season.min);
    if (seasonData.length === 0) {
        console.log('   ❌ Insufficient data');
        return;
    }
    
    // Calculate gradient slope (correlation between odds and performance gap)
    const oddsValues = seasonData.map(d => d.midOdds);
    const gapValues = seasonData.map(d => d.stats.performanceGap);
    
    if (oddsValues.length < 2) {
        console.log('   ⚠️ Too few data points for gradient');
        return;
    }
    
    // Simple correlation calculation
    const avgOdds = oddsValues.reduce((a, b) => a + b) / oddsValues.length;
    const avgGap = gapValues.reduce((a, b) => a + b) / gapValues.length;
    
    let numerator = 0, denominator = 0;
    for (let i = 0; i < oddsValues.length; i++) {
        numerator += (oddsValues[i] - avgOdds) * (gapValues[i] - avgGap);
        denominator += Math.pow(oddsValues[i] - avgOdds, 2);
    }
    
    const gradient = denominator > 0 ? numerator / denominator : 0;
    
    console.log(`   📈 Gradient Slope: ${gradient.toFixed(3)} (${gradient > 0 ? 'POSITIVE - Inverse pattern confirmed' : 'NEGATIVE/FLAT - Normal pattern'})`);
    console.log(`   📊 Strongest Effect: ${seasonData.reduce((max, d) => Math.abs(d.stats.performanceGap) > Math.abs(max.stats.performanceGap) ? d : max).oddsRange}`);
    
    // Show extremes
    const strongestNegative = seasonData.filter(d => d.stats.performanceGap < -5);
    const strongestPositive = seasonData.filter(d => d.stats.performanceGap > 3);
    
    if (strongestNegative.length > 0) {
        console.log(`   🔴 Most Overvalued: ${strongestNegative[0].oddsRange} (${strongestNegative[0].stats.performanceGap.toFixed(1)}% gap)`);
    }
    if (strongestPositive.length > 0) {
        console.log(`   🟢 Most Undervalued: ${strongestPositive[0].oddsRange} (${strongestPositive[0].stats.performanceGap.toFixed(1)}% gap)`);
    }
});

console.log('\n🔍 KEY SEASONAL INSIGHTS:');
console.log('• Early season should show strongest inverse gradient');
console.log('• Mid/late season gradient may weaken as market learns');
console.log('• Positive gradient = Inverse pattern (lower odds win less)');
console.log('• Look for strongest overvaluation in early season favorites');

console.log('\n✅ Seasonal gradient analysis complete!'); 