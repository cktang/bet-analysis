const fs = require('fs');
const path = require('path');

// Variable staking configuration
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

function calculateAHOutcome(homeScore, awayScore, handicapLine) {
    let handicapLines = [];
    
    if (handicapLine && handicapLine.includes('/')) {
        const parts = handicapLine.split('/');
        handicapLines = [parseFloat(parts[0]), parseFloat(parts[1])];
    } else if (handicapLine) {
        handicapLines = [parseFloat(handicapLine)];
    } else {
        return { outcome: 'Error' };
    }
    
    let outcomes = [];
    
    handicapLines.forEach(handicapLineValue => {
        const adjustedHomeScore = homeScore + handicapLineValue;
        const adjustedAwayScore = awayScore;
        
        let ahOutcome;
        if (adjustedHomeScore > adjustedAwayScore) {
            ahOutcome = 'Home';
        } else if (adjustedHomeScore < adjustedAwayScore) {
            ahOutcome = 'Away';
        } else {
            ahOutcome = 'Push';
        }
        
        outcomes.push(ahOutcome);
    });
    
    // Determine overall outcome for away bet
    let outcome = '';
    if (outcomes.every(o => o === 'Away')) {
        outcome = 'Win';
    } else if (outcomes.every(o => o === 'Home')) {
        outcome = 'Loss';
    } else if (outcomes.every(o => o === 'Push')) {
        outcome = 'Push';
    } else if (outcomes.includes('Away') && outcomes.includes('Push')) {
        outcome = 'Half Win';
    } else if (outcomes.includes('Home') && outcomes.includes('Push')) {
        outcome = 'Half Loss';
    } else {
        outcome = 'Mixed';
    }
    
    return { outcome, outcomes };
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

function calculateMovingAverage(data, windowSize) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = data.slice(start, i + 1);
        const average = window.reduce((sum, val) => sum + val, 0) / window.length;
        result.push(average);
    }
    return result;
}

