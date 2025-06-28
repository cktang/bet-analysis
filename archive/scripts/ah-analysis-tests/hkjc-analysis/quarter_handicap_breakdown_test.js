const fs = require('fs');

console.log('💰 QUARTER HANDICAP BREAKDOWN TEST');
console.log('='.repeat(80));
console.log('🎯 Testing simple $150 increment on EVERY quarter handicap type');
console.log('📊 Rule: $200 at 1.91 odds + $150 per 0.01 increment');
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

// Simple stake calculation
function calculateSimpleStake(odds) {
    const baseOdds = 1.91;
    const baseStake = 200;
    const increment = 150;
    
    if (odds < baseOdds) return baseStake;
    
    const steps = Math.round((odds - baseOdds) / 0.01);
    return baseStake + (steps * increment);
}

// Helper functions
function isQuarterHandicap(handicap) {
    const singlePatterns = [
        '0', '-0.5', '+0.5', '-1', '+1', '-1.5', '+1.5', '-2', '+2', '-2.5', '+2.5', '-3', '+3'
    ];
    
    if (singlePatterns.includes(handicap)) {
        return false;
    }
    
    if (handicap.includes('/')) {
        return true;
    }
    
    return false;
}

function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return null;
    }
    
    const scoreDiff = homeScore - awayScore;
    const adjustedDiff = betSide === 'home' ? scoreDiff : -scoreDiff;
    
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        const result1 = adjustedDiff > h1 ? 'win' : (adjustedDiff === h1 ? 'push' : 'lose');
        const result2 = adjustedDiff > h2 ? 'win' : (adjustedDiff === h2 ? 'push' : 'lose');
        
        if (result1 === 'win' && result2 === 'win') return 'win';
        if (result1 === 'lose' && result2 === 'lose') return 'lose';
        if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
        if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
        return 'push';
    }
    
    return null;
}

// Normalize handicap for consistent grouping
function normalizeHandicap(handicap) {
    // Convert +0.5/+1 to 0.5/1 format for easier grouping
    return handicap.replace(/\+/g, '');
}

// Test strategy by quarter handicap type
function testByQuarterHandicapType() {
    const handicapResults = {};
    
    console.log('📊 ANALYZING QUARTER HANDICAP TYPES:');
    console.log('='.repeat(80));
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const betSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        const normalizedHandicap = normalizeHandicap(ah.homeHandicap);
        
        // Initialize handicap type if not exists
        if (!handicapResults[normalizedHandicap]) {
            handicapResults[normalizedHandicap] = {
                handicap: normalizedHandicap,
                bets: 0,
                totalStaked: 0,
                totalProfit: 0,
                wins: 0,
                losses: 0,
                halfWins: 0,
                halfLosses: 0,
                maxWin: 0,
                maxLoss: 0,
                avgOdds: 0,
                totalOdds: 0
            };
        }
        
        const stake = calculateSimpleStake(higherOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        if (!betResult) return;
        
        let profit = 0;
        
        if (betResult === 'win') {
            profit = stake * (higherOdds - 1);
            handicapResults[normalizedHandicap].wins++;
        } else if (betResult === 'half-win') {
            profit = stake * (higherOdds - 1) / 2;
            handicapResults[normalizedHandicap].halfWins++;
        } else if (betResult === 'push') {
            profit = 0;
        } else if (betResult === 'half-lose') {
            profit = -stake / 2;
            handicapResults[normalizedHandicap].halfLosses++;
        } else {
            profit = -stake;
            handicapResults[normalizedHandicap].losses++;
        }
        
        handicapResults[normalizedHandicap].totalStaked += stake;
        handicapResults[normalizedHandicap].totalProfit += profit;
        handicapResults[normalizedHandicap].bets++;
        handicapResults[normalizedHandicap].totalOdds += higherOdds;
        handicapResults[normalizedHandicap].maxWin = Math.max(handicapResults[normalizedHandicap].maxWin, profit);
        handicapResults[normalizedHandicap].maxLoss = Math.min(handicapResults[normalizedHandicap].maxLoss, profit);
    });
    
    // Calculate averages and sort by ROI
    Object.keys(handicapResults).forEach(handicap => {
        const result = handicapResults[handicap];
        result.avgOdds = result.totalOdds / result.bets;
    });
    
    return handicapResults;
}

