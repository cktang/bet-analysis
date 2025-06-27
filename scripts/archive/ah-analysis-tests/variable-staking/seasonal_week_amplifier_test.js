const fs = require('fs');
const path = require('path');

// Variable staking configuration (same as successful strategy)
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
    // Quarter handicaps have "/" like "0/-0.5", "+0.5/+1", etc.
    return handicapLine.includes('/');
}

function getSeasonWeek(match) {
    // Extract week from fbref data
    if (match.fbref && match.fbref.week) {
        return parseInt(match.fbref.week);
    }
    return null;
}

async function testSeasonalWeekAmplifier() {
    console.log('📅 Testing SEASONAL WEEK AMPLIFIER Pattern');
    console.log('==========================================');
    console.log('Theory: Early season, mid-season, and late season show different profitability patterns\n');
    
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
        
        // Filter for quarter handicaps only (proven constraint arbitrage works)
        const quarterHandicapMatches = allMatches.filter(match => {
            return match.match?.asianHandicapOdds?.homeHandicap && 
                   isQuarterHandicap(match.match.asianHandicapOdds.homeHandicap) &&
                   getSeasonWeek(match) !== null;
        });
        
        console.log(`🎯 Quarter handicap matches with week data: ${quarterHandicapMatches.length}`);
        
        // Group by week for analysis
        const weeklyStats = {};
        for (let week = 1; week <= 38; week++) {
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
        
        // Test variable staking on quarter handicap matches, grouped by week
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
            
            // Test both sides with variable staking
            [
                { side: 'home', odds: homeOdds, handicap: homeHandicap },
                { side: 'away', odds: awayOdds, handicap: awayHandicap }
            ].forEach(bet => {
                const betSize = calculateVariableStake(bet.odds);
                const outcome = calculateAHResult(homeScore, awayScore, bet.handicap, bet.side);
                const profit = calculateProfit(betSize, bet.odds, outcome);
                
                // Update weekly stats
                weeklyStats[week].bets++;
                weeklyStats[week].staked += betSize;
                weeklyStats[week].profit += profit;
                
                if (outcome === 'Win' || outcome === 'Half Win') weeklyStats[week].wins++;
                else if (outcome === 'Loss' || outcome === 'Half Loss') weeklyStats[week].losses++;
                else weeklyStats[week].pushes++;
                
                weeklyStats[week].matches.push({
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    handicap: bet.handicap,
                    odds: bet.odds,
                    betSize,
                    outcome,
                    profit: profit.toFixed(2)
                });
                
                // Update totals
                totalStaked += betSize;
                totalProfit += profit;
                totalBets++;
            });
        });
        
        const overallROI = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        
        console.log('\n🎲 QUARTER HANDICAP VARIABLE STAKING BY WEEK:');
        console.log('==============================================');
        console.log(`Overall ROI: ${overallROI.toFixed(2)}% (${totalBets} bets, $${totalStaked.toLocaleString()} staked)`);
        
        // Display week by week results
        console.log('\n📊 WEEKLY BREAKDOWN:');
        console.log('Week | Bets | Staked    | Profit    | ROI      | WR    | W  | L  | P');
        console.log('-----|------|-----------|-----------|----------|-------|----|----|---');
        
        for (let week = 1; week <= 38; week++) {
            const stats = weeklyStats[week];
            if (stats.bets === 0) continue;
            
            const roi = stats.staked > 0 ? ((stats.profit / stats.staked) * 100) : 0;
            const winRate = stats.bets > 0 ? ((stats.wins / stats.bets) * 100) : 0;
            
            console.log(`${week.toString().padStart(4)} | ${stats.bets.toString().padStart(4)} | $${stats.staked.toLocaleString().padStart(8)} | ${stats.profit >= 0 ? '+' : ''}$${stats.profit.toFixed(0).padStart(7)} | ${roi >= 0 ? '+' : ''}${roi.toFixed(2).padStart(6)}% | ${winRate.toFixed(1).padStart(4)}% | ${stats.wins.toString().padStart(2)} | ${stats.losses.toString().padStart(2)} | ${stats.pushes.toString().padStart(2)}`);
        }
        
        // Analyze seasonal patterns
        console.log('\n🔍 SEASONAL PATTERN ANALYSIS:');
        console.log('==============================');
        
        // Early Season (Weeks 1-8)
        const earlySeasonStats = { bets: 0, staked: 0, profit: 0, wins: 0, losses: 0, pushes: 0 };
        for (let week = 1; week <= 8; week++) {
            const stats = weeklyStats[week];
            earlySeasonStats.bets += stats.bets;
            earlySeasonStats.staked += stats.staked;
            earlySeasonStats.profit += stats.profit;
            earlySeasonStats.wins += stats.wins;
            earlySeasonStats.losses += stats.losses;
            earlySeasonStats.pushes += stats.pushes;
        }
        
        // Mid Season (Weeks 9-30)
        const midSeasonStats = { bets: 0, staked: 0, profit: 0, wins: 0, losses: 0, pushes: 0 };
        for (let week = 9; week <= 30; week++) {
            const stats = weeklyStats[week];
            midSeasonStats.bets += stats.bets;
            midSeasonStats.staked += stats.staked;
            midSeasonStats.profit += stats.profit;
            midSeasonStats.wins += stats.wins;
            midSeasonStats.losses += stats.losses;
            midSeasonStats.pushes += stats.pushes;
        }
        
        // Late Season (Weeks 31-38)
        const lateSeasonStats = { bets: 0, staked: 0, profit: 0, wins: 0, losses: 0, pushes: 0 };
        for (let week = 31; week <= 38; week++) {
            const stats = weeklyStats[week];
            lateSeasonStats.bets += stats.bets;
            lateSeasonStats.staked += stats.staked;
            lateSeasonStats.profit += stats.profit;
            lateSeasonStats.wins += stats.wins;
            lateSeasonStats.losses += stats.losses;
            lateSeasonStats.pushes += stats.pushes;
        }
        
        const earlyROI = earlySeasonStats.staked > 0 ? ((earlySeasonStats.profit / earlySeasonStats.staked) * 100) : 0;
        const midROI = midSeasonStats.staked > 0 ? ((midSeasonStats.profit / midSeasonStats.staked) * 100) : 0;
        const lateROI = lateSeasonStats.staked > 0 ? ((lateSeasonStats.profit / lateSeasonStats.staked) * 100) : 0;
        
        console.log(`\n📈 EARLY SEASON (Weeks 1-8):`);
        console.log(`   ${earlySeasonStats.bets} bets | $${earlySeasonStats.staked.toLocaleString()} staked | ${earlyROI >= 0 ? '+' : ''}$${earlySeasonStats.profit.toFixed(0)} profit | ${earlyROI.toFixed(2)}% ROI`);
        
        console.log(`\n📊 MID SEASON (Weeks 9-30):`);
        console.log(`   ${midSeasonStats.bets} bets | $${midSeasonStats.staked.toLocaleString()} staked | ${midROI >= 0 ? '+' : ''}$${midSeasonStats.profit.toFixed(0)} profit | ${midROI.toFixed(2)}% ROI`);
        
        console.log(`\n📉 LATE SEASON (Weeks 31-38):`);
        console.log(`   ${lateSeasonStats.bets} bets | $${lateSeasonStats.staked.toLocaleString()} staked | ${lateROI >= 0 ? '+' : ''}$${lateSeasonStats.profit.toFixed(0)} profit | ${lateROI.toFixed(2)}% ROI`);
        
        // Find best and worst weeks
        const weeklyROIs = [];
        for (let week = 1; week <= 38; week++) {
            const stats = weeklyStats[week];
            if (stats.bets >= 10) { // Only weeks with decent sample size
                const roi = stats.staked > 0 ? ((stats.profit / stats.staked) * 100) : 0;
                weeklyROIs.push({ week, roi, bets: stats.bets, profit: stats.profit });
            }
        }
        
        weeklyROIs.sort((a, b) => b.roi - a.roi);
        
        console.log('\n🏆 BEST PERFORMING WEEKS (min 10 bets):');
        weeklyROIs.slice(0, 5).forEach((weekData, index) => {
            console.log(`${index + 1}. Week ${weekData.week}: ${weekData.roi.toFixed(2)}% ROI (${weekData.bets} bets, $${weekData.profit.toFixed(0)} profit)`);
        });
        
        console.log('\n💸 WORST PERFORMING WEEKS (min 10 bets):');
        weeklyROIs.slice(-5).reverse().forEach((weekData, index) => {
            console.log(`${index + 1}. Week ${weekData.week}: ${weekData.roi.toFixed(2)}% ROI (${weekData.bets} bets, $${weekData.profit.toFixed(0)} profit)`);
        });
        
        // Pattern detection
        console.log('\n🔬 SEASONAL AMPLIFIER PATTERN DETECTION:');
        console.log('=========================================');
        
        if (earlyROI > overallROI + 2) {
            console.log('✅ EARLY SEASON BOOST CONFIRMED: +' + (earlyROI - overallROI).toFixed(2) + '% above average');
        } else if (earlyROI < overallROI - 2) {
            console.log('❌ Early Season shows weakness: ' + (earlyROI - overallROI).toFixed(2) + '% below average');
        } else {
            console.log('🔄 Early Season performs near average');
        }
        
        if (midROI > overallROI + 2) {
            console.log('✅ MID SEASON BOOST CONFIRMED: +' + (midROI - overallROI).toFixed(2) + '% above average');
        } else if (midROI < overallROI - 2) {
            console.log('❌ Mid Season shows weakness: ' + (midROI - overallROI).toFixed(2) + '% below average');
        } else {
            console.log('🔄 Mid Season performs near average');
        }
        
        if (lateROI > overallROI + 2) {
            console.log('✅ LATE SEASON BOOST CONFIRMED: +' + (lateROI - overallROI).toFixed(2) + '% above average');
        } else if (lateROI < overallROI - 2) {
            console.log('❌ Late Season shows weakness: ' + (lateROI - overallROI).toFixed(2) + '% below average');
        } else {
            console.log('🔄 Late Season performs near average');
        }
        
        // Save detailed results
        const results = {
            summary: {
                totalBets,
                totalStaked,
                totalProfit: totalProfit.toFixed(2),
                overallROI: overallROI.toFixed(2),
                generatedAt: new Date().toISOString()
            },
            seasonalBreakdown: {
                early: { ...earlySeasonStats, roi: earlyROI.toFixed(2) },
                mid: { ...midSeasonStats, roi: midROI.toFixed(2) },
                late: { ...lateSeasonStats, roi: lateROI.toFixed(2) }
            },
            weeklyStats: Object.fromEntries(
                Object.entries(weeklyStats).filter(([week, stats]) => stats.bets > 0)
            ),
            bestWeeks: weeklyROIs.slice(0, 10),
            worstWeeks: weeklyROIs.slice(-10)
        };
        
        const outputPath = path.join(__dirname, 'seasonal_week_amplifier_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`\n💾 Detailed results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testSeasonalWeekAmplifier(); 