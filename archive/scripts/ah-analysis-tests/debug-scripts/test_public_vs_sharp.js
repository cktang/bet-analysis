const fs = require('fs');

console.log('🤔 TESTING: IS THE PUBLIC WRONG ON EXTREME ODDS?');
console.log('='.repeat(60));

// Load data
const data2022 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const data2023 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2023-2024-enhanced.json', 'utf8'));
const data2024 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

const allMatches = [
    ...Object.values(data2022.matches || {}),
    ...Object.values(data2023.matches || {}),
    ...Object.values(data2024.matches || {})
];

console.log(`📊 Analyzing ${allMatches.length} matches`);

// Find all cases where HKJC offers extreme odds
const extremeOddsCases = [];

allMatches.forEach(match => {
    const ah = match.preMatch?.match?.asianHandicapOdds;
    const matchInfo = match.preMatch?.match;
    
    if (!ah?.homeHandicap || !matchInfo) return;
    
    const isQuarter = ah.homeHandicap.includes('/');
    const homeOdds = ah.homeOdds || 2.0;
    const awayOdds = ah.awayOdds || 2.0;
    
    // Extreme odds threshold
    const hasExtremeOdds = homeOdds <= 1.7 || awayOdds <= 1.7;
    
    if (isQuarter && hasExtremeOdds) {
        // Determine who is the heavy favorite (public bet side)
        const publicFavorite = homeOdds < awayOdds ? 'home' : 'away';
        const favoriteOdds = Math.min(homeOdds, awayOdds);
        const underdogOdds = Math.max(homeOdds, awayOdds);
        
        // Determine actual winner
        const homeScore = matchInfo.homeScore;
        const awayScore = matchInfo.awayScore;
        let actualWinner = 'draw';
        if (homeScore > awayScore) actualWinner = 'home';
        if (awayScore > homeScore) actualWinner = 'away';
        
        // Calculate Asian Handicap result
        const handicapValues = ah.homeHandicap.includes('/') ? 
            ah.homeHandicap.split('/').map(h => parseFloat(h)) : [parseFloat(ah.homeHandicap)];
        
        const avgHandicap = handicapValues.reduce((a, b) => a + b) / handicapValues.length;
        const adjustedHomeScore = homeScore + avgHandicap;
        
        let ahWinner = 'draw';
        if (adjustedHomeScore > awayScore) ahWinner = 'home';
        if (adjustedHomeScore < awayScore) ahWinner = 'away';
        
        // Check if public favorite won
        const publicWon = (publicFavorite === ahWinner);
        
        extremeOddsCases.push({
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            handicap: ah.homeHandicap,
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            publicFavorite: publicFavorite,
            favoriteOdds: favoriteOdds.toFixed(2),
            underdogOdds: underdogOdds.toFixed(2),
            actualResult: `${homeScore}-${awayScore}`,
            ahWinner: ahWinner,
            publicWon: publicWon,
            week: match.preMatch?.fbref?.week || 'Unknown'
        });
    }
});

console.log(`\n🎯 EXTREME ODDS CASES FOUND: ${extremeOddsCases.length}`);

if (extremeOddsCases.length > 0) {
    // Analyze public success rate
    const publicWins = extremeOddsCases.filter(c => c.publicWon).length;
    const publicWinRate = (publicWins / extremeOddsCases.length * 100).toFixed(1);
    
    console.log(`\n📊 PUBLIC BETTING RESULTS:`);
    console.log(`Public wins: ${publicWins}/${extremeOddsCases.length} (${publicWinRate}%)`);
    console.log(`Public losses: ${extremeOddsCases.length - publicWins}/${extremeOddsCases.length} (${(100 - publicWinRate)}%)`);
    
    // Calculate average odds
    const avgFavoriteOdds = extremeOddsCases.reduce((sum, c) => sum + parseFloat(c.favoriteOdds), 0) / extremeOddsCases.length;
    const avgUnderdogOdds = extremeOddsCases.reduce((sum, c) => sum + parseFloat(c.underdogOdds), 0) / extremeOddsCases.length;
    
    console.log(`\nAverage favorite odds: ${avgFavoriteOdds.toFixed(2)}`);
    console.log(`Average underdog odds: ${avgUnderdogOdds.toFixed(2)}`);
    
    // Calculate expected vs actual win rates
    const impliedFavoriteWinRate = (1 / avgFavoriteOdds * 100).toFixed(1);
    console.log(`\n🎲 ODDS vs REALITY:`);
    console.log(`Implied favorite win rate: ${impliedFavoriteWinRate}%`);
    console.log(`Actual favorite win rate: ${publicWinRate}%`);
    console.log(`Difference: ${(publicWinRate - impliedFavoriteWinRate).toFixed(1)}%`);
    
    // Show individual cases
    console.log(`\n🔍 INDIVIDUAL CASES:`);
    extremeOddsCases.forEach((case_, i) => {
        const result = case_.publicWon ? '✅ PUBLIC WON' : '❌ PUBLIC LOST';
        const team = case_.publicFavorite === 'home' ? case_.match.split(' vs ')[0] : case_.match.split(' vs ')[1];
        
        console.log(`${i + 1}. ${case_.match} (Week ${case_.week})`);
        console.log(`   Handicap: ${case_.handicap} | Odds: ${case_.homeOdds}-${case_.awayOdds}`);
        console.log(`   Public favorite: ${team} (${case_.favoriteOdds}) ${result}`);
        console.log(`   Result: ${case_.actualResult} | AH Winner: ${case_.ahWinner}`);
        console.log('');
    });
    
    // Calculate contrarian strategy ROI
    console.log(`\n💰 CONTRARIAN STRATEGY ANALYSIS:`);
    console.log(`If we fade the public (bet underdogs):`);
    
    let totalProfit = 0;
    extremeOddsCases.forEach(case_ => {
        const underdogWon = !case_.publicWon;
        const underdogOdds = parseFloat(case_.underdogOdds);
        const profit = underdogWon ? (underdogOdds - 1) * 100 : -100;
        totalProfit += profit;
    });
    
    const roi = (totalProfit / (extremeOddsCases.length * 100) * 100).toFixed(1);
    console.log(`Total bets: ${extremeOddsCases.length}`);
    console.log(`Total profit: ${totalProfit.toFixed(0)} units`);
    console.log(`ROI: ${roi}%`);
    
    console.log(`\n🏆 VERDICT:`);
    if (parseFloat(publicWinRate) < 50 && parseFloat(roi) > 0) {
        console.log(`🚨 THEORY CONFIRMED: Public is wrong ${(100 - publicWinRate)}% of the time!`);
        console.log(`Contrarian strategy shows +${roi}% ROI`);
        console.log(`The public betting creates the inefficiency!`);
    } else {
        console.log(`❌ THEORY REJECTED: Public actually wins ${publicWinRate}% of the time`);
        console.log(`Contrarian strategy shows ${roi}% ROI (negative = losing)`);
    }
} else {
    console.log('❌ No extreme odds cases found to analyze');
} 