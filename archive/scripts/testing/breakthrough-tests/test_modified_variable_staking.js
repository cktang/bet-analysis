const fs = require('fs');
const path = require('path');

// Configuration comparison: Original vs Modified
const STAKING_CONFIGS = {
    original: {
        name: "Original Variable Staking",
        baseOdds: 1.91,
        baseStake: 200,
        increment: 150,
        maxStake: 10000
    },
    modified: {
        name: "Modified Variable Staking",
        baseOdds: 1.7,      // Earlier start point
        baseStake: 200,     // Same base
        increment: 75,      // Half the increment
        maxStake: 10000
    }
};

// Load data
const data2022 = JSON.parse(fs.readFileSync('./data/enhanced/year-2022-2023-enhanced.json', 'utf8'));  
const data2023 = JSON.parse(fs.readFileSync('./data/enhanced/year-2023-2024-enhanced.json', 'utf8'));
const data2024 = JSON.parse(fs.readFileSync('./data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

const allMatches = [
    ...Object.values(data2022.matches || {}),
    ...Object.values(data2023.matches || {}),
    ...Object.values(data2024.matches || {})
];

// Calculate variable stake based on configuration
function calculateVariableStake(odds, config) {
    const baseOdds = config.baseOdds;
    const baseStake = config.baseStake;
    const increment = config.increment;
    const maxStake = config.maxStake;
    
    if (odds <= baseOdds) {
        return baseStake;
    }
    
    const oddsStep = Math.floor((odds - baseOdds) * 100);
    const stake = baseStake + (oddsStep * increment);
    
    return Math.min(stake, maxStake);
}

// Calculate profit based on Asian Handicap outcome
function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    const goalDiff = homeScore - awayScore;
    const adjustedDiff = goalDiff + handicap;
    
    // For quarter handicaps, check if result is exactly 0.25 or -0.25 for half win/loss
    const isHalfResult = Math.abs(adjustedDiff) === 0.25;
    
    if (betSide === 'home') {
        if (adjustedDiff > 0) {
            return isHalfResult ? 'Half Win' : 'Win';
        } else if (adjustedDiff < 0) {
            return isHalfResult ? 'Half Loss' : 'Loss';
        } else {
            return 'Push';
        }
    } else {
        // Away bet (reverse the logic)
        if (adjustedDiff < 0) {
            return isHalfResult ? 'Half Win' : 'Win';
        } else if (adjustedDiff > 0) {
            return isHalfResult ? 'Half Loss' : 'Loss';
        } else {
            return 'Push';
        }
    }
}

function calculateProfit(stake, odds, outcome) {
    switch(outcome) {
        case 'Win': return stake * (odds - 1);
        case 'Loss': return -stake;
        case 'Push': return 0;
        case 'Half Win': return stake * (odds - 1) / 2;
        case 'Half Loss': return -stake / 2;
        default: return 0;
    }
}

// Test quarter handicap strategy (one of your successful strategies)
function testQuarterHandicapStrategy() {
    console.log('\n🎯 TESTING: Quarter Handicap Strategy (First 8 Weeks)');
    console.log('===================================================');
    
    const quarterHandicapMatches = allMatches.filter(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds || match.match?.asianHandicapOdds;
        const fbref = match.preMatch?.fbref || match.fbref;
        
        return ah && 
               ah.homeHandicap && 
               ah.homeHandicap.includes('/') && // Quarter handicaps contain '/'
               fbref && fbref.week <= 8; // First 8 weeks only
    });
    
    console.log(`Found ${quarterHandicapMatches.length} quarter handicap matches in first 8 weeks\n`);
    
    const results = {};
    
    Object.keys(STAKING_CONFIGS).forEach(configKey => {
        const config = STAKING_CONFIGS[configKey];
        let totalStaked = 0;
        let totalProfit = 0;
        let totalBets = 0;
        let wins = 0;
        let losses = 0;
        let pushes = 0;
        
        quarterHandicapMatches.forEach(match => {
            const matchData = match.preMatch?.match || match.match;
            const ah = match.preMatch?.match?.asianHandicapOdds || match.match?.asianHandicapOdds;
            
            if (!matchData || !ah) return;
            
            const homeScore = matchData.homeScore;
            const awayScore = matchData.awayScore;
            const homeOdds = ah.homeOdds;
            
            if (!homeOdds || homeOdds < 1.5 || typeof homeScore === 'undefined') return;
            
            // Parse quarter handicap (e.g., "0/-0.5" -> average = -0.25)
            let handicapValue = 0;
            if (ah.homeHandicap.includes('/')) {
                const parts = ah.homeHandicap.split('/').map(h => parseFloat(h));
                handicapValue = parts.reduce((a, b) => a + b) / parts.length;
            } else {
                handicapValue = parseFloat(ah.homeHandicap);
            }
            
            const betSize = calculateVariableStake(homeOdds, config);
            const outcome = calculateAHResult(homeScore, awayScore, handicapValue, 'home');
            const profit = calculateProfit(betSize, homeOdds, outcome);
            
            totalStaked += betSize;
            totalProfit += profit;
            totalBets++;
            
            if (outcome === 'Win' || outcome === 'Half Win') wins++;
            else if (outcome === 'Loss' || outcome === 'Half Loss') losses++;
            else pushes++;
        });
        
        const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        const winRate = totalBets > 0 ? ((wins / totalBets) * 100) : 0;
        
        results[configKey] = {
            config: config.name,
            totalBets,
            totalStaked,
            totalProfit,
            roi,
            winRate,
            wins,
            losses,
            pushes
        };
    });
    
    return results;
}

