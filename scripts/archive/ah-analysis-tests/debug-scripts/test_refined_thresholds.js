const fs = require('fs');

console.log('🎯 REFINED EXTREME ODDS THRESHOLD TESTING');
console.log('='.repeat(55));

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

function testThreshold(threshold) {
    const extremeCases = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        
        const isQuarter = ah.homeHandicap.includes('/');
        const homeOdds = ah.homeOdds || 2.0;
        const awayOdds = ah.awayOdds || 2.0;
        
        // Check for extreme odds at this threshold
        if (isQuarter && (homeOdds <= threshold || awayOdds <= threshold)) {
            const publicFavorite = homeOdds < awayOdds ? 'home' : 'away';
            const favoriteOdds = Math.min(homeOdds, awayOdds);
            const underdogOdds = Math.max(homeOdds, awayOdds);
            
            // Calculate AH result
            const handicapValues = ah.homeHandicap.split('/').map(h => parseFloat(h));
            const avgHandicap = handicapValues.reduce((a, b) => a + b) / handicapValues.length;
            const adjustedHomeScore = matchInfo.homeScore + avgHandicap;
            
            let ahWinner = 'draw';
            if (adjustedHomeScore > matchInfo.awayScore) ahWinner = 'home';
            if (adjustedHomeScore < matchInfo.awayScore) ahWinner = 'away';
            
            const publicWon = (publicFavorite === ahWinner);
            
            extremeCases.push({
                favoriteOdds,
                underdogOdds,
                publicWon
            });
        }
    });
    
    return extremeCases;
}

// Test the three thresholds
const thresholds = [1.70, 1.72, 1.75];

thresholds.forEach(threshold => {
    console.log(`🔍 TESTING THRESHOLD: ≤${threshold}`);
    console.log('-'.repeat(35));
    
    const cases = testThreshold(threshold);
    
    if (cases.length > 0) {
        const publicWins = cases.filter(c => c.publicWon).length;
        const publicWinRate = (publicWins / cases.length * 100);
        
        const avgFavoriteOdds = cases.reduce((sum, c) => sum + c.favoriteOdds, 0) / cases.length;
        const avgUnderdogOdds = cases.reduce((sum, c) => sum + c.underdogOdds, 0) / cases.length;
        
        const impliedWinRate = (1 / avgFavoriteOdds * 100);
        const performanceGap = publicWinRate - impliedWinRate;
        
        // Calculate ROI
        let totalProfit = 0;
        cases.forEach(case_ => {
            const underdogWon = !case_.publicWon;
            const profit = underdogWon ? (case_.underdogOdds - 1) * 100 : -100;
            totalProfit += profit;
        });
        const roi = (totalProfit / (cases.length * 100) * 100);
        
        console.log(`📈 Cases: ${cases.length}`);
        console.log(`🎲 Public wins: ${publicWinRate.toFixed(1)}% (expected: ${impliedWinRate.toFixed(1)}%)`);
        console.log(`📊 Gap: ${performanceGap.toFixed(1)}%`);
        console.log(`💰 Avg odds: ${avgFavoriteOdds.toFixed(2)} vs ${avgUnderdogOdds.toFixed(2)}`);
        console.log(`🏆 ROI: ${roi.toFixed(1)}%`);
        
        // Rating
        let rating = '❌ LOSING';
        if (roi >= 20) rating = '🔥 EXCELLENT';
        else if (roi >= 15) rating = '✅ VERY GOOD';
        else if (roi >= 10) rating = '👍 GOOD';
        else if (roi >= 5) rating = '😐 OKAY';
        else if (roi >= 0) rating = '😕 MARGINAL';
        
        console.log(`⭐ Rating: ${rating}`);
        
        // Sample size assessment
        let sampleRating = '❌ TOO SMALL';
        if (cases.length >= 50) sampleRating = '✅ EXCELLENT';
        else if (cases.length >= 30) sampleRating = '👍 GOOD';
        else if (cases.length >= 20) sampleRating = '😐 OKAY';
        else if (cases.length >= 10) sampleRating = '⚠️ WEAK';
        
        console.log(`📊 Sample: ${sampleRating}`);
        
    } else {
        console.log('❌ No cases found');
    }
    
    console.log('');
});

console.log('🎯 FINAL ASSESSMENT:');
console.log('Best threshold = highest ROI + adequate sample size');
console.log('Too strict (1.70) = fewer opportunities');
console.log('Too loose (1.75) = lower edge but more bets'); 