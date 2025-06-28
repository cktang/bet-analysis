const fs = require('fs');

console.log('🎯 LEAGUE-WIDE ASIAN HANDICAP GRADIENT ANALYSIS');
console.log('='.repeat(60));
console.log('💡 Testing if inverse gradient pattern exists across ALL matches');
console.log('   - Lower odds teams: Do they underperform expectations?');
console.log('   - Higher odds teams: Do they overperform expectations?');
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

// Helper function to calculate implied probability from odds
function getImpliedProbability(odds) {
    return 1 / odds;
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

// Collect ALL Asian Handicap data
function collectAllAHData() {
    const ahData = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        
        if (!homeOdds || !awayOdds) return;
        
        // Add home team data point
        const homeResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, 'home');
        let homeWins = 0;
        if (homeResult === 'win') homeWins = 1;
        else if (homeResult === 'half-win') homeWins = 0.5;
        else if (homeResult === 'push') homeWins = 0.5;
        
        ahData.push({
            team: 'Home',
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            odds: homeOdds,
            impliedProb: getImpliedProbability(homeOdds),
            actualWins: homeWins,
            handicap: ah.homeHandicap,
            result: homeResult,
            week: match.preMatch?.fbref?.week || 'Unknown',
            season: match.season || 'Unknown'
        });
        
        // Add away team data point
        const awayResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, 'away');
        let awayWins = 0;
        if (awayResult === 'win') awayWins = 1;
        else if (awayResult === 'half-win') awayWins = 0.5;
        else if (awayResult === 'push') awayWins = 0.5;
        
        ahData.push({
            team: 'Away',
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            odds: awayOdds,
            impliedProb: getImpliedProbability(awayOdds),
            actualWins: awayWins,
            handicap: ah.homeHandicap,
            result: awayResult,
            week: match.preMatch?.fbref?.week || 'Unknown',
            season: match.season || 'Unknown'
        });
    });
    
    return ahData;
}

// Analyze gradient pattern across odds ranges
function analyzeGradientPattern(ahData) {
    const oddsRanges = [
        { min: 1.00, max: 1.20, label: '1.00-1.20', color: '🔴' },
        { min: 1.20, max: 1.40, label: '1.20-1.40', color: '🟠' },
        { min: 1.40, max: 1.60, label: '1.40-1.60', color: '🟡' },
        { min: 1.60, max: 1.80, label: '1.60-1.80', color: '🟢' },
        { min: 1.80, max: 2.00, label: '1.80-2.00', color: '🔵' },
        { min: 2.00, max: 2.50, label: '2.00-2.50', color: '🟣' },
        { min: 2.50, max: 3.00, label: '2.50-3.00', color: '🟤' },
        { min: 3.00, max: 5.00, label: '3.00-5.00', color: '⚫' }
    ];
    
    console.log('📊 LEAGUE-WIDE GRADIENT ANALYSIS:');
    console.log('-'.repeat(90));
    console.log('Odds Range   | Cases | Expected Win% | Actual Win% | Difference | ROI    | Gradient');
    console.log('-'.repeat(90));
    
    const gradientData = [];
    let totalGradientEffect = 0;
    
    oddsRanges.forEach(range => {
        const rangeCases = ahData.filter(d => d.odds >= range.min && d.odds < range.max);
        if (rangeCases.length === 0) return;
        
        const totalWins = rangeCases.reduce((sum, case_) => sum + case_.actualWins, 0);
        const actualWinRate = totalWins / rangeCases.length;
        const avgImpliedProb = rangeCases.reduce((sum, case_) => sum + case_.impliedProb, 0) / rangeCases.length;
        const expectedWinRate = avgImpliedProb;
        
        const difference = actualWinRate - expectedWinRate;
        const differencePercent = difference * 100;
        
        // Calculate ROI if betting this range
        let profit = 0;
        rangeCases.forEach(case_ => {
            if (case_.actualWins === 1) {
                profit += 100 * (case_.odds - 1); // Full win
            } else if (case_.actualWins === 0.5) {
                profit += 50 * (case_.odds - 1); // Half win or push
            } else {
                profit -= 100; // Loss
            }
        });
        
        const roi = (profit / (rangeCases.length * 100)) * 100;
        
        const gradientIndicator = differencePercent > 2 ? '📈 OVER' : 
                                 differencePercent < -2 ? '📉 UNDER' : '➡️ FAIR';
        
        console.log(`${range.color} ${range.label.padEnd(11)} | ${rangeCases.length.toString().padStart(5)} | ${(expectedWinRate * 100).toFixed(1).padStart(11)}% | ${(actualWinRate * 100).toFixed(1).padStart(9)}% | ${differencePercent.toFixed(1).padStart(8)}% | ${roi.toFixed(1).padStart(5)}% | ${gradientIndicator}`);
        
        gradientData.push({
            range: range.label,
            odds: (range.min + range.max) / 2,
            cases: rangeCases.length,
            expectedWinRate,
            actualWinRate,
            difference: differencePercent,
            roi
        });
        
        totalGradientEffect += Math.abs(differencePercent) * rangeCases.length;
    });
    
    console.log('-'.repeat(90));
    
    return gradientData;
}

