const fs = require('fs');
const path = require('path');

// Variable staking configuration (optimized strategy)
const VARIABLE_STAKING_CONFIG = {
    baseOdds: 1.91,
    baseStake: 200,
    increment: 150,
    maxStake: 10000
};

function calculateVariableStake(odds) {
    const baseOdds = VARIABLE_STAKING_CONFIG.baseOdds;
    const baseStake = VARIABLE_STAKING_CONFIG.baseStake;
    const increment = VARIABLE_STAKING_CONFIG.increment;
    const maxStake = VARIABLE_STAKING_CONFIG.maxStake;
    
    if (odds <= baseOdds) {
        return baseStake;
    }
    
    const oddsStep = Math.floor((odds - baseOdds) * 100);
    const stake = baseStake + (oddsStep * increment);
    
    return Math.min(stake, maxStake);
}

// Asian Handicap calculation function for AWAY BETS
function calculateAHResult(homeScore, awayScore, handicapLine, betSide = 'away') {
    const [homeHandicap, awayHandicap] = handicapLine.split('/').map(h => parseFloat(h));
    
    // Apply handicap to home team score
    const adjustedHomeScore = homeScore + homeHandicap;
    
    // We're ALWAYS betting away team
    if (adjustedHomeScore < awayScore) return 'Win';
    if (adjustedHomeScore > awayScore) return 'Loss';
    
    // Handle quarter handicap ties
    if (handicapLine.includes('/')) {
        const secondHandicap = awayHandicap;
        const secondAdjustedScore = homeScore + secondHandicap;
        if (secondAdjustedScore < awayScore) return 'Half Win';
        if (secondAdjustedScore > awayScore) return 'Half Loss';
    }
    return 'Push';
}

function calculateProfit(betSize, odds, outcome) {
    switch (outcome) {
        case 'Win':
            return betSize * (odds - 1);
        case 'Half Win':
            return betSize * (odds - 1) / 2;
        case 'Loss':
            return -betSize;
        case 'Half Loss':
            return -betSize / 2;
        case 'Push':
            return 0;
        default:
            return 0;
    }
}

function isQuarterHandicap(handicapLine) {
    return handicapLine.includes('/');
}

function getSeasonWeek(match) {
    if (match.fbref && match.fbref.week) {
        return parseInt(match.fbref.week);
    }
    return null;
}

