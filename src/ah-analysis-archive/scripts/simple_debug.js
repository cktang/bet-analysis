const fs = require('fs');
const path = require('path');

// Simple debug to understand the profit calculation issue
function simpleDebug() {
    console.log('🔍 Simple debug of profit calculations...\n');
    
    // Load some data
    const seasonPath = path.join(__dirname, '../../data/processed/year-2023-2024.json');
    const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
    const matches = Object.values(seasonData.matches).slice(0, 20);
    
    // Filter valid matches
    const validMatches = matches.filter(match => 
        match.enhanced?.asianHandicapBetting?.homeProfit !== undefined &&
        match.enhanced?.asianHandicapBetting?.awayProfit !== undefined &&
        match.enhanced?.performance?.homeEfficiency !== undefined &&
        match.enhanced?.performance?.awayEfficiency !== undefined
    );
    
    console.log(`Testing with ${validMatches.length} matches\n`);
    
    // Test the efficiency difference factor
    let totalReturn = 0;
    let homePicks = 0;
    let awayPicks = 0;
    
    const efficiencyDiffs = validMatches.map(match => {
        const homeEff = match.enhanced.performance.homeEfficiency;
        const awayEff = match.enhanced.performance.awayEfficiency;
        return homeEff - awayEff;
    });
    
    const median = efficiencyDiffs.sort((a, b) => a - b)[Math.floor(efficiencyDiffs.length / 2)];
    console.log(`Median efficiency difference: ${median}`);
    
    console.log('\nDetailed betting simulation:');
    validMatches.forEach((match, i) => {
        const homeEff = match.enhanced.performance.homeEfficiency;
        const awayEff = match.enhanced.performance.awayEfficiency;
        const effDiff = homeEff - awayEff;
        
        const homeProfit = match.enhanced.asianHandicapBetting.homeProfit;
        const awayProfit = match.enhanced.asianHandicapBetting.awayProfit;
        
        let betChoice, profit;
        if (effDiff > median) {
            betChoice = 'HOME';
            profit = homeProfit;
            homePicks++;
        } else {
            betChoice = 'AWAY';
            profit = awayProfit;
            awayPicks++;
        }
        
        totalReturn += profit;
        
        if (i < 10) { // Show first 10 matches
            console.log(`${i+1}. ${match.match.homeTeam} vs ${match.match.awayTeam}`);
            console.log(`   Eff diff: ${effDiff.toFixed(4)} | Median: ${median.toFixed(4)} | Bet: ${betChoice} | Profit: ${profit}`);
        }
    });
    
    console.log(`\nSUMMARY:`);
    console.log(`Total matches: ${validMatches.length}`);
    console.log(`Home picks: ${homePicks}, Away picks: ${awayPicks}`);
    console.log(`Total return: ${totalReturn}`);
    console.log(`Average profit per bet: ${(totalReturn / validMatches.length).toFixed(2)}`);
    console.log(`Profitability: ${((totalReturn / validMatches.length) / 100).toFixed(4)} = ${(((totalReturn / validMatches.length) / 100) * 100).toFixed(2)}%`);
    
    // Let's also check what "always bet away" would give us
    let alwaysAwayReturn = 0;
    validMatches.forEach(match => {
        alwaysAwayReturn += match.enhanced.asianHandicapBetting.awayProfit;
    });
    
    console.log(`\nCOMPARISON - Always bet away:`);
    console.log(`Total return: ${alwaysAwayReturn}`);
    console.log(`Average profit per bet: ${(alwaysAwayReturn / validMatches.length).toFixed(2)}`);
    console.log(`Profitability: ${(((alwaysAwayReturn / validMatches.length) / 100) * 100).toFixed(2)}%`);
}

simpleDebug();