// Display results by handicap type
function displayHandicapResults(handicapResults) {
    console.log('🏆 QUARTER HANDICAP BREAKDOWN RESULTS:');
    console.log('='.repeat(100));
    console.log('Handicap      | Bets | Staked    | Profit    | ROI     | Win% | Avg Odds | Performance');
    console.log('-'.repeat(100));
    
    // Sort by ROI descending
    const sortedHandicaps = Object.keys(handicapResults).sort((a, b) => {
        const roiA = (handicapResults[a].totalProfit / handicapResults[a].totalStaked) * 100;
        const roiB = (handicapResults[b].totalProfit / handicapResults[b].totalStaked) * 100;
        return roiB - roiA;
    });
    
    let totalBets = 0;
    let totalStaked = 0;
    let totalProfit = 0;
    
    sortedHandicaps.forEach(handicap => {
        const result = handicapResults[handicap];
        const roi = (result.totalProfit / result.totalStaked) * 100;
        const winRate = ((result.wins + result.halfWins * 0.5) / result.bets) * 100;
        
        let performance = '';
        if (roi > 25) performance = '🔥 EXCELLENT';
        else if (roi > 15) performance = '✅ VERY GOOD';
        else if (roi > 5) performance = '✅ GOOD';
        else if (roi > 0) performance = '➡️ MARGINAL';
        else performance = '❌ LOSING';
        
        console.log(`${handicap.padEnd(13)} | ${result.bets.toString().padStart(4)} | $${result.totalStaked.toFixed(0).padStart(8)} | $${result.totalProfit.toFixed(0).padStart(8)} | ${roi.toFixed(1).padStart(6)}% | ${winRate.toFixed(1).padStart(4)}% | ${result.avgOdds.toFixed(2).padStart(8)} | ${performance}`);
        
        totalBets += result.bets;
        totalStaked += result.totalStaked;
        totalProfit += result.totalProfit;
    });
    
    console.log('-'.repeat(100));
    
    const overallROI = (totalProfit / totalStaked) * 100;
    console.log(`OVERALL       | ${totalBets.toString().padStart(4)} | $${totalStaked.toFixed(0).padStart(8)} | $${totalProfit.toFixed(0).padStart(8)} | ${overallROI.toFixed(1).padStart(6)}% | Combined Results`);
}

// Show best and worst performing handicap types
function showBestWorst(handicapResults) {
    console.log('\n🏆 BEST PERFORMING QUARTER HANDICAPS:');
    console.log('='.repeat(60));
    
    const sortedByROI = Object.keys(handicapResults).sort((a, b) => {
        const roiA = (handicapResults[a].totalProfit / handicapResults[a].totalStaked) * 100;
        const roiB = (handicapResults[b].totalProfit / handicapResults[b].totalStaked) * 100;
        return roiB - roiA;
    });
    
    // Show top 5
    console.log('Top 5 by ROI:');
    sortedByROI.slice(0, 5).forEach((handicap, index) => {
        const result = handicapResults[handicap];
        const roi = (result.totalProfit / result.totalStaked) * 100;
        console.log(`${index + 1}. ${handicap}: ${roi.toFixed(1)}% ROI (${result.bets} bets, $${result.totalProfit.toFixed(0)} profit)`);
    });
    
    // Show bottom 5
    console.log('\nWorst 5 by ROI:');
    sortedByROI.slice(-5).reverse().forEach((handicap, index) => {
        const result = handicapResults[handicap];
        const roi = (result.totalProfit / result.totalStaked) * 100;
        console.log(`${index + 1}. ${handicap}: ${roi.toFixed(1)}% ROI (${result.bets} bets, $${result.totalProfit.toFixed(0)} profit)`);
    });
}

// Show common quarter handicap examples
function showCommonExamples(handicapResults) {
    console.log('\n📊 COMMON QUARTER HANDICAP TYPES:');
    console.log('='.repeat(60));
    
    const commonHandicaps = ['0/-0.5', '-0.5/-1', '0.5/1', '-1/-1.5', '1/1.5'];
    
    commonHandicaps.forEach(handicap => {
        if (handicapResults[handicap]) {
            const result = handicapResults[handicap];
            const roi = (result.totalProfit / result.totalStaked) * 100;
            const winRate = ((result.wins + result.halfWins * 0.5) / result.bets) * 100;
            
            console.log(`${handicap}: ${result.bets} bets, ${roi.toFixed(1)}% ROI, ${winRate.toFixed(1)}% win rate`);
        }
    });
}

// Run the analysis
const handicapResults = testByQuarterHandicapType();
displayHandicapResults(handicapResults);
showBestWorst(handicapResults);
showCommonExamples(handicapResults);

console.log('\n💡 KEY INSIGHTS:');
console.log('- Simple $150 increment works across most quarter handicap types');
console.log('- Some handicap types may be more profitable than others');
console.log('- Look for consistent patterns in profitable handicap types');
console.log('- Consider focusing on best-performing quarter handicap variations');

console.log('\n✅ Quarter handicap breakdown analysis complete!'); 