async function testFixedAwayTeamStrategy() {
    console.log('🛫🔧 FIXED AWAY TEAM EARLY SEASON STRATEGY');
    console.log('==========================================');
    console.log('Strategy: ALWAYS bet AWAY teams in early season quarter handicaps');
    console.log('Time Filter: Before Week 7 (Weeks 1-6 only)');
    console.log('BET SIDE: ALWAYS Away (like Single_earlySeasonConfusion)');
    console.log('Hypothesis: Away teams systematically undervalued in early season\n');
    
    try {
        // Load processed data
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        let allMatches = [];
        
        for (const season of seasons) {
            const dataPath = path.join(__dirname, '../../data/processed', `year-${season}.json`);
            console.log(`Loading ${season}...`);
            const seasonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            
            if (seasonData.matches) {
                const matchesArray = Object.values(seasonData.matches);
                console.log(`${season} matches found:`, matchesArray.length);
                allMatches = allMatches.concat(matchesArray);
            }
        }
        
        console.log(`📊 Total matches loaded: ${allMatches.length}`);
        
        // Filter for early season quarter handicaps - ALL matches (bet away regardless)
        const targetMatches = allMatches.filter(match => {
            const week = getSeasonWeek(match);
            const hasQuarterHandicap = match.match?.asianHandicapOdds?.homeHandicap && 
                                     isQuarterHandicap(match.match.asianHandicapOdds.homeHandicap);
            const hasOdds = match.match?.asianHandicapOdds?.homeOdds && 
                           match.match?.asianHandicapOdds?.awayOdds;
            const earlyWeek = week !== null && week >= 1 && week <= 6;
            
            return hasQuarterHandicap && hasOdds && earlyWeek;
        });
        
        console.log(`🎯 Target matches (Early season quarter handicaps): ${targetMatches.length}`);
        
        if (targetMatches.length === 0) {
            console.log('❌ No matches found matching criteria');
            return;
        }
        
        // Weekly tracking
        const weeklyStats = {};
        for (let week = 1; week <= 6; week++) {
            weeklyStats[week] = {
                bets: 0,
                staked: 0,
                profit: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                matches: []
            };
        }
        
        let totalStaked = 0;
        let totalProfit = 0;
        let totalBets = 0;
        let totalWins = 0;
        let totalLosses = 0;
        let totalPushes = 0;
        
        // Process each target match - ALWAYS bet away team
        targetMatches.forEach(match => {
            const week = getSeasonWeek(match);
            const homeScore = match.match.homeScore;
            const awayScore = match.match.awayScore;
            const awayHandicap = match.match.asianHandicapOdds.awayHandicap;
            const awayOdds = match.match.asianHandicapOdds.awayOdds;
            
            const betSize = calculateVariableStake(awayOdds);
            const outcome = calculateAHResult(homeScore, awayScore, awayHandicap, 'away');
            const profit = calculateProfit(betSize, awayOdds, outcome);
            
            // Update weekly stats
            const weekStats = weeklyStats[week];
            weekStats.bets++;
            weekStats.staked += betSize;
            weekStats.profit += profit;
            weekStats.matches.push({
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homeScore,
                awayScore,
                handicap: awayHandicap,
                odds: awayOdds,
                betSize,
                outcome,
                profit: profit.toFixed(2)
            });
            
            if (outcome === 'Win' || outcome === 'Half Win') {
                weekStats.wins++;
                totalWins++;
            } else if (outcome === 'Loss' || outcome === 'Half Loss') {
                weekStats.losses++;
                totalLosses++;
            } else {
                weekStats.pushes++;
                totalPushes++;
            }
            
            // Update totals
            totalStaked += betSize;
            totalProfit += profit;
            totalBets++;
        });
        
        const totalROI = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        const winRate = totalBets > 0 ? ((totalWins / totalBets) * 100) : 0;
        
        console.log('\n🎯 FIXED AWAY TEAM STRATEGY RESULTS:');
        console.log('===================================');
        console.log(`📊 Total Bets: ${totalBets}`);
        console.log(`💰 Total Staked: $${totalStaked.toLocaleString()}`);
        console.log(`📈 Total Profit: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`);
        console.log(`🎪 ROI: ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}%`);
        console.log(`✅ Win Rate: ${winRate.toFixed(1)}% (${totalWins}W-${totalLosses}L-${totalPushes}P)`);
        
        // Compare with Single_earlySeasonConfusion target
        console.log('\n🎯 COMPARISON WITH TARGET:');
        console.log('==========================');
        console.log(`Single_earlySeasonConfusion TARGET: 26.82% ROI, $41,217 profit`);
        console.log(`Our FIXED strategy:                ${totalROI.toFixed(2)}% ROI, $${totalProfit.toFixed(0)} profit`);
        console.log(`Difference:                        ${(totalROI - 26.82).toFixed(2)}% ROI, $${(totalProfit - 41217).toFixed(0)} profit`);
        
        // Weekly breakdown
        console.log('\n📅 WEEKLY BREAKDOWN:');
        console.log('====================');
        console.log('Week | Bets | Staked    | Profit     | ROI      | Win Rate | Record  ');
        console.log('-----|------|-----------|------------|----------|----------|--------');
        
        for (let week = 1; week <= 6; week++) {
            const stats = weeklyStats[week];
            if (stats.bets === 0) continue;
            
            const weekROI = stats.staked > 0 ? ((stats.profit / stats.staked) * 100) : 0;
            const weekWinRate = stats.bets > 0 ? ((stats.wins / stats.bets) * 100) : 0;
            
            console.log(`${week.toString().padStart(4)} | ${stats.bets.toString().padStart(4)} | $${stats.staked.toLocaleString().padStart(8)} | ${stats.profit >= 0 ? '+' : ''}$${stats.profit.toFixed(0).padStart(7)} | ${weekROI >= 0 ? '+' : ''}${weekROI.toFixed(1).padStart(6)}% | ${weekWinRate.toFixed(1).padStart(7)}% | ${stats.wins}W-${stats.losses}L-${stats.pushes}P`);
        }
        
        // Compare few specific matches with Single_earlySeasonConfusion
        console.log('\n🔍 COMPARISON WITH SINGLE_EARLYSEASONCONFUSION:');
        console.log('==============================================');
        
        // Find Ipswich vs Aston Villa match
        const ipswichMatch = targetMatches.find(match => 
            match.match.homeTeam === 'Ipswich' && match.match.awayTeam === 'Aston Villa'
        );
        
        if (ipswichMatch) {
            const week = getSeasonWeek(ipswichMatch);
            const homeScore = ipswichMatch.match.homeScore;
            const awayScore = ipswichMatch.match.awayScore;
            const awayHandicap = ipswichMatch.match.asianHandicapOdds.awayHandicap;
            const awayOdds = ipswichMatch.match.awayOdds;
            
            const betSize = calculateVariableStake(awayOdds);
            const outcome = calculateAHResult(homeScore, awayScore, awayHandicap, 'away');
            const profit = calculateProfit(betSize, awayOdds, outcome);
            
            console.log(`📍 KEY MATCH: Ipswich vs Aston Villa (${homeScore}-${awayScore})`);
            console.log(`   Single_earlySeasonConfusion: +0.5/+1 @ 2.20 | $4550 stake | LOSS | -$4550`);
            console.log(`   Our FIXED strategy:          ${awayHandicap} @ ${awayOdds} | $${betSize} stake | ${outcome} | ${profit >= 0 ? '+' : ''}$${profit.toFixed(0)}`);
            console.log(`   This match difference: ${(profit - (-4550)).toFixed(0)} in our favor`);
        }
        
        // Strategy assessment
        console.log('\n📈 FINAL ASSESSMENT:');
        console.log('====================');
        
        if (Math.abs(totalROI - 26.82) < 2) {
            console.log('🎯 PERFECT MATCH: Strategy now matches Single_earlySeasonConfusion performance!');
        } else if (totalROI > 20) {
            console.log('🚀 EXCELLENT: Very strong performance! Strategy working correctly.');
        } else if (totalROI > 10) {
            console.log('✅ GOOD: Solid performance. Close to target.');
        } else {
            console.log('⚠️  Still gaps in performance. Need further investigation.');
        }
        
        // Save results
        const results = {
            summary: {
                strategy: 'FIXED Away Team Early Season (Weeks 1-6)',
                filter: 'Quarter handicaps, ALWAYS bet away team',
                totalBets,
                totalStaked: totalStaked.toFixed(2),
                totalProfit: totalProfit.toFixed(2),
                totalROI: totalROI.toFixed(2),
                winRate: winRate.toFixed(2),
                targetComparison: {
                    targetROI: 26.82,
                    targetProfit: 41217,
                    roiDifference: (totalROI - 26.82).toFixed(2),
                    profitDifference: (totalProfit - 41217).toFixed(2)
                },
                generatedAt: new Date().toISOString()
            },
            weeklyBreakdown: weeklyStats
        };
        
        const outputPath = path.join(__dirname, 'fixed_away_team_strategy_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`\n💾 Results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Run the fixed away team strategy
testFixedAwayTeamStrategy(); 