// Test away team strategy (another successful approach)
function testAwayTeamStrategy() {
    console.log('\n🚀 TESTING: Away Team Strategy (First 8 Weeks)');
    console.log('==============================================');
    
    const awayMatches = allMatches.filter(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds || match.match?.asianHandicapOdds;
        const fbref = match.preMatch?.fbref || match.fbref;
        
        return ah && 
               ah.awayOdds &&
               ah.awayOdds >= 1.8 &&
               fbref && fbref.week <= 8; // First 8 weeks only
    });
    
    console.log(`Found ${awayMatches.length} suitable away team matches in first 8 weeks\n`);
    
    const results = {};
    
    Object.keys(STAKING_CONFIGS).forEach(configKey => {
        const config = STAKING_CONFIGS[configKey];
        let totalStaked = 0;
        let totalProfit = 0;
        let totalBets = 0;
        let wins = 0;
        let losses = 0;
        let pushes = 0;
        
        awayMatches.forEach(match => {
            const matchData = match.preMatch?.match || match.match;
            const ah = match.preMatch?.match?.asianHandicapOdds || match.match?.asianHandicapOdds;
            
            if (!matchData || !ah) return;
            
            const homeScore = matchData.homeScore;
            const awayScore = matchData.awayScore;
            const awayOdds = ah.awayOdds;
            
            if (!awayOdds || typeof homeScore === 'undefined') return;
            
            // Parse handicap for away team calculation
            let handicapValue = 0;
            if (ah.homeHandicap.includes('/')) {
                const parts = ah.homeHandicap.split('/').map(h => parseFloat(h));
                handicapValue = parts.reduce((a, b) => a + b) / parts.length;
            } else {
                handicapValue = parseFloat(ah.homeHandicap);
            }
            
            const betSize = calculateVariableStake(awayOdds, config);
            const outcome = calculateAHResult(homeScore, awayScore, handicapValue, 'away');
            const profit = calculateProfit(betSize, awayOdds, outcome);
            
            totalStaked += betSize;
            totalProfit += profit;
            totalBets++;
            
            if (outcome === 'Win' || outcome === 'Half Win') wins++;
            else if (outcome === 'Loss' || outcome === 'Half Loss') losses++;
            else pushes++;
        });
        
        const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        const winRate = totalBets > 0 ? ((wins / totalBets) * 100) : 0;
        
        results[configKey] = {
            config: config.name,
            totalBets,
            totalStaked,
            totalProfit,
            roi,
            winRate,
            wins,
            losses,
            pushes
        };
    });
    
    return results;
}

