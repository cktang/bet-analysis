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

async function testOptimizedHigherOddsStrategy() {
    console.log('🚀 OPTIMIZED HIGHER ODDS STRATEGY');
    console.log('=================================');
    console.log('Strategy: Only bet the HIGHER odds side of quarter handicaps');
    console.log('Staking: $200 base at 1.91 odds, +$150 per 0.01 step\n');
    
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
        
        // Process each quarter handicap match - bet ONLY the higher odds side
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
            
            // Choose the HIGHER odds side (where our edge exists)
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
            
            // Apply variable staking based on chosen (higher) odds
            const betSize = calculateVariableStake(chosenOdds);
            const outcome = calculateAHResult(homeScore, awayScore, chosenHandicap, chosenSide);
            const profit = calculateProfit(betSize, chosenOdds, outcome);
            
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
                homeOdds,
                awayOdds,
                chosenSide,
                chosenOdds,
                chosenHandicap,
                betSize,
                outcome,
                profit: profit.toFixed(2)
            });
            
            // Update totals
            totalStaked += betSize;
            totalProfit += profit;
            totalBets++;
        });
        
        const overallROI = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        
        console.log('\n🎲 OPTIMIZED HIGHER ODDS STRATEGY RESULTS:');
        console.log('=========================================');
        console.log(`Overall ROI: ${overallROI.toFixed(2)}% (${totalBets} bets, $${totalStaked.toLocaleString()} staked)`);
        console.log(`Total Profit: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(0)}`);
        
        // Calculate 5-week moving averages
        const weeklyData = [];
        for (let week = 1; week <= 38; week++) {
            const stats = weeklyStats[week];
            if (stats.bets > 0) {
                const roi = stats.staked > 0 ? ((stats.profit / stats.staked) * 100) : 0;
                weeklyData.push({
                    week: week,
                    actualProfit: stats.profit,
                    actualROI: roi,
                    bets: stats.bets,
                    staked: stats.staked,
                    wins: stats.wins,
                    losses: stats.losses,
                    pushes: stats.pushes
                });
            }
        }
        
        // Calculate 5-week moving averages
        function calculateMovingAverage(data, windowSize) {
            const movingAvg = [];
            for (let i = 0; i < data.length; i++) {
                const start = Math.max(0, i - Math.floor(windowSize / 2));
                const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
                const window = data.slice(start, end);
                const avgProfit = window.reduce((sum, item) => sum + item.actualProfit, 0) / window.length;
                const avgROI = window.reduce((sum, item) => sum + item.actualROI, 0) / window.length;
                movingAvg.push({
                    ...data[i],
                    maProfit: avgProfit,
                    maROI: avgROI
                });
            }
            return movingAvg;
        }
        
        const results = calculateMovingAverage(weeklyData, 5);
        
        console.log('\n📊 OPTIMIZED STRATEGY: ACTUAL vs 5-WEEK MOVING AVERAGE');
        console.log('======================================================');
        console.log('Week | Period | Bets |   ACTUAL PROFIT   |    5MA PROFIT   |   ACTUAL ROI   |    5MA ROI   ');
        console.log('-----|--------|------|-------------------|-----------------|----------------|-------------');
        
        for (const week of results) {
            // Determine period
            let period;
            if (week.week <= 8) period = 'Early';
            else if (week.week <= 30) period = 'Mid  ';
            else period = 'Late ';
            
            console.log(`${week.week.toString().padStart(4)} | ${period} | ${week.bets.toString().padStart(4)} | ${week.actualProfit >= 0 ? '+' : ''}$${week.actualProfit.toFixed(0).padStart(9)} (${week.actualROI >= 0 ? '+' : ''}${week.actualROI.toFixed(1).padStart(5)}%) | ${week.maProfit >= 0 ? '+' : ''}$${week.maProfit.toFixed(0).padStart(8)} (${week.maROI >= 0 ? '+' : ''}${week.maROI.toFixed(1).padStart(5)}%) | ${week.actualROI >= 0 ? '+' : ''}${week.actualROI.toFixed(2).padStart(6)}% | ${week.maROI >= 0 ? '+' : ''}${week.maROI.toFixed(2).padStart(6)}%`);
        }
        
        // Calculate period averages
        const earlyWeeks = results.filter(w => w.week <= 8);
        const midWeeks = results.filter(w => w.week > 8 && w.week <= 30);
        const lateWeeks = results.filter(w => w.week > 30);
        
        const earlyActualAvg = earlyWeeks.reduce((sum, w) => sum + w.actualROI, 0) / earlyWeeks.length;
        const earlyMAAvg = earlyWeeks.reduce((sum, w) => sum + w.maROI, 0) / earlyWeeks.length;
        
        const midActualAvg = midWeeks.reduce((sum, w) => sum + w.actualROI, 0) / midWeeks.length;
        const midMAAvg = midWeeks.reduce((sum, w) => sum + w.maROI, 0) / midWeeks.length;
        
        const lateActualAvg = lateWeeks.reduce((sum, w) => sum + w.actualROI, 0) / lateWeeks.length;
        const lateMAAvg = lateWeeks.reduce((sum, w) => sum + w.maROI, 0) / lateWeeks.length;
        
        console.log('\n📈 OPTIMIZED STRATEGY SUMMARY:');
        console.log('==============================');
        console.log('Period     | Actual ROI Avg | 5MA ROI Avg | Improvement vs Dual-Side');
        console.log('-----------|----------------|-------------|-------------------------');
        console.log(`Early (1-8) | ${earlyActualAvg >= 0 ? '+' : ''}${earlyActualAvg.toFixed(2).padStart(6)}%    | ${earlyMAAvg >= 0 ? '+' : ''}${earlyMAAvg.toFixed(2).padStart(6)}%  | vs +7.50% (dual-side MA)`);
        console.log(`Mid (9-30)  | ${midActualAvg >= 0 ? '+' : ''}${midActualAvg.toFixed(2).padStart(6)}%    | ${midMAAvg >= 0 ? '+' : ''}${midMAAvg.toFixed(2).padStart(6)}%  | vs -7.71% (dual-side MA)`);
        console.log(`Late (31-38)| ${lateActualAvg >= 0 ? '+' : ''}${lateActualAvg.toFixed(2).padStart(6)}%    | ${lateMAAvg >= 0 ? '+' : ''}${lateMAAvg.toFixed(2).padStart(6)}%  | vs -3.52% (dual-side MA)`);
        
        console.log(`\nOVERALL OPTIMIZED: ${overallROI.toFixed(2)}% ROI vs -3.45% (dual-side strategy)`);
        
        // Find best and worst performing weeks
        const sortedByROI = [...results].sort((a, b) => b.actualROI - a.actualROI);
        
        console.log('\n🏆 BEST PERFORMING WEEKS (Optimized Strategy):');
        sortedByROI.slice(0, 5).forEach((week, index) => {
            console.log(`${index + 1}. Week ${week.week}: ${week.actualROI.toFixed(2)}% ROI (${week.bets} bets, $${week.actualProfit.toFixed(0)} profit)`);
        });
        
        console.log('\n💸 WORST PERFORMING WEEKS (Optimized Strategy):');
        sortedByROI.slice(-5).reverse().forEach((week, index) => {
            console.log(`${index + 1}. Week ${week.week}: ${week.actualROI.toFixed(2)}% ROI (${week.bets} bets, $${week.actualProfit.toFixed(0)} profit)`);
        });
        
        // Save results
        const finalResults = {
            summary: {
                strategy: 'Optimized Higher Odds Only',
                totalBets,
                totalStaked,
                totalProfit: totalProfit.toFixed(2),
                overallROI: overallROI.toFixed(2),
                generatedAt: new Date().toISOString()
            },
            weeklyData: results,
            seasonalAverages: {
                early: { actualROI: earlyActualAvg.toFixed(2), maROI: earlyMAAvg.toFixed(2) },
                mid: { actualROI: midActualAvg.toFixed(2), maROI: midMAAvg.toFixed(2) },
                late: { actualROI: lateActualAvg.toFixed(2), maROI: lateMAAvg.toFixed(2) }
            }
        };
        
        const outputPath = path.join(__dirname, 'optimized_higher_odds_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
        
        console.log(`\n💾 Results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the optimized strategy test
testOptimizedHigherOddsStrategy(); 