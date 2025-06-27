const fs = require('fs');

console.log('📈 QUARTER HANDICAP ODDS GRADIENT ANALYSIS');
console.log('='.repeat(60));
console.log('🔍 Investigating: Lower odds = Win less | Higher odds = Win more');
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

// Define odds ranges for systematic analysis
const oddsRanges = [
    { min: 1.00, max: 1.50, label: "1.00-1.50 (Super Favorites)" },
    { min: 1.50, max: 1.60, label: "1.50-1.60 (Strong Favorites)" }, 
    { min: 1.60, max: 1.70, label: "1.60-1.70 (Favorites)" },
    { min: 1.70, max: 1.80, label: "1.70-1.80 (Mild Favorites)" },
    { min: 1.80, max: 1.90, label: "1.80-1.90 (Slight Favorites)" },
    { min: 1.90, max: 2.00, label: "1.90-2.00 (Near Even)" },
    { min: 2.00, max: 2.20, label: "2.00-2.20 (Slight Underdogs)" },
    { min: 2.20, max: 2.50, label: "2.20-2.50 (Underdogs)" },
    { min: 2.50, max: 3.00, label: "2.50-3.00 (Strong Underdogs)" },
    { min: 3.00, max: 10.0, label: "3.00+ (Long Shots)" }
];

function analyzeOddsRange(minOdds, maxOdds) {
    const quarterCases = [];
    const simpleCases = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo || !ah.homeOdds || !ah.awayOdds) return;
        
        const isQuarter = ah.homeHandicap.includes('/');
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        
        // Check if either side falls in our odds range
        const homeInRange = homeOdds >= minOdds && homeOdds < maxOdds;
        const awayInRange = awayOdds >= minOdds && awayOdds < maxOdds;
        
        if (homeInRange || awayInRange) {
            // Calculate AH result
            let handicapValues = [];
            if (ah.homeHandicap.includes('/')) {
                handicapValues = ah.homeHandicap.split('/').map(h => parseFloat(h));
            } else {
                handicapValues = [parseFloat(ah.homeHandicap)];
            }
            
            const avgHandicap = handicapValues.reduce((a, b) => a + b) / handicapValues.length;
            const adjustedHomeScore = matchInfo.homeScore + avgHandicap;
            
            let ahWinner = 'draw';
            if (adjustedHomeScore > matchInfo.awayScore) ahWinner = 'home';
            if (adjustedHomeScore < matchInfo.awayScore) ahWinner = 'away';
            
            const caseData = {
                homeTeam: matchInfo.homeTeam,
                awayTeam: matchInfo.awayTeam,
                homeScore: matchInfo.homeScore,
                awayScore: matchInfo.awayScore,
                handicap: ah.homeHandicap,
                homeOdds: homeOdds,
                awayOdds: awayOdds,
                ahWinner: ahWinner,
                homeInRange: homeInRange,
                awayInRange: awayInRange,
                week: match.preMatch?.fbref?.week || 'Unknown'
            };
            
            if (isQuarter) {
                quarterCases.push(caseData);
            } else {
                simpleCases.push(caseData);
            }
        }
    });
    
    return { quarterCases, simpleCases };
}

function calculateRangeStats(cases, rangeName) {
    if (cases.length === 0) return null;
    
    let homeRangeBets = 0, homeRangeWins = 0, homeRangeProfit = 0;
    let awayRangeBets = 0, awayRangeWins = 0, awayRangeProfit = 0;
    
    cases.forEach(case_ => {
        const betAmount = 100;
        
        // Home bets (when home odds in range)
        if (case_.homeInRange) {
            homeRangeBets++;
            if (case_.ahWinner === 'home') {
                homeRangeWins++;
                homeRangeProfit += betAmount * (case_.homeOdds - 1);
            } else if (case_.ahWinner === 'draw') {
                homeRangeWins += 0.5; // Quarter handicap half-win
                homeRangeProfit += (betAmount * (case_.homeOdds - 1)) / 2;
            } else {
                homeRangeProfit -= betAmount;
            }
        }
        
        // Away bets (when away odds in range)
        if (case_.awayInRange) {
            awayRangeBets++;
            if (case_.ahWinner === 'away') {
                awayRangeWins++;
                awayRangeProfit += betAmount * (case_.awayOdds - 1);
            } else if (case_.ahWinner === 'draw') {
                awayRangeWins += 0.5; // Quarter handicap half-win
                awayRangeProfit += (betAmount * (case_.awayOdds - 1)) / 2;
            } else {
                awayRangeProfit -= betAmount;
            }
        }
    });
    
    const homeWinRate = homeRangeBets > 0 ? (homeRangeWins / homeRangeBets * 100) : 0;
    const awayWinRate = awayRangeBets > 0 ? (awayRangeWins / awayRangeBets * 100) : 0;
    const homeROI = homeRangeBets > 0 ? (homeRangeProfit / (homeRangeBets * 100) * 100) : 0;
    const awayROI = awayRangeBets > 0 ? (awayRangeProfit / (awayRangeBets * 100) * 100) : 0;
    
    const avgHomeOdds = homeRangeBets > 0 ? 
        cases.filter(c => c.homeInRange).reduce((sum, c) => sum + c.homeOdds, 0) / homeRangeBets : 0;
    const avgAwayOdds = awayRangeBets > 0 ? 
        cases.filter(c => c.awayInRange).reduce((sum, c) => sum + c.awayOdds, 0) / awayRangeBets : 0;
    
    return {
        totalCases: cases.length,
        homeStats: {
            bets: homeRangeBets,
            wins: homeRangeWins,
            winRate: homeWinRate,
            avgOdds: avgHomeOdds,
            impliedProb: avgHomeOdds > 0 ? (1 / avgHomeOdds * 100) : 0,
            roi: homeROI,
            performanceGap: homeWinRate - (avgHomeOdds > 0 ? (1 / avgHomeOdds * 100) : 0)
        },
        awayStats: {
            bets: awayRangeBets,
            wins: awayRangeWins,
            winRate: awayWinRate,
            avgOdds: avgAwayOdds,
            impliedProb: avgAwayOdds > 0 ? (1 / avgAwayOdds * 100) : 0,
            roi: awayROI,
            performanceGap: awayWinRate - (avgAwayOdds > 0 ? (1 / avgAwayOdds * 100) : 0)
        }
    };
}

