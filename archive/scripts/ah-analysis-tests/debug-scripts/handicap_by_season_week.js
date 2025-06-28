const fs = require('fs');

console.log('📅 HANDICAP LEVEL BREAKDOWN BY SEASON WEEK');
console.log('='.repeat(80));
console.log('🎯 Analyzing handicap performance across different season periods');
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

// Define season periods
function getSeasonPeriod(week) {
    if (week >= 1 && week <= 8) return 'Early (1-8)';
    if (week >= 9 && week <= 16) return 'Mid-Early (9-16)';
    if (week >= 17 && week <= 24) return 'Mid-Late (17-24)';
    if (week >= 25 && week <= 38) return 'Late (25-38)';
    return 'Unknown';
}

// Detailed breakdown analysis by week
function analyzeHandicapsByWeek() {
    console.log('📊 ANALYZING HANDICAP PERFORMANCE BY SEASON PERIOD:');
    console.log('='.repeat(70));
    
    // Structure: [period][handicap][stats]
    const weeklyStats = {};
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        const fbref = match.preMatch?.fbref;
        
        if (!ah?.homeHandicap || !matchInfo || !fbref?.week) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        const isHomeAdvantage = homeHasAdvantage(ah.homeHandicap);
        const isHomeUnderdog = homeIsUnderdog(ah.homeHandicap);
        
        if (!isHomeAdvantage && !isHomeUnderdog) return; // Skip neutral
        
        const week = fbref.week;
        const period = getSeasonPeriod(week);
        const handicapLine = ah.homeHandicap;
        const handicapType = isHomeAdvantage ? 'Home Advantage' : 'Home Underdog';
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const higherOddsSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        
        const stake = calculateSimpleStake(higherOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, higherOddsSide);
        
        if (!betResult) return;
        
        // Initialize nested structure
        if (!weeklyStats[period]) weeklyStats[period] = {};
        if (!weeklyStats[period][handicapLine]) {
            weeklyStats[period][handicapLine] = {
                type: handicapType,
                bets: 0,
                totalStaked: 0,
                totalProfit: 0,
                wins: 0,
                halfWins: 0,
                losses: 0,
                halfLosses: 0,
                totalOdds: 0
            };
        }
        
        // Calculate profit
        let profit = 0;
        if (betResult === 'win') {
            profit = stake * (higherOdds - 1);
            weeklyStats[period][handicapLine].wins++;
        } else if (betResult === 'half-win') {
            profit = stake * (higherOdds - 1) / 2;
            weeklyStats[period][handicapLine].halfWins++;
        } else if (betResult === 'push') {
            profit = 0;
        } else if (betResult === 'half-lose') {
            profit = -stake / 2;
            weeklyStats[period][handicapLine].halfLosses++;
        } else {
            profit = -stake;
            weeklyStats[period][handicapLine].losses++;
        }
        
        // Update stats
        weeklyStats[period][handicapLine].bets++;
        weeklyStats[period][handicapLine].totalStaked += stake;
        weeklyStats[period][handicapLine].totalProfit += profit;
        weeklyStats[period][handicapLine].totalOdds += higherOdds;
    });
    
    return weeklyStats;
}

// Run the analysis
const weeklyResults = analyzeHandicapsByWeek();

// Display results for each period
const periods = ['Early (1-8)', 'Mid-Early (9-16)', 'Mid-Late (17-24)', 'Late (25-38)'];

periods.forEach(period => {
    if (!weeklyResults[period]) return;
    
    console.log(`\n📅 ${period.toUpperCase()} SEASON PERFORMANCE:`);
    console.log('='.repeat(70));
    
    // Convert to array and sort by ROI
    const handicaps = Object.entries(weeklyResults[period]).map(([handicap, stats]) => {
        const roi = stats.totalStaked > 0 ? ((stats.totalProfit / stats.totalStaked) * 100) : 0;
        const winRate = stats.bets > 0 ? (((stats.wins + stats.halfWins * 0.5) / stats.bets) * 100) : 0;
        const avgOdds = stats.bets > 0 ? (stats.totalOdds / stats.bets) : 0;
        
        return {
            handicap,
            type: stats.type,
            bets: stats.bets,
            roi: roi,
            winRate: winRate,
            avgOdds: avgOdds,
            totalStaked: Math.round(stats.totalStaked),
            totalProfit: Math.round(stats.totalProfit),
            wins: stats.wins,
            halfWins: stats.halfWins,
            losses: stats.losses,
            halfLosses: stats.halfLosses
        };
    }).sort((a, b) => b.roi - a.roi);
    
    // Group by advantage type
    const homeAdvantage = handicaps.filter(h => h.type === 'Home Advantage');
    const homeUnderdog = handicaps.filter(h => h.type === 'Home Underdog');
    
    if (homeAdvantage.length > 0) {
        console.log('\n🏠 HOME ADVANTAGE:');
        console.log('Handicap    | ROI    | Win% | Bets | Profit   | W-HW-HL-L');
        console.log('-'.repeat(55));
        homeAdvantage.forEach(h => {
            const handicap = h.handicap.padEnd(11);
            const roi = `${h.roi > 0 ? '+' : ''}${h.roi.toFixed(1)}%`.padStart(7);
            const winRate = `${h.winRate.toFixed(1)}%`.padStart(5);
            const bets = h.bets.toString().padStart(4);
            const profit = `$${h.totalProfit}`.padStart(8);
            const breakdown = `${h.wins}-${h.halfWins}-${h.halfLosses}-${h.losses}`;
            
            console.log(`${handicap} | ${roi} | ${winRate} | ${bets} | ${profit} | ${breakdown}`);
        });
    }
    
    if (homeUnderdog.length > 0) {
        console.log('\n🏃 HOME UNDERDOG:');
        console.log('Handicap    | ROI    | Win% | Bets | Profit   | W-HW-HL-L');
        console.log('-'.repeat(55));
        homeUnderdog.forEach(h => {
            const handicap = h.handicap.padEnd(11);
            const roi = `${h.roi > 0 ? '+' : ''}${h.roi.toFixed(1)}%`.padStart(7);
            const winRate = `${h.winRate.toFixed(1)}%`.padStart(5);
            const bets = h.bets.toString().padStart(4);
            const profit = `$${h.totalProfit}`.padStart(8);
            const breakdown = `${h.wins}-${h.halfWins}-${h.halfLosses}-${h.losses}`;
            
            console.log(`${handicap} | ${roi} | ${winRate} | ${bets} | ${profit} | ${breakdown}`);
        });
    }
});

// Summary analysis
console.log('\n🔍 SEASONAL PATTERN ANALYSIS:');
console.log('='.repeat(70));

// Calculate period averages
periods.forEach(period => {
    if (!weeklyResults[period]) return;
    
    const handicaps = Object.values(weeklyResults[period]);
    if (handicaps.length === 0) return;
    
    const totalBets = handicaps.reduce((sum, h) => sum + h.bets, 0);
    const totalStaked = handicaps.reduce((sum, h) => sum + h.totalStaked, 0);
    const totalProfit = handicaps.reduce((sum, h) => sum + h.totalProfit, 0);
    const avgROI = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
    
    console.log(`📅 ${period}: ${totalBets} bets, ${avgROI.toFixed(2)}% ROI, $${Math.round(totalProfit)} profit`);
});

console.log('\n✅ Weekly handicap analysis complete!'); 