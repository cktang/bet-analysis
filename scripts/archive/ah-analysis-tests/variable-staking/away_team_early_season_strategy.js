const fs = require('fs');
const path = require('path');

// Variable staking configuration (all away bets strategy)
const VARIABLE_STAKING_CONFIG = {
    baseOdds: 1.91,  // Original variable staking configuration
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

// Asian Handicap calculation function
function calculateAHResult(homeScore, awayScore, handicapLine, betSide) {
    const [homeHandicap, awayHandicap] = handicapLine.split('/').map(h => parseFloat(h));
    
    // Apply handicap to home team score
    const adjustedHomeScore = homeScore + homeHandicap;
    
    if (betSide === 'home') {
        if (adjustedHomeScore > awayScore) return 'Win';
        if (adjustedHomeScore < awayScore) return 'Loss';
        
        // Handle quarter handicap ties
        if (handicapLine.includes('/')) {
            const secondHandicap = awayHandicap;
            const secondAdjustedScore = homeScore + secondHandicap;
            if (secondAdjustedScore > awayScore) return 'Half Win';
            if (secondAdjustedScore < awayScore) return 'Half Loss';
        }
        return 'Push';
    } else {
        // Away bet
        if (adjustedHomeScore < awayScore) return 'Win';
        if (adjustedHomeScore > awayScore) return 'Loss';
        
        if (handicapLine.includes('/')) {
            const secondHandicap = awayHandicap;
            const secondAdjustedScore = homeScore + secondHandicap;
            if (secondAdjustedScore < awayScore) return 'Half Win';
            if (secondAdjustedScore > awayScore) return 'Half Loss';
        }
        return 'Push';
    }
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

async function testAwayTeamEarlySeasonStrategy() {
    console.log('🛫⚡ ALL AWAY TEAM EARLY SEASON STRATEGY');
    console.log('=======================================');
    console.log('Strategy: Bet ALL away teams regardless of odds comparison'); 
    console.log('Time Filter: Before Week 7 (Weeks 1-6 only)');
    console.log('Hypothesis: ALL away teams undervalued in early season quarter handicaps\n');
    
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
        
        // Filter for early season quarter handicaps - ALL away teams
        const targetMatches = allMatches.filter(match => {
            const week = getSeasonWeek(match);
            const hasQuarterHandicap = match.match?.asianHandicapOdds?.homeHandicap && 
                                     isQuarterHandicap(match.match.asianHandicapOdds.homeHandicap);
            const hasOdds = match.match?.asianHandicapOdds?.homeOdds && 
                           match.match?.asianHandicapOdds?.awayOdds;
            const earlyWeek = week !== null && week >= 1 && week <= 6;
            
            return hasQuarterHandicap && hasOdds && earlyWeek;
        });
        
        console.log(`🎯 Target matches (ALL away teams, Weeks 1-6, Quarter handicaps): ${targetMatches.length}`);
        
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
        
        // Process each target match
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
        
        console.log('\n🎯 AWAY TEAM EARLY SEASON RESULTS:');
        console.log('=================================');
        console.log(`📊 Total Bets: ${totalBets}`);
        console.log(`💰 Total Staked: $${totalStaked.toLocaleString()}`);
        console.log(`📈 Total Profit: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`);
        console.log(`🎪 ROI: ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}%`);
        console.log(`✅ Win Rate: ${winRate.toFixed(1)}% (${totalWins}W-${totalLosses}L-${totalPushes}P)`);
        
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
        
        // Show individual matches
        console.log('\n🔍 DETAILED MATCH BREAKDOWN:');
        console.log('============================');
        
        for (let week = 1; week <= 6; week++) {
            const stats = weeklyStats[week];
            if (stats.matches.length === 0) continue;
            
            console.log(`\n📅 WEEK ${week}:`);
            stats.matches.forEach((match, index) => {
                const sign = parseFloat(match.profit) >= 0 ? '+' : '';
                console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} ${match.homeScore}-${match.awayScore}`);
                console.log(`   Away handicap: ${match.handicap} @ ${match.odds} | Stake: $${match.betSize} | ${match.outcome} | ${sign}$${match.profit}`);
            });
        }
        
        // Strategy assessment
        console.log('\n📈 STRATEGY ASSESSMENT:');
        console.log('=======================');
        
        if (totalROI > 10) {
            console.log('🚀 EXCELLENT: Very strong performance! Consider increasing allocation.');
        } else if (totalROI > 5) {
            console.log('✅ GOOD: Solid positive returns. Strategy shows promise.');
        } else if (totalROI > 0) {
            console.log('👍 POSITIVE: Slight edge detected. Monitor performance.');
        } else if (totalROI > -5) {
            console.log('⚠️  MARGINAL: Close to break-even. Needs more data or refinement.');
        } else {
            console.log('❌ POOR: Significant losses. Strategy may need major revision.');
        }
        
        console.log(`\nSample size: ${totalBets} bets ${totalBets < 30 ? '(⚠️  Small sample)' : '(✅ Adequate sample)'}`);
        
        // Compare to baseline expectation
        const avgOdds = targetMatches.reduce((sum, match) => sum + match.match.asianHandicapOdds.awayOdds, 0) / targetMatches.length;
        const impliedWinRate = (1 / avgOdds) * 100;
        const expectedROI = (winRate / 100) * (avgOdds - 1) * 100 - ((100 - winRate) / 100) * 100;
        
        console.log(`\n🧮 STATISTICAL COMPARISON:`);
        console.log(`Average Odds: ${avgOdds.toFixed(2)}`);
        console.log(`Implied Win Rate: ${impliedWinRate.toFixed(1)}%`);
        console.log(`Actual Win Rate: ${winRate.toFixed(1)}%`);
        console.log(`Expected ROI: ${expectedROI >= 0 ? '+' : ''}${expectedROI.toFixed(2)}%`);
        console.log(`Actual ROI: ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}%`);
        console.log(`Edge: ${(totalROI - expectedROI) >= 0 ? '+' : ''}${(totalROI - expectedROI).toFixed(2)}%`);
        
        // Save results
                 const results = {
             summary: {
                 strategy: 'ALL Away Team Early Season (Weeks 1-6)',
                 filter: 'Quarter handicaps, ALL away teams (regardless of odds)',
                totalBets,
                totalStaked: totalStaked.toFixed(2),
                totalProfit: totalProfit.toFixed(2),
                totalROI: totalROI.toFixed(2),
                winRate: winRate.toFixed(2),
                avgOdds: avgOdds.toFixed(2),
                generatedAt: new Date().toISOString()
            },
            weeklyBreakdown: weeklyStats,
            allMatches: targetMatches.map(match => ({
                week: getSeasonWeek(match),
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                score: `${match.match.homeScore}-${match.match.awayScore}`,
                awayHandicap: match.match.asianHandicapOdds.awayHandicap,
                awayOdds: match.match.asianHandicapOdds.awayOdds,
                homeOdds: match.match.asianHandicapOdds.homeOdds
            }))
        };
        
                 const outputPath = path.join(__dirname, 'all_away_team_early_season_variable_stake_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`\n💾 Results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Run the away team early season analysis
testAwayTeamEarlySeasonStrategy(); 