const fs = require('fs');

console.log('📊 DETAILED QUARTER HANDICAP BREAKDOWN BY LEVEL');
console.log('='.repeat(80));
console.log('🎯 Analyzing specific handicap lines to find performance patterns');
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

// CORRECT Asian Handicap calculation (using the fixed logic)
function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return null;
    }
    
    if (!handicap.includes('/')) return null;
    
    const parts = handicap.split('/');
    const h1 = parseFloat(parts[0]);
    const h2 = parseFloat(parts[1]);
    
    // Apply handicap to HOME team score (handicap is always from home perspective)
    const homeScoreWithH1 = homeScore + h1;
    const homeScoreWithH2 = homeScore + h2;
    
    // Determine results for each line based on who we're betting on
    let result1, result2;
    
    if (betSide === 'home') {
        // Betting on home team
        result1 = homeScoreWithH1 > awayScore ? 'win' : (homeScoreWithH1 === awayScore ? 'push' : 'lose');
        result2 = homeScoreWithH2 > awayScore ? 'win' : (homeScoreWithH2 === awayScore ? 'push' : 'lose');
    } else {
        // Betting on away team (reverse the logic)
        result1 = homeScoreWithH1 < awayScore ? 'win' : (homeScoreWithH1 === awayScore ? 'push' : 'lose');
        result2 = homeScoreWithH2 < awayScore ? 'win' : (homeScoreWithH2 === awayScore ? 'push' : 'lose');
    }
    
    // Combine results
    if (result1 === 'win' && result2 === 'win') return 'win';
    if (result1 === 'lose' && result2 === 'lose') return 'lose';
    if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
    if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
    return 'push';
}

// Helper functions
function calculateSimpleStake(odds) {
    const baseOdds = 1.91;
    const baseStake = 200;
    const increment = 150;
    
    if (odds < baseOdds) return baseStake;
    
    const steps = Math.round((odds - baseOdds) / 0.01);
    return baseStake + (steps * increment);
}

function isQuarterHandicap(handicap) {
    return handicap && handicap.includes('/');
}

function homeHasAdvantage(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        return h1 < 0 && h2 < 0;
    }
    return false;
}

function homeIsUnderdog(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        return h1 > 0 && h2 > 0;
    }
    return false;
}

// Detailed breakdown analysis
function analyzeHandicapLevels() {
    console.log('🔍 ANALYZING EACH HANDICAP LEVEL:');
    console.log('='.repeat(60));
    
    const handicapStats = {};
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        const isHomeAdvantage = homeHasAdvantage(ah.homeHandicap);
        const isHomeUnderdog = homeIsUnderdog(ah.homeHandicap);
        
        if (!isHomeAdvantage && !isHomeUnderdog) return; // Skip neutral
        
        const handicapLine = ah.homeHandicap;
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const higherOddsSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        
        const stake = calculateSimpleStake(higherOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, higherOddsSide);
        
        if (!betResult) return;
        
        // Initialize handicap stats if not exists
        if (!handicapStats[handicapLine]) {
            handicapStats[handicapLine] = {
                type: isHomeAdvantage ? 'Home Advantage' : 'Home Underdog',
                bets: 0,
                totalStaked: 0,
                totalProfit: 0,
                wins: 0,
                halfWins: 0,
                losses: 0,
                halfLosses: 0,
                pushes: 0,
                avgOdds: 0,
                totalOdds: 0
            };
        }
        
        // Calculate profit
        let profit = 0;
        if (betResult === 'win') {
            profit = stake * (higherOdds - 1);
            handicapStats[handicapLine].wins++;
        } else if (betResult === 'half-win') {
            profit = stake * (higherOdds - 1) / 2;
            handicapStats[handicapLine].halfWins++;
        } else if (betResult === 'push') {
            profit = 0;
            handicapStats[handicapLine].pushes++;
        } else if (betResult === 'half-lose') {
            profit = -stake / 2;
            handicapStats[handicapLine].halfLosses++;
        } else {
            profit = -stake;
            handicapStats[handicapLine].losses++;
        }
        
        // Update stats
        handicapStats[handicapLine].bets++;
        handicapStats[handicapLine].totalStaked += stake;
        handicapStats[handicapLine].totalProfit += profit;
        handicapStats[handicapLine].totalOdds += higherOdds;
    });
    
    // Calculate final metrics and sort
    const results = Object.entries(handicapStats).map(([handicap, stats]) => {
        const roi = stats.totalStaked > 0 ? ((stats.totalProfit / stats.totalStaked) * 100).toFixed(2) : '0.00';
        const winRate = stats.bets > 0 ? (((stats.wins + stats.halfWins * 0.5) / stats.bets) * 100).toFixed(1) : '0.0';
        const avgOdds = stats.bets > 0 ? (stats.totalOdds / stats.bets).toFixed(2) : '0.00';
        
        return {
            handicap,
            type: stats.type,
            bets: stats.bets,
            roi: parseFloat(roi),
            winRate: parseFloat(winRate),
            avgOdds: parseFloat(avgOdds),
            totalStaked: Math.round(stats.totalStaked),
            totalProfit: Math.round(stats.totalProfit),
            wins: stats.wins,
            halfWins: stats.halfWins,
            losses: stats.losses,
            halfLosses: stats.halfLosses
        };
    }).sort((a, b) => b.roi - a.roi); // Sort by ROI descending
    
    return results;
}

