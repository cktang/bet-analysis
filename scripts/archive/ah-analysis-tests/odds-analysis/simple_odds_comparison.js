const fs = require('fs');

console.log('🎯 SIMPLE QUARTER HANDICAP vs 1X2 COMPARISON');
console.log('='.repeat(60));
console.log('💡 Theory: Compare quarter handicap odds to equivalent 1X2 odds');
console.log('   0/-0.5 handicap ≈ Home Win (1X2)');
console.log('   0/+0.5 handicap ≈ Away Win + Draw (1X2)');
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

// Find extreme odds quarter handicap cases for simple comparison
function findSimpleComparisons() {
    const comparisons = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!ah.homeHandicap.includes('/')) return; // Quarter handicaps only
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        const homeWinOdds = matchInfo.homeWinOdds;
        const drawOdds = matchInfo.drawOdds;
        const awayWinOdds = matchInfo.awayWinOdds;
        
        if (!homeWinOdds || !drawOdds || !awayWinOdds) return;
        
        // Check for extreme odds (≤1.72 threshold) 
        const hasExtremeOdds = homeOdds <= 1.72 || awayOdds <= 1.72;
        
        if (hasExtremeOdds) {
            // Focus on simple cases we can compare directly
            if (ah.homeHandicap === '0/-0.5') {
                // Home team 0/-0.5 ≈ Home team to win
                comparisons.push({
                    date: matchInfo.date,
                    homeTeam: matchInfo.homeTeam,
                    awayTeam: matchInfo.awayTeam,
                    handicap: ah.homeHandicap,
                    quarterHomeOdds: homeOdds,
                    quarterAwayOdds: awayOdds,
                    homeWinOdds: homeWinOdds,
                    drawOdds: drawOdds,
                    awayWinOdds: awayWinOdds,
                    homeScore: matchInfo.homeScore,
                    awayScore: matchInfo.awayScore,
                    homeWin: matchInfo.homeScore > matchInfo.awayScore,
                    draw: matchInfo.homeScore === matchInfo.awayScore,
                    awayWin: matchInfo.awayScore > matchInfo.homeScore,
                    extremeSide: homeOdds <= 1.72 ? 'home' : 'away',
                    extremeOdds: Math.min(homeOdds, awayOdds),
                    week: match.preMatch?.fbref?.week || 'Unknown',
                    type: 'home_level_quarter'
                });
            } else if (ah.homeHandicap === '0/+0.5') {
                // Away team gets 0/+0.5 ≈ Away win or draw
                const awayWinOrDrawOdds = 1 / ((1/awayWinOdds) + (1/drawOdds));
                
                comparisons.push({
                    date: matchInfo.date,
                    homeTeam: matchInfo.homeTeam,
                    awayTeam: matchInfo.awayTeam,
                    handicap: ah.homeHandicap,
                    quarterHomeOdds: homeOdds,
                    quarterAwayOdds: awayOdds,
                    homeWinOdds: homeWinOdds,
                    drawOdds: drawOdds,
                    awayWinOdds: awayWinOdds,
                    awayWinOrDrawOdds: awayWinOrDrawOdds,
                    homeScore: matchInfo.homeScore,
                    awayScore: matchInfo.awayScore,
                    homeWin: matchInfo.homeScore > matchInfo.awayScore,
                    draw: matchInfo.homeScore === matchInfo.awayScore,
                    awayWin: matchInfo.awayScore > matchInfo.homeScore,
                    extremeSide: homeOdds <= 1.72 ? 'home' : 'away',
                    extremeOdds: Math.min(homeOdds, awayOdds),
                    week: match.preMatch?.fbref?.week || 'Unknown',
                    type: 'away_level_quarter'
                });
            }
        }
    });
    
    return comparisons;
}

