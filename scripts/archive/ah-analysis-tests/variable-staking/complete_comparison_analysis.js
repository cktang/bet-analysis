const fs = require('fs');

console.log('🎯 COMPLETE QUARTER HANDICAP vs 1X2 COMPARISON');
console.log('='.repeat(60));
console.log('💡 Testing ALL extreme odds cases and BOTH sides of each bet');
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

// Find ALL extreme odds quarter handicap cases
function findAllExtremeOddsCases() {
    const cases = [];
    
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
            cases.push({
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
                week: match.preMatch?.fbref?.week || 'Unknown'
            });
        }
    });
    
    return cases;
}

// Calculate quarter handicap result properly
function calculateQuarterHandicapResult(homeScore, awayScore, handicap, betSide, odds, betAmount = 100) {
    const parts = handicap.split('/').map(h => parseFloat(h));
    const handicap1 = parts[0];
    const handicap2 = parts[1];
    
    let wins = 0;
    let pushes = 0;
    
    if (betSide === 'home') {
        // Home team betting
        const adj1 = homeScore + handicap1;
        const adj2 = homeScore + handicap2;
        
        if (adj1 > awayScore) wins++;
        else if (adj1 === awayScore) pushes++;
        
        if (adj2 > awayScore) wins++;
        else if (adj2 === awayScore) pushes++;
    } else {
        // Away team betting
        const adj1 = awayScore - handicap1;
        const adj2 = awayScore - handicap2;
        
        if (adj1 > homeScore) wins++;
        else if (adj1 === homeScore) pushes++;
        
        if (adj2 > homeScore) wins++;
        else if (adj2 === homeScore) pushes++;
    }
    
    // Calculate profit
    let profit = 0;
    if (wins === 2) {
        profit = betAmount * (odds - 1); // Full win
    } else if (wins === 1 && pushes === 1) {
        profit = (betAmount * (odds - 1)) / 2; // Half win
    } else if (pushes === 2) {
        profit = 0; // Full push
    } else if (wins === 0 && pushes === 1) {
        profit = -betAmount / 2; // Half loss
    } else {
        profit = -betAmount; // Full loss
    }
    
    return profit;
}