// Run the analysis
const results = analyzeHandicapLevels();

console.log('🏆 HANDICAP LEVEL PERFORMANCE RANKING (by ROI):');
console.log('='.repeat(80));

// Group by type for better analysis
const homeAdvantageLines = results.filter(r => r.type === 'Home Advantage');
const homeUnderdogLines = results.filter(r => r.type === 'Home Underdog');

console.log('🏠 HOME ADVANTAGE QUARTER HANDICAPS:');
console.log('Rank | Handicap    | ROI    | Win% | Bets | Avg Odds | Profit   | W-HW-HL-L');
console.log('-'.repeat(75));
homeAdvantageLines.forEach((result, index) => {
    const rank = (index + 1).toString().padStart(2);
    const handicap = result.handicap.padEnd(11);
    const roi = `${result.roi > 0 ? '+' : ''}${result.roi}%`.padStart(7);
    const winRate = `${result.winRate}%`.padStart(5);
    const bets = result.bets.toString().padStart(4);
    const avgOdds = result.avgOdds.toString().padStart(4);
    const profit = `$${result.totalProfit}`.padStart(8);
    const breakdown = `${result.wins}-${result.halfWins}-${result.halfLosses}-${result.losses}`;
    
    console.log(`${rank}   | ${handicap} | ${roi} | ${winRate} | ${bets} | ${avgOdds}    | ${profit} | ${breakdown}`);
});

console.log('\n🏃 HOME UNDERDOG QUARTER HANDICAPS:');
console.log('Rank | Handicap    | ROI    | Win% | Bets | Avg Odds | Profit   | W-HW-HL-L');
console.log('-'.repeat(75));
homeUnderdogLines.forEach((result, index) => {
    const rank = (index + 1).toString().padStart(2);
    const handicap = result.handicap.padEnd(11);
    const roi = `${result.roi > 0 ? '+' : ''}${result.roi}%`.padStart(7);
    const winRate = `${result.winRate}%`.padStart(5);
    const bets = result.bets.toString().padStart(4);
    const avgOdds = result.avgOdds.toString().padStart(4);
    const profit = `$${result.totalProfit}`.padStart(8);
    const breakdown = `${result.wins}-${result.halfWins}-${result.halfLosses}-${result.losses}`;
    
    console.log(`${rank}   | ${handicap} | ${roi} | ${winRate} | ${bets} | ${avgOdds}    | ${profit} | ${breakdown}`);
});

console.log('\n🔍 PATTERN ANALYSIS:');
console.log('='.repeat(60));

// Find best and worst performers
const bestPerformer = results[0];
const worstPerformer = results[results.length - 1];

console.log(`🏆 Best Performer: ${bestPerformer.handicap} (${bestPerformer.type})`);
console.log(`   ROI: ${bestPerformer.roi}%, Bets: ${bestPerformer.bets}, Avg Odds: ${bestPerformer.avgOdds}`);

console.log(`🚩 Worst Performer: ${worstPerformer.handicap} (${worstPerformer.type})`);
console.log(`   ROI: ${worstPerformer.roi}%, Bets: ${worstPerformer.bets}, Avg Odds: ${worstPerformer.avgOdds}`);

// Analyze profitability patterns
const profitableLines = results.filter(r => r.roi > 0);
const losingLines = results.filter(r => r.roi <= 0);

console.log(`\n📈 Profitable Lines: ${profitableLines.length}/${results.length}`);
console.log(`📉 Losing Lines: ${losingLines.length}/${results.length}`);

// Check for patterns by handicap magnitude
console.log('\n🎯 STRATEGIC INSIGHTS:');
const homeAdvAvgROI = homeAdvantageLines.reduce((sum, r) => sum + r.roi, 0) / homeAdvantageLines.length;
const homeUndAvgROI = homeUnderdogLines.reduce((sum, r) => sum + r.roi, 0) / homeUnderdogLines.length;

console.log(`🏠 Home Advantage Average ROI: ${homeAdvAvgROI.toFixed(2)}%`);
console.log(`🏃 Home Underdog Average ROI: ${homeUndAvgROI.toFixed(2)}%`);

if (homeUndAvgROI > homeAdvAvgROI) {
    console.log('✅ Home Underdog quarters are MORE profitable on average!');
} else {
    console.log('✅ Home Advantage quarters are MORE profitable on average!');
}

console.log('\n✅ Handicap level breakdown analysis complete!'); 