// Calculate gradient slope
function calculateGradientSlope(gradientData) {
    if (gradientData.length < 2) return 0;
    
    // Calculate correlation between odds and performance difference
    const n = gradientData.length;
    const sumX = gradientData.reduce((sum, d) => sum + d.odds, 0);
    const sumY = gradientData.reduce((sum, d) => sum + d.difference, 0);
    const sumXY = gradientData.reduce((sum, d) => sum + (d.odds * d.difference), 0);
    const sumX2 = gradientData.reduce((sum, d) => sum + (d.odds * d.odds), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
}

// Seasonal analysis
function analyzeSeasonalGradient(ahData) {
    console.log('\n🗓️ SEASONAL GRADIENT ANALYSIS:');
    console.log('-'.repeat(60));
    
    const seasons = ['2022-2023', '2023-2024', '2024-2025'];
    
    seasons.forEach(season => {
        const seasonData = ahData.filter(d => d.season === season || d.season === 'Unknown');
        if (seasonData.length === 0) return;
        
        // Focus on key odds ranges for gradient effect
        const favoriteRange = seasonData.filter(d => d.odds >= 1.20 && d.odds < 1.60);
        const underdogRange = seasonData.filter(d => d.odds >= 2.00 && d.odds < 3.00);
        
        if (favoriteRange.length > 0 && underdogRange.length > 0) {
            const favWinRate = favoriteRange.reduce((sum, d) => sum + d.actualWins, 0) / favoriteRange.length;
            const favExpected = favoriteRange.reduce((sum, d) => sum + d.impliedProb, 0) / favoriteRange.length;
            const favGap = (favWinRate - favExpected) * 100;
            
            const underdogWinRate = underdogRange.reduce((sum, d) => sum + d.actualWins, 0) / underdogRange.length;
            const underdogExpected = underdogRange.reduce((sum, d) => sum + d.impliedProb, 0) / underdogRange.length;
            const underdogGap = (underdogWinRate - underdogExpected) * 100;
            
            console.log(`${season}:`);
            console.log(`  Favorites (1.20-1.60): ${favGap.toFixed(1)}% gap (${favoriteRange.length} cases)`);
            console.log(`  Underdogs (2.00-3.00): ${underdogGap.toFixed(1)}% gap (${underdogRange.length} cases)`);
            console.log(`  Gradient Strength: ${Math.abs(underdogGap - favGap).toFixed(1)}%`);
        }
    });
}

// Run the comprehensive analysis
console.log('🎯 COMPREHENSIVE LEAGUE-WIDE ANALYSIS');
console.log('='.repeat(60));

const ahData = collectAllAHData();
console.log(`📈 Collected ${ahData.length} Asian Handicap data points\n`);

if (ahData.length === 0) {
    console.log('❌ No Asian Handicap data found');
    return;
}

const gradientData = analyzeGradientPattern(ahData);
const gradientSlope = calculateGradientSlope(gradientData);

console.log('\n🔍 GRADIENT ANALYSIS RESULTS:');
console.log('='.repeat(60));

console.log(`📈 Gradient Slope: ${gradientSlope.toFixed(3)}`);
console.log(`   ${gradientSlope > 0 ? '📈 POSITIVE: Higher odds overperform' : '📉 NEGATIVE: Lower odds overperform'}`);
console.log(`   Magnitude: ${Math.abs(gradientSlope) > 2 ? '🔥 STRONG' : Math.abs(gradientSlope) > 1 ? '⚡ MODERATE' : '😐 WEAK'}`);

// Identify best opportunities
const bestOverperformers = gradientData.filter(d => d.difference > 2 && d.cases > 50);
const bestUnderperformers = gradientData.filter(d => d.difference < -2 && d.cases > 50);

if (bestOverperformers.length > 0) {
    console.log('\n🎯 BEST OVERPERFORMING RANGES (Betting Opportunities):');
    bestOverperformers.forEach(d => {
        console.log(`   ${d.range}: +${d.difference.toFixed(1)}% gap, ${d.roi.toFixed(1)}% ROI (${d.cases} cases)`);
    });
}

if (bestUnderperformers.length > 0) {
    console.log('\n📉 BEST UNDERPERFORMING RANGES (Fade Opportunities):');
    bestUnderperformers.forEach(d => {
        console.log(`   ${d.range}: ${d.difference.toFixed(1)}% gap, ${d.roi.toFixed(1)}% ROI (${d.cases} cases)`);
    });
}

analyzeSeasonalGradient(ahData);

console.log('\n🎯 LEAGUE-WIDE CONCLUSION:');
console.log('='.repeat(60));

if (Math.abs(gradientSlope) > 1) {
    console.log('🔥 GRADIENT EFFECT CONFIRMED LEAGUE-WIDE!');
    console.log('   The inverse gradient pattern exists across the entire league');
    console.log('   This is not just a "trapped" phenomenon - it\'s systematic');
    console.log('   Asian Handicap market has league-wide inefficiencies');
} else {
    console.log('😐 Gradient effect is weak league-wide');
    console.log('   The trapped mechanism may be isolated to extreme cases');
}

console.log('\n✅ League-wide gradient analysis complete!'); 