// Test betting strategies
function testBettingStrategies(comparisons) {
    const results = {
        quarterHandicapStrategy: { bets: 0, wins: 0, profit: 0 },
        oneX2Strategy: { bets: 0, wins: 0, profit: 0 }
    };
    
    console.log('📊 DETAILED COMPARISON CASES:');
    console.log('-'.repeat(90));
    console.log('Match                    | Quarter | 1X2    | Better | Actual Result | Quarter | 1X2   ');
    console.log('                         | Odds    | Odds   | Value  |               | Result  | Result');
    console.log('-'.repeat(90));
    
    comparisons.forEach(comp => {
        const betAmount = 100;
        let quarterProfit = 0;
        let oneX2Profit = 0;
        let quarterResult = '';
        let oneX2Result = '';
        
        if (comp.type === 'home_level_quarter' && comp.extremeSide === 'home') {
            // Compare home team quarter handicap vs home win 1X2
            const quarterOdds = comp.quarterHomeOdds;
            const oneX2Odds = comp.homeWinOdds;
            
            // Quarter handicap bet result (0/-0.5)
            if (comp.homeWin) {
                quarterResult = 'WIN';
                quarterProfit = betAmount * (quarterOdds - 1);
            } else if (comp.draw) {
                quarterResult = 'HALF-WIN';
                quarterProfit = (betAmount * (quarterOdds - 1)) / 2;
            } else {
                quarterResult = 'LOSE';
                quarterProfit = -betAmount;
            }
            
            // 1X2 home win bet result
            if (comp.homeWin) {
                oneX2Result = 'WIN';
                oneX2Profit = betAmount * (oneX2Odds - 1);
            } else {
                oneX2Result = 'LOSE';
                oneX2Profit = -betAmount;
            }
            
            const betterValue = quarterOdds > oneX2Odds ? 'Quarter' : '1X2';
            const matchStr = `${comp.homeTeam.slice(0,8)} vs ${comp.awayTeam.slice(0,8)}`;
            const actualResult = `${comp.homeScore}-${comp.awayScore}`;
            
            console.log(`${matchStr.padEnd(24)} | ${quarterOdds.toFixed(2).padStart(7)} | ${oneX2Odds.toFixed(2).padStart(6)} | ${betterValue.padEnd(6)} | ${actualResult.padEnd(13)} | ${quarterResult.padEnd(7)} | ${oneX2Result.padEnd(5)}`);
            
            results.quarterHandicapStrategy.bets++;
            results.quarterHandicapStrategy.profit += quarterProfit;
            if (quarterProfit > 0) results.quarterHandicapStrategy.wins++;
            
            results.oneX2Strategy.bets++;
            results.oneX2Strategy.profit += oneX2Profit;
            if (oneX2Profit > 0) results.oneX2Strategy.wins++;
            
        } else if (comp.type === 'away_level_quarter' && comp.extremeSide === 'away') {
            // Compare away team quarter handicap vs away win or draw
            const quarterOdds = comp.quarterAwayOdds;
            const oneX2Odds = comp.awayWinOrDrawOdds;
            
            // Quarter handicap bet result (0/+0.5)
            if (comp.awayWin) {
                quarterResult = 'WIN';
                quarterProfit = betAmount * (quarterOdds - 1);
            } else if (comp.draw) {
                quarterResult = 'WIN';
                quarterProfit = betAmount * (quarterOdds - 1);
            } else {
                quarterResult = 'LOSE';
                quarterProfit = -betAmount;
            }
            
            // 1X2 away win or draw bet result (double chance)
            if (comp.awayWin || comp.draw) {
                oneX2Result = 'WIN';
                oneX2Profit = betAmount * (oneX2Odds - 1);
            } else {
                oneX2Result = 'LOSE';
                oneX2Profit = -betAmount;
            }
            
            const betterValue = quarterOdds > oneX2Odds ? 'Quarter' : '1X2';
            const matchStr = `${comp.homeTeam.slice(0,8)} vs ${comp.awayTeam.slice(0,8)}`;
            const actualResult = `${comp.homeScore}-${comp.awayScore}`;
            
            console.log(`${matchStr.padEnd(24)} | ${quarterOdds.toFixed(2).padStart(7)} | ${oneX2Odds.toFixed(2).padStart(6)} | ${betterValue.padEnd(6)} | ${actualResult.padEnd(13)} | ${quarterResult.padEnd(7)} | ${oneX2Result.padEnd(5)}`);
            
            results.quarterHandicapStrategy.bets++;
            results.quarterHandicapStrategy.profit += quarterProfit;
            if (quarterProfit > 0) results.quarterHandicapStrategy.wins++;
            
            results.oneX2Strategy.bets++;
            results.oneX2Strategy.profit += oneX2Profit;
            if (oneX2Profit > 0) results.oneX2Strategy.wins++;
        }
    });
    
    return results;
}

// Run the analysis
console.log('🎯 SIMPLE ODDS COMPARISON ANALYSIS');
console.log('='.repeat(60));

const comparisons = findSimpleComparisons();
console.log(`📈 Found ${comparisons.length} comparable cases\n`);

if (comparisons.length === 0) {
    console.log('❌ No comparable cases found');
    return;
}

const results = testBettingStrategies(comparisons);

console.log('\n📊 STRATEGY COMPARISON RESULTS:');
console.log('-'.repeat(50));
console.log(`Quarter Handicap Strategy:`);
console.log(`  Bets: ${results.quarterHandicapStrategy.bets}`);
console.log(`  Wins: ${results.quarterHandicapStrategy.wins}`);
console.log(`  Win Rate: ${(results.quarterHandicapStrategy.wins / results.quarterHandicapStrategy.bets * 100).toFixed(1)}%`);
console.log(`  Profit: ${results.quarterHandicapStrategy.profit.toFixed(0)} units`);
console.log(`  ROI: ${(results.quarterHandicapStrategy.profit / (results.quarterHandicapStrategy.bets * 100) * 100).toFixed(1)}%`);

console.log(`\n1X2 Equivalent Strategy:`);
console.log(`  Bets: ${results.oneX2Strategy.bets}`);
console.log(`  Wins: ${results.oneX2Strategy.wins}`);
console.log(`  Win Rate: ${(results.oneX2Strategy.wins / results.oneX2Strategy.bets * 100).toFixed(1)}%`);
console.log(`  Profit: ${results.oneX2Strategy.profit.toFixed(0)} units`);
console.log(`  ROI: ${(results.oneX2Strategy.profit / (results.oneX2Strategy.bets * 100) * 100).toFixed(1)}%`);

console.log(`\n🎯 WINNER: ${results.quarterHandicapStrategy.profit > results.oneX2Strategy.profit ? 'Quarter Handicap Strategy' : '1X2 Strategy'}`);

const profitDifference = Math.abs(results.quarterHandicapStrategy.profit - results.oneX2Strategy.profit);
console.log(`💰 Profit difference: ${profitDifference.toFixed(0)} units`);

console.log('\n✅ Simple comparison analysis complete!'); 