// Test multiple strategies
function testAllStrategies(cases) {
    const strategies = {
        quarterExtremeHome: { bets: 0, profit: 0, name: 'Quarter Handicap (Extreme Home)' },
        quarterExtremeAway: { bets: 0, profit: 0, name: 'Quarter Handicap (Extreme Away)' },
        oneX2HomeWin: { bets: 0, profit: 0, name: '1X2 Home Win (when home extreme)' },
        oneX2DrawAway: { bets: 0, profit: 0, name: '1X2 Draw+Away (when home extreme)' },
        oneX2AwayWin: { bets: 0, profit: 0, name: '1X2 Away Win (when away extreme)' },
        oneX2HomeDraw: { bets: 0, profit: 0, name: '1X2 Home+Draw (when away extreme)' }
    };
    
    console.log('📊 TESTING ALL STRATEGIES:');
    console.log('-'.repeat(100));
    console.log('Match                    | Handicap | Extreme | Quarter | 1X2    | 1X2 Opp | Result | Q Profit | 1X2 | Opp ');
    console.log('                         |          | Side    | Odds    | Odds   | Odds    |        |          |     |     ');
    console.log('-'.repeat(100));
    
    cases.forEach(case_ => {
        const betAmount = 100;
        const matchStr = `${case_.homeTeam.slice(0,8)} vs ${case_.awayTeam.slice(0,8)}`;
        const actualResult = `${case_.homeScore}-${case_.awayScore}`;
        
        if (case_.extremeSide === 'home') {
            // Home team has extreme odds
            
            // Strategy 1: Bet home team quarter handicap
            const quarterProfit = calculateQuarterHandicapResult(
                case_.homeScore, case_.awayScore, case_.handicap, 'home', case_.quarterHomeOdds, betAmount
            );
            strategies.quarterExtremeHome.bets++;
            strategies.quarterExtremeHome.profit += quarterProfit;
            
            // Strategy 2: Bet home win in 1X2
            let oneX2HomeProfit = 0;
            if (case_.homeWin) {
                oneX2HomeProfit = betAmount * (case_.homeWinOdds - 1);
            } else {
                oneX2HomeProfit = -betAmount;
            }
            strategies.oneX2HomeWin.bets++;
            strategies.oneX2HomeWin.profit += oneX2HomeProfit;
            
            // Strategy 3: Bet Draw+Away in 1X2 (opposite of home win)
            const drawAwayOdds = 1 / ((1/case_.drawOdds) + (1/case_.awayWinOdds));
            let oneX2DrawAwayProfit = 0;
            if (case_.draw || case_.awayWin) {
                oneX2DrawAwayProfit = betAmount * (drawAwayOdds - 1);
            } else {
                oneX2DrawAwayProfit = -betAmount;
            }
            strategies.oneX2DrawAway.bets++;
            strategies.oneX2DrawAway.profit += oneX2DrawAwayProfit;
            
            console.log(`${matchStr.padEnd(24)} | ${case_.handicap.padEnd(8)} | ${case_.extremeSide.padEnd(7)} | ${case_.quarterHomeOdds.toFixed(2).padStart(7)} | ${case_.homeWinOdds.toFixed(2).padStart(6)} | ${drawAwayOdds.toFixed(2).padStart(7)} | ${actualResult.padEnd(6)} | ${quarterProfit.toFixed(0).padStart(8)} | ${oneX2HomeProfit.toFixed(0).padStart(3)} | ${oneX2DrawAwayProfit.toFixed(0).padStart(3)}`);
            
        } else {
            // Away team has extreme odds
            
            // Strategy 1: Bet away team quarter handicap
            const quarterProfit = calculateQuarterHandicapResult(
                case_.homeScore, case_.awayScore, case_.handicap, 'away', case_.quarterAwayOdds, betAmount
            );
            strategies.quarterExtremeAway.bets++;
            strategies.quarterExtremeAway.profit += quarterProfit;
            
            // Strategy 2: Bet away win in 1X2
            let oneX2AwayProfit = 0;
            if (case_.awayWin) {
                oneX2AwayProfit = betAmount * (case_.awayWinOdds - 1);
            } else {
                oneX2AwayProfit = -betAmount;
            }
            strategies.oneX2AwayWin.bets++;
            strategies.oneX2AwayWin.profit += oneX2AwayProfit;
            
            // Strategy 3: Bet Home+Draw in 1X2 (opposite of away win)
            const homeDrawOdds = 1 / ((1/case_.homeWinOdds) + (1/case_.drawOdds));
            let oneX2HomeDrawProfit = 0;
            if (case_.homeWin || case_.draw) {
                oneX2HomeDrawProfit = betAmount * (homeDrawOdds - 1);
            } else {
                oneX2HomeDrawProfit = -betAmount;
            }
            strategies.oneX2HomeDraw.bets++;
            strategies.oneX2HomeDraw.profit += oneX2HomeDrawProfit;
            
            console.log(`${matchStr.padEnd(24)} | ${case_.handicap.padEnd(8)} | ${case_.extremeSide.padEnd(7)} | ${case_.quarterAwayOdds.toFixed(2).padStart(7)} | ${case_.awayWinOdds.toFixed(2).padStart(6)} | ${homeDrawOdds.toFixed(2).padStart(7)} | ${actualResult.padEnd(6)} | ${quarterProfit.toFixed(0).padStart(8)} | ${oneX2AwayProfit.toFixed(0).padStart(3)} | ${oneX2HomeDrawProfit.toFixed(0).padStart(3)}`);
        }
    });
    
    return strategies;
}

// Run the analysis
console.log('🎯 COMPLETE EXTREME ODDS ANALYSIS');
console.log('='.repeat(60));

const cases = findAllExtremeOddsCases();
console.log(`📈 Found ${cases.length} extreme odds cases (should be ~117)\n`);

if (cases.length === 0) {
    console.log('❌ No cases found');
    return;
}

const strategies = testAllStrategies(cases);

console.log('\n📊 STRATEGY COMPARISON RESULTS:');
console.log('='.repeat(70));

Object.values(strategies).forEach(strategy => {
    if (strategy.bets > 0) {
        const roi = (strategy.profit / (strategy.bets * 100) * 100);
        const winRate = roi > 0 ? 'Positive' : 'Negative';
        
        console.log(`${strategy.name}:`);
        console.log(`  Bets: ${strategy.bets}`);
        console.log(`  Profit: ${strategy.profit.toFixed(0)} units`);
        console.log(`  ROI: ${roi.toFixed(1)}%`);
        console.log(`  Performance: ${winRate}`);
        console.log('');
    }
});

// Find the best strategy
const bestStrategy = Object.values(strategies).reduce((best, current) => {
    if (current.bets === 0) return best;
    const currentROI = current.profit / (current.bets * 100);
    const bestROI = best.bets === 0 ? -999 : best.profit / (best.bets * 100);
    return currentROI > bestROI ? current : best;
}, { bets: 0, profit: 0, name: 'None' });

console.log(`🎯 WINNER: ${bestStrategy.name}`);
console.log(`💰 Best ROI: ${((bestStrategy.profit / (bestStrategy.bets * 100)) * 100).toFixed(1)}%`);

console.log('\n✅ Complete comparison analysis done!'); 