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

async function testHomeAwaySeparatedStrategy() {
    console.log('🏠🛫 HOME vs AWAY SEPARATED ANALYSIS');
    console.log('====================================');
    console.log('Strategy: Bet higher odds side, but separate Home vs Away performance');
    console.log('Question: Are there systematic differences when betting home vs away teams?\n');
    
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
        
        // Filter for quarter handicaps only
        const quarterHandicapMatches = allMatches.filter(match => {
            return match.match?.asianHandicapOdds?.homeHandicap && 
                   isQuarterHandicap(match.match.asianHandicapOdds.homeHandicap) &&
                   getSeasonWeek(match) !== null;
        });
        
        console.log(`🎯 Quarter handicap matches with week data: ${quarterHandicapMatches.length}`);
        
        // Separate tracking for home vs away bets
        const weeklyStats = {};
        for (let week = 1; week <= 38; week++) {
            weeklyStats[week] = {
                home: { bets: 0, staked: 0, profit: 0, wins: 0, losses: 0, pushes: 0 },
                away: { bets: 0, staked: 0, profit: 0, wins: 0, losses: 0, pushes: 0 },
                total: { bets: 0, staked: 0, profit: 0, wins: 0, losses: 0, pushes: 0 }
            };
        }
        
        let totalHomeStaked = 0, totalAwayStaked = 0;
        let totalHomeProfit = 0, totalAwayProfit = 0;
        let totalHomeBets = 0, totalAwayBets = 0;
        
        // Process each quarter handicap match
        quarterHandicapMatches.forEach(match => {
            const week = getSeasonWeek(match);
            if (week < 1 || week > 38) return;
            
            const homeScore = match.match.homeScore;
            const awayScore = match.match.awayScore;
            const homeHandicap = match.match.asianHandicapOdds.homeHandicap;
            const awayHandicap = match.match.asianHandicapOdds.awayHandicap;
            const homeOdds = match.match.asianHandicapOdds.homeOdds;
            const awayOdds = match.match.asianHandicapOdds.awayOdds;
            
            if (!homeOdds || !awayOdds) return;
            
            // Choose the HIGHER odds side
            let chosenSide, chosenOdds, chosenHandicap;
            if (homeOdds > awayOdds) {
                chosenSide = 'home';
                chosenOdds = homeOdds;
                chosenHandicap = homeHandicap;
            } else {
                chosenSide = 'away';
                chosenOdds = awayOdds;
                chosenHandicap = awayHandicap;
            }
            
            const betSize = calculateVariableStake(chosenOdds);
            const outcome = calculateAHResult(homeScore, awayScore, chosenHandicap, chosenSide);
            const profit = calculateProfit(betSize, chosenOdds, outcome);
            
            // Update weekly stats based on which side we bet
            const sideStats = weeklyStats[week][chosenSide];
            const totalStats = weeklyStats[week].total;
            
            sideStats.bets++;
            sideStats.staked += betSize;
            sideStats.profit += profit;
            
            totalStats.bets++;
            totalStats.staked += betSize;
            totalStats.profit += profit;
            
            if (outcome === 'Win' || outcome === 'Half Win') {
                sideStats.wins++;
                totalStats.wins++;
            } else if (outcome === 'Loss' || outcome === 'Half Loss') {
                sideStats.losses++;
                totalStats.losses++;
            } else {
                sideStats.pushes++;
                totalStats.pushes++;
            }
            
            // Update totals
            if (chosenSide === 'home') {
                totalHomeStaked += betSize;
                totalHomeProfit += profit;
                totalHomeBets++;
            } else {
                totalAwayStaked += betSize;
                totalAwayProfit += profit;
                totalAwayBets++;
            }
        });
        
        const homeROI = totalHomeStaked > 0 ? ((totalHomeProfit / totalHomeStaked) * 100) : 0;
        const awayROI = totalAwayStaked > 0 ? ((totalAwayProfit / totalAwayStaked) * 100) : 0;
        const totalROI = (totalHomeStaked + totalAwayStaked) > 0 ? 
            (((totalHomeProfit + totalAwayProfit) / (totalHomeStaked + totalAwayStaked)) * 100) : 0;
        
        console.log('\n🎲 HOME vs AWAY STRATEGY COMPARISON:');
        console.log('====================================');
        console.log(`🏠 HOME BETS: ${totalHomeBets} bets | $${totalHomeStaked.toLocaleString()} staked | ${totalHomeProfit >= 0 ? '+' : ''}$${totalHomeProfit.toFixed(0)} profit | ${homeROI.toFixed(2)}% ROI`);
        console.log(`🛫 AWAY BETS: ${totalAwayBets} bets | $${totalAwayStaked.toLocaleString()} staked | ${totalAwayProfit >= 0 ? '+' : ''}$${totalAwayProfit.toFixed(0)} profit | ${awayROI.toFixed(2)}% ROI`);
        console.log(`📊 TOTAL:     ${totalHomeBets + totalAwayBets} bets | $${(totalHomeStaked + totalAwayStaked).toLocaleString()} staked | ${(totalHomeProfit + totalAwayProfit) >= 0 ? '+' : ''}$${(totalHomeProfit + totalAwayProfit).toFixed(0)} profit | ${totalROI.toFixed(2)}% ROI`);
        
        // Weekly breakdown table
        console.log('\n📊 WEEKLY HOME vs AWAY BREAKDOWN:');
        console.log('==================================');
        console.log('Week | Period | HOME BETS |   HOME PROFIT   |   HOME ROI   | AWAY BETS |   AWAY PROFIT   |   AWAY ROI   ');
        console.log('-----|--------|-----------|-----------------|--------------|-----------|-----------------|-------------');
        
        for (let week = 1; week <= 38; week++) {
            const stats = weeklyStats[week];
            if (stats.total.bets === 0) continue;
            
            const period = week <= 8 ? 'Early' : (week <= 30 ? 'Mid  ' : 'Late ');
            const homeROI = stats.home.staked > 0 ? ((stats.home.profit / stats.home.staked) * 100) : 0;
            const awayROI = stats.away.staked > 0 ? ((stats.away.profit / stats.away.staked) * 100) : 0;
            
            console.log(`${week.toString().padStart(4)} | ${period} | ${stats.home.bets.toString().padStart(9)} | ${stats.home.profit >= 0 ? '+' : ''}$${stats.home.profit.toFixed(0).padStart(8)} (${homeROI >= 0 ? '+' : ''}${homeROI.toFixed(1).padStart(5)}%) | ${stats.away.bets.toString().padStart(9)} | ${stats.away.profit >= 0 ? '+' : ''}$${stats.away.profit.toFixed(0).padStart(8)} (${awayROI >= 0 ? '+' : ''}${awayROI.toFixed(1).padStart(5)}%)`);
        }
        
        // Seasonal analysis
        console.log('\n📈 SEASONAL HOME vs AWAY ANALYSIS:');
        console.log('==================================');
        
        const periods = [
            { name: 'Early (1-8)', start: 1, end: 8 },
            { name: 'Mid (9-30)', start: 9, end: 30 },
            { name: 'Late (31-38)', start: 31, end: 38 }
        ];
        
        periods.forEach(period => {
            let homeStats = { bets: 0, staked: 0, profit: 0 };
            let awayStats = { bets: 0, staked: 0, profit: 0 };
            
            for (let week = period.start; week <= period.end; week++) {
                const weekStats = weeklyStats[week];
                homeStats.bets += weekStats.home.bets;
                homeStats.staked += weekStats.home.staked;
                homeStats.profit += weekStats.home.profit;
                
                awayStats.bets += weekStats.away.bets;
                awayStats.staked += weekStats.away.staked;
                awayStats.profit += weekStats.away.profit;
            }
            
            const homeROI = homeStats.staked > 0 ? ((homeStats.profit / homeStats.staked) * 100) : 0;
            const awayROI = awayStats.staked > 0 ? ((awayStats.profit / awayStats.staked) * 100) : 0;
            
            console.log(`\\n${period.name}:`);
            console.log(`  🏠 HOME: ${homeStats.bets} bets | ${homeROI >= 0 ? '+' : ''}${homeROI.toFixed(2)}% ROI | ${homeStats.profit >= 0 ? '+' : ''}$${homeStats.profit.toFixed(0)} profit`);
            console.log(`  🛫 AWAY: ${awayStats.bets} bets | ${awayROI >= 0 ? '+' : ''}${awayROI.toFixed(2)}% ROI | ${awayStats.profit >= 0 ? '+' : ''}$${awayStats.profit.toFixed(0)} profit`);
        });
        
        // Market bias analysis
        console.log('\n🔍 MARKET BIAS DETECTION:');
        console.log('=========================');
        
        if (Math.abs(homeROI - awayROI) > 3) {
            if (homeROI > awayROI) {
                console.log(`✅ HOME BIAS DETECTED: Home bets outperform by ${(homeROI - awayROI).toFixed(2)}%`);
                console.log('   → Market may systematically undervalue home teams in quarter handicaps');
                console.log('   → Consider focusing more on home team higher odds bets');
            } else {
                console.log(`✅ AWAY BIAS DETECTED: Away bets outperform by ${(awayROI - homeROI).toFixed(2)}%`);
                console.log('   → Market may systematically undervalue away teams in quarter handicaps');
                console.log('   → Consider focusing more on away team higher odds bets');
            }
        } else {
            console.log('🔄 NO SIGNIFICANT BIAS: Home and away performance similar');
            console.log('   → Continue betting higher odds regardless of home/away');
        }
        
        // Bet distribution analysis
        const homePct = (totalHomeBets / (totalHomeBets + totalAwayBets) * 100);
        const awayPct = (totalAwayBets / (totalHomeBets + totalAwayBets) * 100);
        
        console.log(`\\n📊 BET DISTRIBUTION:`);
        console.log(`====================`);
        console.log(`🏠 Home bets: ${totalHomeBets} (${homePct.toFixed(1)}%)`);
        console.log(`🛫 Away bets: ${totalAwayBets} (${awayPct.toFixed(1)}%)`);
        
        if (Math.abs(homePct - 50) > 10) {
            if (homePct > awayPct) {
                console.log('→ Home teams more often have higher odds in quarter handicaps');
            } else {
                console.log('→ Away teams more often have higher odds in quarter handicaps');
            }
        } else {
            console.log('→ Balanced distribution between home and away higher odds');
        }
        
        // Save results
        const results = {
            summary: {
                strategy: 'Home vs Away Separated Analysis',
                totalHomeBets,
                totalAwayBets,
                totalHomeStaked,
                totalAwayStaked,
                totalHomeProfit: totalHomeProfit.toFixed(2),
                totalAwayProfit: totalAwayProfit.toFixed(2),
                homeROI: homeROI.toFixed(2),
                awayROI: awayROI.toFixed(2),
                generatedAt: new Date().toISOString()
            },
            weeklyBreakdown: weeklyStats
        };
        
        const outputPath = path.join(__dirname, 'home_away_separated_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`\\n💾 Results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the home vs away analysis
testHomeAwaySeparatedStrategy(); 