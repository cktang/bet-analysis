const fs = require('fs');
const path = require('path');

// Debug the impossible >100% loss
function debugLossCalculation() {
    console.log('🔍 Debugging impossible >100% losses...\n');
    
    // Load some data to understand profit values
    const seasonPath = path.join(__dirname, '../../data/processed/year-2023-2024.json');
    const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
    const matches = Object.values(seasonData.matches).slice(0, 10);
    
    console.log('Sample profit values from data:');
    matches.forEach((match, i) => {
        if (match.enhanced?.asianHandicapBetting) {
            const ah = match.enhanced.asianHandicapBetting;
            console.log(`${i+1}. ${match.match.homeTeam} vs ${match.match.awayTeam}`);
            console.log(`   Home result: ${ah.homeResult} -> Profit: ${ah.homeProfit}`);
            console.log(`   Away result: ${ah.awayResult} -> Profit: ${ah.awayProfit}`);
            console.log(`   Home odds: ${ah.homeOdds}, Away odds: ${ah.awayOdds}`);
        }
    });
    
    console.log('\n=== UNDERSTANDING PROFIT VALUES ===');
    console.log('Let me check what these profit values represent...');
    
    // Let's see the range of profit values
    const allMatches = Object.values(seasonData.matches);
    const validMatches = allMatches.filter(m => 
        m.enhanced?.asianHandicapBetting?.homeProfit !== undefined
    );
    
    const homeProfits = validMatches.map(m => m.enhanced.asianHandicapBetting.homeProfit);
    const awayProfits = validMatches.map(m => m.enhanced.asianHandicapBetting.awayProfit);
    
    console.log(`\nHome profit range: ${Math.min(...homeProfits)} to ${Math.max(...homeProfits)}`);
    console.log(`Away profit range: ${Math.min(...awayProfits)} to ${Math.max(...awayProfits)}`);
    
    // Count distribution
    const homeWins = homeProfits.filter(p => p > 0).length;
    const homeLosses = homeProfits.filter(p => p < 0).length;
    const homePushes = homeProfits.filter(p => p === 0).length;
    
    console.log(`\nHome betting outcomes:`);
    console.log(`  Wins: ${homeWins}, Losses: ${homeLosses}, Pushes: ${homePushes}`);
    
    const awayWins = awayProfits.filter(p => p > 0).length;
    const awayLosses = awayProfits.filter(p => p < 0).length;
    const awayPushes = awayProfits.filter(p => p === 0).length;
    
    console.log(`Away betting outcomes:`);
    console.log(`  Wins: ${awayWins}, Losses: ${awayLosses}, Pushes: ${awayPushes}`);
    
    // Test the calculation with a simple scenario
    console.log('\n=== TESTING CALCULATION ===');
    
    // Simulate always betting away
    let totalReturn = 0;
    awayProfits.forEach(profit => {
        totalReturn += profit;
    });
    
    const totalBets = awayProfits.length;
    const totalInvestment = totalBets * 100; // $100 per bet
    const actualProfit = totalReturn - totalInvestment;
    const profitability = actualProfit / totalInvestment;
    
    console.log(`Always bet AWAY strategy:`);
    console.log(`  Total bets: ${totalBets}`);
    console.log(`  Total investment: $${totalInvestment.toLocaleString()}`);
    console.log(`  Total return: $${totalReturn.toLocaleString()}`);
    console.log(`  Actual profit: $${actualProfit.toLocaleString()}`);
    console.log(`  Profitability: ${(profitability * 100).toFixed(2)}%`);
    
    // This should be realistic (small loss due to house edge)
    
    console.log('\n=== CHECKING DATA INTERPRETATION ===');
    console.log('Maybe the profit values already include the initial $100 bet?');
    console.log('Let me check a few examples...');
    
    validMatches.slice(0, 3).forEach((match, i) => {
        const ah = match.enhanced.asianHandicapBetting;
        console.log(`\nExample ${i+1}: ${match.match.homeTeam} vs ${match.match.awayTeam}`);
        console.log(`  Home: ${ah.homeResult} | Odds: ${ah.homeOdds} | Profit: ${ah.homeProfit}`);
        console.log(`  Away: ${ah.awayResult} | Odds: ${ah.awayOdds} | Profit: ${ah.awayProfit}`);
        
        // What SHOULD the profit be if we bet $100?
        if (ah.homeResult === 'win') {
            const expectedProfit = (ah.homeOdds - 1) * 100;
            console.log(`  Expected home win profit: ${expectedProfit} (if odds = ${ah.homeOdds})`);
        } else if (ah.homeResult === 'loss') {
            console.log(`  Expected home loss: -100`);
        }
    });
}

debugLossCalculation();