// Run analysis across all odds ranges
console.log('🎯 QUARTER HANDICAP ODDS GRADIENT ANALYSIS');
console.log('='.repeat(80));

const gradientResults = [];

oddsRanges.forEach(range => {
    console.log(`\n📊 ANALYZING: ${range.label}`);
    console.log('-'.repeat(60));
    
    const { quarterCases, simpleCases } = analyzeOddsRange(range.min, range.max);
    
    // Focus on quarter handicaps (where the trapping effect occurs)
    const quarterStats = calculateRangeStats(quarterCases, range.label);
    const simpleStats = calculateRangeStats(simpleCases, range.label);
    
    if (quarterStats && quarterStats.totalCases > 0) {
        console.log(`🎲 Quarter Handicaps: ${quarterStats.totalCases} cases`);
        
        if (quarterStats.homeStats.bets > 0) {
            console.log(`  🏠 Home bets (${quarterStats.homeStats.bets}):`);
            console.log(`     Win Rate: ${quarterStats.homeStats.winRate.toFixed(1)}% | Expected: ${quarterStats.homeStats.impliedProb.toFixed(1)}% | Gap: ${quarterStats.homeStats.performanceGap.toFixed(1)}%`);
            console.log(`     ROI: ${quarterStats.homeStats.roi.toFixed(1)}% | Avg Odds: ${quarterStats.homeStats.avgOdds.toFixed(2)}`);
        }
        
        if (quarterStats.awayStats.bets > 0) {
            console.log(`  ✈️  Away bets (${quarterStats.awayStats.bets}):`);
            console.log(`     Win Rate: ${quarterStats.awayStats.winRate.toFixed(1)}% | Expected: ${quarterStats.awayStats.impliedProb.toFixed(1)}% | Gap: ${quarterStats.awayStats.performanceGap.toFixed(1)}%`);
            console.log(`     ROI: ${quarterStats.awayStats.roi.toFixed(1)}% | Avg Odds: ${quarterStats.awayStats.avgOdds.toFixed(2)}`);
        }
        
        // Store for gradient analysis
        gradientResults.push({
            range: range.label,
            midPoint: (range.min + range.max) / 2,
            quarterStats: quarterStats,
            simpleStats: simpleStats
        });
    } else {
        console.log(`❌ No quarter handicap cases in this range`);
    }
    
    if (simpleStats && simpleStats.totalCases > 5) {
        console.log(`🔵 Simple Handicaps: ${simpleStats.totalCases} cases (comparison)`);
        // Brief comparison stats if needed
    }
});

// GRADIENT ANALYSIS SUMMARY
console.log('\n\n🎯 GRADIENT PATTERN ANALYSIS');
console.log('='.repeat(80));
console.log('Theory: Lower odds should win LESS than expected, Higher odds should win MORE');
console.log('');

console.log('📈 PERFORMANCE GAP BY ODDS RANGE (Quarter Handicaps Only):');
console.log('-'.repeat(80));
console.log('Range                    | Avg Odds | Win% | Expected% | Gap% | ROI% | Sample');
console.log('-'.repeat(80));

gradientResults.forEach(result => {
    const stats = result.quarterStats;
    if (!stats) return;
    
    // Combine home and away stats for overall trend
    const totalBets = stats.homeStats.bets + stats.awayStats.bets;
    const totalWins = stats.homeStats.wins + stats.awayStats.wins;
    const totalProfit = (stats.homeStats.roi * stats.homeStats.bets + stats.awayStats.roi * stats.awayStats.bets) / 100;
    
    if (totalBets > 0) {
        const avgWinRate = (totalWins / totalBets * 100);
        const avgOdds = (stats.homeStats.avgOdds * stats.homeStats.bets + stats.awayStats.avgOdds * stats.awayStats.bets) / totalBets;
        const expectedWinRate = (1 / avgOdds * 100);
        const gap = avgWinRate - expectedWinRate;
        const roi = (totalProfit / totalBets);
        
        console.log(`${result.range.padEnd(24)} | ${avgOdds.toFixed(2).padStart(8)} | ${avgWinRate.toFixed(1).padStart(4)}% | ${expectedWinRate.toFixed(1).padStart(9)}% | ${gap.toFixed(1).padStart(4)}% | ${roi.toFixed(1).padStart(4)}% | ${totalBets.toString().padStart(6)}`);
    }
});

console.log('\n🔍 KEY INSIGHTS:');
console.log('• Negative gaps = Teams win LESS than odds suggest (overvalued)');
console.log('• Positive gaps = Teams win MORE than odds suggest (undervalued)');
console.log('• Look for systematic pattern across odds ranges');
console.log('• Quarter handicaps show different patterns than simple handicaps');

console.log('\n✅ Analysis complete! Check for inverse correlation between odds and performance.'); 