async function analyzeFullSeasonAwayStrategy() {
    console.log('📈 FULL SEASON AWAY TEAM ANALYSIS');
    console.log('=================================');
    console.log('Strategy: Bet AWAY team on ALL quarter handicaps (full 38 weeks)');
    console.log('Analysis: Weekly performance with moving averages');
    console.log('Hypothesis: Away team bias changes over season\n');
    
    try {
        // Load enhanced data
        const enhancedPath = path.join(__dirname, '../../data/enhanced');
        const seasons = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
        
        let allMatches = [];
        
        seasons.forEach(season => {
            const seasonPath = path.join(enhancedPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.keys(seasonData.matches)
                    .sort()
                    .map(key => seasonData.matches[key]);
                allMatches.push(...matches);
                console.log(`Loaded ${matches.length} matches from ${season}`);
            }
        });

        console.log(`Total matches loaded: ${allMatches.length}`);
        
        // Filter for ALL quarter handicaps (full season)
        const targetMatches = allMatches.filter(match => {
            const week = match.preMatch?.fbref?.week;
            const homeHandicap = match.preMatch?.match?.asianHandicapOdds?.homeHandicap;
            
            return week && week >= 1 && week <= 38 && 
                   homeHandicap && homeHandicap.includes('/');
        });
        
        console.log(`🎯 Target matches (full season quarter handicaps): ${targetMatches.length}`);
        
        // Group matches by week
        const weeklyData = {};
        for (let week = 1; week <= 38; week++) {
            weeklyData[week] = {
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
        
        // Process each match
        targetMatches.forEach(match => {
            const week = match.preMatch?.fbref?.week;
            const ahOdds = match.preMatch?.match?.asianHandicapOdds;
            const actualResults = match.postMatch?.actualResults;
            
            if (!week || !ahOdds || !actualResults) return;
            
            const homeScore = actualResults.homeGoals ?? 0;
            const awayScore = actualResults.awayGoals ?? 0;
            const homeHandicap = ahOdds.homeHandicap;
            const awayOdds = ahOdds.awayOdds;
            
            if (!awayOdds || !homeHandicap) return;
            
            const betSize = calculateVariableStake(awayOdds);
            const { outcome } = calculateAHOutcome(homeScore, awayScore, homeHandicap);
            const profit = calculateProfit(betSize, awayOdds, outcome);
            
            // Update weekly stats
            const weekStats = weeklyData[week];
            weekStats.bets++;
            weekStats.staked += betSize;
            weekStats.profit += profit;
            weekStats.matches.push({
                homeTeam: match.preMatch?.match?.homeTeam,
                awayTeam: match.preMatch?.match?.awayTeam,
                homeScore,
                awayScore,
                handicap: homeHandicap,
                odds: awayOdds,
                betSize,
                outcome,
                profit
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
            
            totalStaked += betSize;
            totalProfit += profit;
            totalBets++;
        });
        
        // Calculate weekly ROIs and metrics
        const weeklyROIs = [];
        const weeklyWinRates = [];
        const weeklyBetCounts = [];
        const cumulativeROIs = [];
        let cumulativeStaked = 0;
        let cumulativeProfit = 0;
        
        for (let week = 1; week <= 38; week++) {
            const stats = weeklyData[week];
            const weekROI = stats.staked > 0 ? (stats.profit / stats.staked) * 100 : 0;
            const weekWinRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
            
            weeklyROIs.push(weekROI);
            weeklyWinRates.push(weekWinRate);
            weeklyBetCounts.push(stats.bets);
            
            // Cumulative ROI
            cumulativeStaked += stats.staked;
            cumulativeProfit += stats.profit;
            const cumulativeROI = cumulativeStaked > 0 ? (cumulativeProfit / cumulativeStaked) * 100 : 0;
            cumulativeROIs.push(cumulativeROI);
        }
        
        // Calculate moving averages
        const roiMA3 = calculateMovingAverage(weeklyROIs, 3);
        const roiMA5 = calculateMovingAverage(weeklyROIs, 5);
        const winRateMA3 = calculateMovingAverage(weeklyWinRates, 3);
        const winRateMA5 = calculateMovingAverage(weeklyWinRates, 5);
        
        const totalROI = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
        const totalWinRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
        
        console.log('\n🎯 FULL SEASON RESULTS:');
        console.log('=======================');
        console.log(`📊 Total Bets: ${totalBets}`);
        console.log(`💰 Total Staked: $${totalStaked.toLocaleString()}`);
        console.log(`📈 Total Profit: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(0)}`);
        console.log(`🎪 Overall ROI: ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}%`);
        console.log(`✅ Overall Win Rate: ${totalWinRate.toFixed(1)}% (${totalWins}W-${totalLosses}L-${totalPushes}P)`);
        
        console.log('\n📊 WEEKLY PERFORMANCE WITH MOVING AVERAGES:');
        console.log('============================================');
        console.log('Week | Bets | Weekly ROI | 3MA ROI | 5MA ROI | Win Rate | 3MA WR | Cumulative ROI');
        console.log('-----|------|------------|---------|---------|----------|---------|---------------');
        
        for (let week = 1; week <= 38; week++) {
            const stats = weeklyData[week];
            if (stats.bets === 0) continue;
            
            const weekROI = weeklyROIs[week - 1];
            const ma3ROI = roiMA3[week - 1];
            const ma5ROI = roiMA5[week - 1];
            const weekWinRate = weeklyWinRates[week - 1];
            const ma3WR = winRateMA3[week - 1];
            const cumROI = cumulativeROIs[week - 1];
            
            console.log(`${week.toString().padStart(4)} | ${stats.bets.toString().padStart(4)} | ${weekROI >= 0 ? '+' : ''}${weekROI.toFixed(1).padStart(8)}% | ${ma3ROI >= 0 ? '+' : ''}${ma3ROI.toFixed(1).padStart(6)}% | ${ma5ROI >= 0 ? '+' : ''}${ma5ROI.toFixed(1).padStart(6)}% | ${weekWinRate.toFixed(1).padStart(7)}% | ${ma3WR.toFixed(1).padStart(5)}% | ${cumROI >= 0 ? '+' : ''}${cumROI.toFixed(2).padStart(12)}%`);
        }
        
        // Identify best and worst periods
        console.log('\n🏆 BEST PERIODS (5-week MA ROI):');
        console.log('================================');
        const ma5WithWeeks = roiMA5.map((roi, index) => ({ week: index + 1, roi, bets: weeklyBetCounts[index] }))
            .filter(item => item.bets > 0)
            .sort((a, b) => b.roi - a.roi);
        
        ma5WithWeeks.slice(0, 5).forEach((item, index) => {
            console.log(`${index + 1}. Week ${item.week}: ${item.roi >= 0 ? '+' : ''}${item.roi.toFixed(1)}% MA5 ROI`);
        });
        
        console.log('\n📉 WORST PERIODS (5-week MA ROI):');
        console.log('=================================');
        ma5WithWeeks.slice(-5).reverse().forEach((item, index) => {
            console.log(`${index + 1}. Week ${item.week}: ${item.roi >= 0 ? '+' : ''}${item.roi.toFixed(1)}% MA5 ROI`);
        });
        
        // Season phase analysis
        console.log('\n📅 SEASON PHASE ANALYSIS:');
        console.log('=========================');
        
        const phases = [
            { name: 'Early Season (1-8)', start: 1, end: 8 },
            { name: 'Early-Mid Season (9-16)', start: 9, end: 16 },
            { name: 'Mid Season (17-24)', start: 17, end: 24 },
            { name: 'Late-Mid Season (25-32)', start: 25, end: 32 },
            { name: 'Late Season (33-38)', start: 33, end: 38 }
        ];
        
        phases.forEach(phase => {
            let phaseBets = 0;
            let phaseStaked = 0;
            let phaseProfit = 0;
            let phaseWins = 0;
            let phaseLosses = 0;
            
            for (let week = phase.start; week <= phase.end; week++) {
                const stats = weeklyData[week];
                phaseBets += stats.bets;
                phaseStaked += stats.staked;
                phaseProfit += stats.profit;
                phaseWins += stats.wins;
                phaseLosses += stats.losses;
            }
            
            const phaseROI = phaseStaked > 0 ? (phaseProfit / phaseStaked) * 100 : 0;
            const phaseWinRate = phaseBets > 0 ? (phaseWins / phaseBets) * 100 : 0;
            
            console.log(`${phase.name}: ${phaseROI >= 0 ? '+' : ''}${phaseROI.toFixed(2)}% ROI, ${phaseWinRate.toFixed(1)}% WR, ${phaseBets} bets`);
        });
        
        // Compare with early season only
        const earlySeasonStats = phases[0];
        let earlyBets = 0, earlyStaked = 0, earlyProfit = 0, earlyWins = 0, earlyLosses = 0;
        
        for (let week = 1; week <= 8; week++) {
            const stats = weeklyData[week];
            earlyBets += stats.bets;
            earlyStaked += stats.staked;
            earlyProfit += stats.profit;
            earlyWins += stats.wins;
            earlyLosses += stats.losses;
        }
        
        const earlyROI = earlyStaked > 0 ? (earlyProfit / earlyStaked) * 100 : 0;
        const earlyWinRate = earlyBets > 0 ? (earlyWins / earlyBets) * 100 : 0;
        
        console.log('\n🎯 EARLY SEASON vs FULL SEASON COMPARISON:');
        console.log('==========================================');
        console.log(`Early Season (1-8):  ${earlyROI >= 0 ? '+' : ''}${earlyROI.toFixed(2)}% ROI, ${earlyWinRate.toFixed(1)}% WR, ${earlyBets} bets`);
        console.log(`Full Season (1-38):  ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}% ROI, ${totalWinRate.toFixed(1)}% WR, ${totalBets} bets`);
        console.log(`Difference:          ${(earlyROI - totalROI).toFixed(2)} percentage points ROI advantage for early season`);
        
        // Key insights
        console.log('\n💡 KEY INSIGHTS:');
        console.log('================');
        
        if (earlyROI > totalROI + 5) {
            console.log('🎯 STRONG EARLY SEASON BIAS: Away team edge significantly stronger in early weeks');
        } else if (earlyROI > totalROI) {
            console.log('✅ MILD EARLY SEASON BIAS: Slight away team advantage in early weeks');
        } else {
            console.log('⚠️  NO CLEAR EARLY BIAS: Away team performance consistent across season');
        }
        
        const bestMA5 = Math.max(...roiMA5.filter((_, index) => weeklyBetCounts[index] > 0));
        const worstMA5 = Math.min(...roiMA5.filter((_, index) => weeklyBetCounts[index] > 0));
        
        console.log(`📈 Best 5-week period: ${bestMA5 >= 0 ? '+' : ''}${bestMA5.toFixed(1)}% MA ROI`);
        console.log(`📉 Worst 5-week period: ${worstMA5 >= 0 ? '+' : ''}${worstMA5.toFixed(1)}% MA ROI`);
        console.log(`🎪 Volatility range: ${(bestMA5 - worstMA5).toFixed(1)} percentage points`);
        
        // Save results
        const results = {
            summary: {
                strategy: 'Full Season Away Team Quarter Handicaps',
                totalBets,
                totalStaked: totalStaked.toFixed(2),
                totalProfit: totalProfit.toFixed(2),
                totalROI: totalROI.toFixed(2),
                totalWinRate: totalWinRate.toFixed(2),
                earlySeasonROI: earlyROI.toFixed(2),
                earlySeasonAdvantage: (earlyROI - totalROI).toFixed(2),
                generatedAt: new Date().toISOString()
            },
            weeklyData: weeklyData,
            movingAverages: {
                weeklyROIs,
                roiMA3,
                roiMA5,
                weeklyWinRates,
                winRateMA3,
                winRateMA5,
                cumulativeROIs
            },
            phaseAnalysis: phases.map(phase => {
                let phaseBets = 0, phaseStaked = 0, phaseProfit = 0, phaseWins = 0;
                for (let week = phase.start; week <= phase.end; week++) {
                    const stats = weeklyData[week];
                    phaseBets += stats.bets;
                    phaseStaked += stats.staked;
                    phaseProfit += stats.profit;
                    phaseWins += stats.wins;
                }
                const phaseROI = phaseStaked > 0 ? (phaseProfit / phaseStaked) * 100 : 0;
                const phaseWinRate = phaseBets > 0 ? (phaseWins / phaseBets) * 100 : 0;
                return {
                    ...phase,
                    bets: phaseBets,
                    roi: phaseROI.toFixed(2),
                    winRate: phaseWinRate.toFixed(2)
                };
            })
        };
        
        const outputPath = path.join(__dirname, 'full_season_away_analysis.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`\n💾 Results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Run the full season analysis
analyzeFullSeasonAwayStrategy(); 