// Display stake comparison table
function showStakeComparison() {
    console.log('\n📊 STAKE COMPARISON TABLE');
    console.log('=========================');
    console.log('Odds  | Original | Modified | Difference');
    console.log('------|----------|----------|----------');
    
    const testOdds = [1.6, 1.7, 1.8, 1.91, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5];
    
    testOdds.forEach(odds => {
        const originalStake = calculateVariableStake(odds, STAKING_CONFIGS.original);
        const modifiedStake = calculateVariableStake(odds, STAKING_CONFIGS.modified);
        const difference = modifiedStake - originalStake;
        const diffSign = difference >= 0 ? '+' : '';
        
        console.log(`${odds.toFixed(2).padStart(4)} | $${originalStake.toString().padStart(7)} | $${modifiedStake.toString().padStart(7)} | ${diffSign}$${difference}`);
    });
}

// Compare results function
function compareResults(strategy1Results, strategy2Results, strategyName) {
    console.log(`\n📈 ${strategyName.toUpperCase()} COMPARISON:`);
    console.log('='.repeat(strategyName.length + 15));
    
    Object.keys(strategy1Results).forEach(configKey => {
        const result = strategy1Results[configKey];
        console.log(`\n${result.config}:`);
        console.log(`  Total Bets: ${result.totalBets}`);
        console.log(`  Total Staked: $${result.totalStaked.toLocaleString()}`);
        console.log(`  Total Profit: $${result.totalProfit.toFixed(2)}`);
        console.log(`  ROI: ${result.roi.toFixed(2)}%`);
        console.log(`  Win Rate: ${result.winRate.toFixed(1)}%`);
        console.log(`  Record: ${result.wins}W-${result.losses}L-${result.pushes}P`);
    });
    
    // Calculate improvement
    const originalROI = strategy1Results.original.roi;
    const modifiedROI = strategy1Results.modified.roi;
    const roiDifference = modifiedROI - originalROI;
    const improvement = ((modifiedROI / originalROI) - 1) * 100;
    
    console.log(`\n💡 IMPACT:`);
    console.log(`  ROI Change: ${roiDifference >= 0 ? '+' : ''}${roiDifference.toFixed(2)}% (${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}% improvement)`);
    
    const originalProfit = strategy1Results.original.totalProfit;
    const modifiedProfit = strategy1Results.modified.totalProfit;
    const profitDifference = modifiedProfit - originalProfit;
    
    console.log(`  Profit Change: ${profitDifference >= 0 ? '+' : ''}$${profitDifference.toFixed(2)}`);
}

async function main() {
    console.log('🧪 VARIABLE STAKING PARAMETER COMPARISON TEST (FIRST 8 WEEKS)');
    console.log('=============================================================');
    console.log(`Original: Base=${STAKING_CONFIGS.original.baseOdds} odds, $${STAKING_CONFIGS.original.baseStake} stake, +$${STAKING_CONFIGS.original.increment}/0.01 odds`);
    console.log(`Modified: Base=${STAKING_CONFIGS.modified.baseOdds} odds, $${STAKING_CONFIGS.modified.baseStake} stake, +$${STAKING_CONFIGS.modified.increment}/0.01 odds`);
    
    showStakeComparison();
    
    // Test strategies
    const quarterResults = testQuarterHandicapStrategy();
    compareResults(quarterResults, null, "Quarter Handicap Strategy");
    
    const awayResults = testAwayTeamStrategy();
    compareResults(awayResults, null, "Away Team Strategy");
    
    // Summary
    console.log('\n🎯 OVERALL SUMMARY (FIRST 8 WEEKS FOCUS)');
    console.log('=========================================');
    console.log('The modified parameters (1.7 base odds, $75 increment) in early season:');
    console.log('1. Start betting earlier (at 1.7 odds vs 1.91 odds)');
    console.log('2. Increase stakes more gradually ($75 vs $150 per 0.01 odds)');
    console.log('3. Potentially capture more value from early season inefficiencies');
    console.log('4. Reduce risk exposure per odds step while maximizing early season edges');
}

main().catch(console.error); 