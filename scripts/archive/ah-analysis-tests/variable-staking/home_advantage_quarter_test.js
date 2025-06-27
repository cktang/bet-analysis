const fs = require('fs');

console.log('🏠 HOME ADVANTAGE QUARTER HANDICAP TEST');
console.log('='.repeat(80));
console.log('🎯 Filter: Only quarter handicaps where HOME has advantage (negative handicaps)');
console.log('📊 Strategy: $200 at 1.91 odds + $150 per 0.01 increment');
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

console.log(`📊 Total matches in database: ${allMatches.length}`);

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

// Check if home team has advantage (negative handicap)
function homeHasAdvantage(handicap) {
    // Home advantage means home team is giving handicaps (negative values)
    // Examples: -0.5/-1, -1/-1.5, -1.5/-2, etc.
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        // Both parts should be negative for home advantage
        return h1 < 0 && h2 < 0;
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

// Filter and test home advantage quarter handicaps
function testHomeAdvantageQuarters() {
    console.log('🔍 FILTERING HOME ADVANTAGE QUARTER HANDICAPS:');
    console.log('='.repeat(80));
    
    let totalQuarterHandicaps = 0;
    let homeAdvantageQuarters = 0;
    
    const results = {
        bets: 0,
        totalStaked: 0,
        totalProfit: 0,
        wins: 0,
        losses: 0,
        halfWins: 0,
        halfLosses: 0,
        maxWin: 0,
        maxLoss: 0,
        bigWins: 0,
        bigLosses: 0,
        handicapTypes: {}
    };
    
    const filteredMatches = [];
    let sampleCount = 0;
    
    console.log('Sample filtered matches:');
    console.log('Match                         | Handicap   | Home | Away | Higher | Bet Side | Result');
    console.log('-'.repeat(85));
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        
        // Count all quarter handicaps
        if (isQuarterHandicap(ah.homeHandicap)) {
            totalQuarterHandicaps++;
        }
        
        // Filter for home advantage quarter handicaps
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!homeHasAdvantage(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        homeAdvantageQuarters++;
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const betSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        
        filteredMatches.push({
            match: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
            handicap: ah.homeHandicap,
            homeOdds: ah.homeOdds,
            awayOdds: ah.awayOdds,
            higherOdds: higherOdds,
            betSide: betSide,
            homeScore: matchInfo.homeScore,
            awayScore: matchInfo.awayScore
        });
        
        // Track handicap types
        if (!results.handicapTypes[ah.homeHandicap]) {
            results.handicapTypes[ah.homeHandicap] = 0;
        }
        results.handicapTypes[ah.homeHandicap]++;
        
        const stake = calculateSimpleStake(higherOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSide);
        
        if (!betResult) return;
        
        let profit = 0;
        let resultCode = '';
        
        if (betResult === 'win') {
            profit = stake * (higherOdds - 1);
            results.wins++;
            resultCode = 'WIN';
        } else if (betResult === 'half-win') {
            profit = stake * (higherOdds - 1) / 2;
            results.halfWins++;
            resultCode = 'HALF-WIN';
        } else if (betResult === 'push') {
            profit = 0;
            resultCode = 'PUSH';
        } else if (betResult === 'half-lose') {
            profit = -stake / 2;
            results.halfLosses++;
            resultCode = 'HALF-LOSE';
        } else {
            profit = -stake;
            results.losses++;
            resultCode = 'LOSE';
        }
        
        results.totalStaked += stake;
        results.totalProfit += profit;
        results.bets++;
        
        if (profit > 1000) results.bigWins++;
        if (profit < -1000) results.bigLosses++;
        
        results.maxWin = Math.max(results.maxWin, profit);
        results.maxLoss = Math.min(results.maxLoss, profit);
        
        // Show first 15 examples
        if (sampleCount < 15) {
            const matchStr = `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`.slice(0, 28);
            console.log(`${matchStr.padEnd(29)} | ${ah.homeHandicap.padEnd(10)} | ${ah.homeOdds.toFixed(2)} | ${ah.awayOdds.toFixed(2)} | ${higherOdds.toFixed(2).padStart(6)} | ${betSide.padStart(8)} | ${resultCode.padEnd(8)}`);
            sampleCount++;
        }
    });
    
    console.log('-'.repeat(85));
    
    // Calculate metrics
    const roi = (results.totalProfit / results.totalStaked) * 100;
    const winRate = ((results.wins + results.halfWins * 0.5) / results.bets) * 100;
    const avgStake = results.totalStaked / results.bets;
    const percentageOfTotal = (homeAdvantageQuarters / allMatches.length) * 100;
    const percentageOfQuarters = (homeAdvantageQuarters / totalQuarterHandicaps) * 100;
    
    // Display results
    console.log('\n🏆 HOME ADVANTAGE QUARTER HANDICAP RESULTS:');
    console.log('='.repeat(80));
    console.log(`Total matches in database: ${allMatches.length}`);
    console.log(`Total quarter handicaps: ${totalQuarterHandicaps}`);
    console.log(`Home advantage quarters: ${homeAdvantageQuarters}`);
    console.log(`Matches with results: ${results.bets}`);
    console.log('');
    console.log('📊 PERFORMANCE METRICS:');
    console.log(`Total Profit: $${results.totalProfit.toFixed(0)}`);
    console.log(`Total Staked: $${results.totalStaked.toFixed(0)}`);
    console.log(`ROI: ${roi.toFixed(2)}%`);
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`Average Stake: $${avgStake.toFixed(0)}`);
    console.log(`Max Win: $${results.maxWin.toFixed(0)}`);
    console.log(`Max Loss: $${Math.abs(results.maxLoss).toFixed(0)}`);
    console.log(`Big Wins (>$1000): ${results.bigWins}`);
    console.log(`Big Losses (>$1000): ${results.bigLosses}`);
    console.log('');
    console.log('📈 COVERAGE METRICS:');
    console.log(`Percentage of all matches: ${percentageOfTotal.toFixed(1)}%`);
    console.log(`Percentage of quarter handicaps: ${percentageOfQuarters.toFixed(1)}%`);
    
    // Show handicap type breakdown
    console.log('\n🎯 HOME ADVANTAGE HANDICAP TYPES:');
    console.log('='.repeat(50));
    const sortedHandicaps = Object.keys(results.handicapTypes).sort((a, b) => results.handicapTypes[b] - results.handicapTypes[a]);
    
    sortedHandicaps.forEach(handicap => {
        const count = results.handicapTypes[handicap];
        const percentage = (count / results.bets) * 100;
        console.log(`${handicap.padEnd(12)}: ${count.toString().padStart(3)} matches (${percentage.toFixed(1)}%)`);
    });
    
    // Performance assessment
    console.log('\n💡 STRATEGY ASSESSMENT:');
    console.log('='.repeat(50));
    
    if (roi > 30) {
        console.log('🔥 EXCEPTIONAL PERFORMANCE!');
        console.log('✅ Home advantage filter creates outstanding edge');
    } else if (roi > 20) {
        console.log('🚀 EXCELLENT PERFORMANCE!');
        console.log('✅ Home advantage filter significantly improves results');
    } else if (roi > 10) {
        console.log('✅ VERY GOOD PERFORMANCE');
        console.log('✅ Home advantage filter creates solid edge');
    } else if (roi > 0) {
        console.log('➡️ MARGINAL IMPROVEMENT');
        console.log('⚠️ Home advantage filter helps but edge is small');
    } else {
        console.log('❌ FILTER NOT EFFECTIVE');
        console.log('❌ Home advantage filter does not create edge');
    }
    
    console.log(`\n📋 SUMMARY:`);
    console.log(`- Filtered to ${results.bets} home advantage quarter handicap matches`);
    console.log(`- Represents ${percentageOfTotal.toFixed(1)}% of all matches`);
    console.log(`- Generated ${roi.toFixed(2)}% ROI with $${results.totalProfit.toFixed(0)} profit`);
    console.log(`- ${winRate.toFixed(1)}% win rate with $${avgStake.toFixed(0)} average stake`);
    
    return results;
}

// Run the test
testHomeAdvantageQuarters();

console.log('\n✅ Home advantage quarter handicap test complete!'); 