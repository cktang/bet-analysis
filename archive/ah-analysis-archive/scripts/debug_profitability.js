const fs = require('fs');
const path = require('path');

// Load data and test a simple scenario
function debugProfitability() {
    console.log('🔍 Debugging profitability calculations...\n');
    
    // Load one season of data
    const seasonPath = path.join(__dirname, '../../data/processed/year-2023-2024.json');
    const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
    const matches = Object.values(seasonData.matches).slice(0, 100); // Test with 100 matches
    
    // Filter matches with complete data
    const validMatches = matches.filter(match => 
        match.enhanced?.asianHandicapBetting?.homeProfit !== undefined &&
        match.enhanced?.asianHandicapBetting?.awayProfit !== undefined &&
        match.enhanced?.performance?.homeEfficiency !== undefined &&
        match.enhanced?.performance?.awayEfficiency !== undefined
    );
    
    console.log(`Testing with ${validMatches.length} valid matches\n`);
    
    // Test the top factor: efficiency difference
    const factorValues = [];
    const profits = [];
    
    validMatches.forEach(match => {
        const homeEff = match.enhanced.performance.homeEfficiency;
        const awayEff = match.enhanced.performance.awayEfficiency;
        const effDiff = homeEff - awayEff;
        
        factorValues.push(effDiff);
        profits.push({
            home: match.enhanced.asianHandicapBetting.homeProfit,
            away: match.enhanced.asianHandicapBetting.awayProfit,
            factor: effDiff
        });
    });
    
    // Sort by factor value to find thresholds
    profits.sort((a, b) => a.factor - b.factor);
    
    // Test different strategies
    console.log('Testing betting strategies:\n');
    
    // Strategy 1: Always bet home
    let homeBets = 0, homeTotalProfit = 0;
    profits.forEach(p => {
        homeBets++;
        homeTotalProfit += p.home;
    });
    
    console.log('Strategy 1 - Always bet HOME:');
    console.log(`  Bets: ${homeBets}`);
    console.log(`  Total profit: ${homeTotalProfit}`);
    console.log(`  Average profit per bet: ${(homeTotalProfit / homeBets).toFixed(2)}`);
    console.log(`  Profitability: ${((homeTotalProfit / homeBets) / 100 * 100).toFixed(2)}%\n`);
    
    // Strategy 2: Always bet away
    let awayBets = 0, awayTotalProfit = 0;
    profits.forEach(p => {
        awayBets++;
        awayTotalProfit += p.away;
    });
    
    console.log('Strategy 2 - Always bet AWAY:');
    console.log(`  Bets: ${awayBets}`);
    console.log(`  Total profit: ${awayTotalProfit}`);
    console.log(`  Average profit per bet: ${(awayTotalProfit / awayBets).toFixed(2)}`);
    console.log(`  Profitability: ${((awayTotalProfit / awayBets) / 100 * 100).toFixed(2)}%\n`);
    
    // Strategy 3: Threshold-based
    const median = profits[Math.floor(profits.length / 2)].factor;
    console.log(`Median efficiency difference: ${median.toFixed(4)}\n`);
    
    let thresholdHomeBets = 0, thresholdAwayBets = 0;
    let thresholdHomeTotalProfit = 0, thresholdAwayTotalProfit = 0;
    
    profits.forEach(p => {
        if (p.factor > median) {
            // Bet home when efficiency difference is positive
            thresholdHomeBets++;
            thresholdHomeTotalProfit += p.home;
        } else {
            // Bet away when efficiency difference is negative
            thresholdAwayBets++;
            thresholdAwayTotalProfit += p.away;
        }
    });
    
    console.log('Strategy 3 - Threshold-based (bet home if eff diff > median):');
    console.log(`  HOME bets: ${thresholdHomeBets}, Total profit: ${thresholdHomeTotalProfit}`);
    if (thresholdHomeBets > 0) {
        console.log(`  HOME avg profit: ${(thresholdHomeTotalProfit / thresholdHomeBets).toFixed(2)}`);
        console.log(`  HOME profitability: ${((thresholdHomeTotalProfit / thresholdHomeBets) / 100 * 100).toFixed(2)}%`);
    }
    
    console.log(`  AWAY bets: ${thresholdAwayBets}, Total profit: ${thresholdAwayTotalProfit}`);
    if (thresholdAwayBets > 0) {
        console.log(`  AWAY avg profit: ${(thresholdAwayTotalProfit / thresholdAwayBets).toFixed(2)}`);
        console.log(`  AWAY profitability: ${((thresholdAwayTotalProfit / thresholdAwayBets) / 100 * 100).toFixed(2)}%`);
    }
    
    // Show some sample data
    console.log('\nSample data points:');
    profits.slice(0, 10).forEach((p, i) => {
        console.log(`${i+1}. Factor: ${p.factor.toFixed(4)}, Home profit: ${p.home}, Away profit: ${p.away}`);
    });
}

debugProfitability();