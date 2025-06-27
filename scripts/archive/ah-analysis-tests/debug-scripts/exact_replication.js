const fs = require('fs');
const path = require('path');

// Variable staking configuration (match Single_earlySeasonConfusion exactly)
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

// Replicate exact Asian Handicap calculation from the combination tester
function calculateAHOutcome(homeScore, awayScore, handicapLine, betSide = 'Away') {
    let handicapLines = [];
    
    if (handicapLine && handicapLine.includes('/')) {
        // Quarter handicap - split into two half-bets
        const parts = handicapLine.split('/');
        handicapLines = [parseFloat(parts[0]), parseFloat(parts[1])];
    } else if (handicapLine) {
        // Single handicap
        handicapLines = [parseFloat(handicapLine)];
    } else {
        return { outcome: 'Error', profit: 0 };
    }
    
    const betAmount = calculateVariableStake(2.0); // Placeholder, will be corrected
    const betPerLine = betAmount / handicapLines.length;
    
    let totalProfit = 0;
    let outcomes = [];
    
    handicapLines.forEach(handicapLineValue => {
        // Home team gets the handicap
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
    
    // Determine overall outcome description
    let outcome = '';
    if (outcomes.every(o => o === 'Away')) {
        outcome = 'Win';  // Betting away and away wins
    } else if (outcomes.every(o => o === 'Home')) {
        outcome = 'Loss'; // Betting away and home wins
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

async function exactReplication() {
    console.log('🎯 EXACT SINGLE_EARLYSEASONCONFUSION REPLICATION');
    console.log('================================================');
    console.log('Strategy: Early season quarter handicaps, ALWAYS bet away team');
    console.log('Logic: (fbref.week <= 6 && match.asianHandicapOdds.homeHandicap.includes("/"))');
    console.log('Data: Enhanced data structure from combination tester\n');
    
    try {
        // Load enhanced data (same as combination tester)
        const enhancedPath = path.join(__dirname, '../../data/enhanced');
        const seasons = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
        
        let allMatches = [];
        
        seasons.forEach(season => {
            const seasonPath = path.join(enhancedPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.keys(seasonData.matches)
                    .sort() // Deterministic key ordering
                    .map(key => seasonData.matches[key]);
                allMatches.push(...matches);
                console.log(`Loaded ${matches.length} matches from ${season}`);
            }
        });

        console.log(`Total matches loaded: ${allMatches.length}`);
        
        // Filter using EXACT Single_earlySeasonConfusion logic
        const targetMatches = allMatches.filter(match => {
            // Exact factor evaluation: (fbref.week <= 6 && match.asianHandicapOdds.homeHandicap.includes('/')) ? 1 : 0
            const week = match.preMatch?.fbref?.week;
            const homeHandicap = match.preMatch?.match?.asianHandicapOdds?.homeHandicap;
            
            const factorValue = (week <= 6 && homeHandicap && homeHandicap.includes('/')) ? 1 : 0;
            
            // Only include matches where factor evaluates to 1
            return factorValue === 1;
        });
        
        console.log(`🎯 Target matches (exact factor match): ${targetMatches.length}`);
        
        if (targetMatches.length === 0) {
            console.log('❌ No matches found matching exact criteria');
            return;
        }
        
        let totalStaked = 0;
        let totalProfit = 0;
        let totalBets = 0;
        let wins = 0;
        let losses = 0;
        let pushes = 0;
        
        const detailedResults = [];
        
        // Process each match exactly like Single_earlySeasonConfusion
        targetMatches.forEach(match => {
            const ahOdds = match.preMatch?.match?.asianHandicapOdds;
            const actualResults = match.postMatch?.actualResults;
            
            if (!ahOdds || !actualResults) return;
            
            const homeScore = actualResults.homeGoals ?? 0;
            const awayScore = actualResults.awayGoals ?? 0;
            const homeHandicap = ahOdds.homeHandicap;
            const awayOdds = ahOdds.awayOdds;
            
            if (!awayOdds || !homeHandicap) return;
            
            // Calculate stake using variable staking
            const betSize = calculateVariableStake(awayOdds);
            
            // Calculate outcome (always betting away team)
            const { outcome } = calculateAHOutcome(homeScore, awayScore, homeHandicap, 'Away');
            
            // Calculate profit
            const profit = calculateProfit(betSize, awayOdds, outcome);
            
            // Track results
            totalStaked += betSize;
            totalProfit += profit;
            totalBets++;
            
            if (outcome === 'Win' || outcome === 'Half Win') {
                wins++;
            } else if (outcome === 'Loss' || outcome === 'Half Loss') {
                losses++;
            } else {
                pushes++;
            }
            
            detailedResults.push({
                date: match.preMatch?.match?.date,
                homeTeam: match.preMatch?.match?.homeTeam,
                awayTeam: match.preMatch?.match?.awayTeam,
                score: `${homeScore}-${awayScore}`,
                handicapLine: homeHandicap,
                awayOdds: awayOdds.toFixed(2),
                betSize,
                outcome,
                profit: profit.toFixed(0),
                week: match.preMatch?.fbref?.week
            });
        });
        
        const totalROI = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        const winRate = totalBets > 0 ? ((wins / totalBets) * 100) : 0;
        
        console.log('\n🎯 EXACT REPLICATION RESULTS:');
        console.log('=============================');
        console.log(`📊 Total Bets: ${totalBets}`);
        console.log(`💰 Total Staked: $${totalStaked.toLocaleString()}`);
        console.log(`📈 Total Profit: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(0)}`);
        console.log(`🎪 ROI: ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(2)}%`);
        console.log(`✅ Win Rate: ${winRate.toFixed(1)}% (${wins}W-${losses}L-${pushes}P)`);
        
        console.log('\n🎯 TARGET COMPARISON:');
        console.log('=====================');
        console.log(`Single_earlySeasonConfusion: 26.82% ROI, $41,217 profit, 59.4% win rate`);
        console.log(`Our exact replication:       ${totalROI.toFixed(2)}% ROI, $${totalProfit.toFixed(0)} profit, ${winRate.toFixed(1)}% win rate`);
        console.log(`Difference:                  ${(totalROI - 26.82).toFixed(2)}% ROI, $${(totalProfit - 41217).toFixed(0)} profit`);
        
        // Show sample matches for debugging
        console.log('\n🔍 SAMPLE MATCHES (First 10):');
        console.log('==============================');
        console.log('Date       | Home vs Away           | Score | Handicap   | Odds | Stake | Outcome    | Profit');
        console.log('-----------|------------------------|-------|------------|------|-------|------------|-------');
        
        detailedResults.slice(0, 10).forEach(match => {
            const homeVsAway = `${match.homeTeam} vs ${match.awayTeam}`.padEnd(22);
            console.log(`${match.date?.substring(0,10) || 'N/A'.padEnd(10)} | ${homeVsAway} | ${match.score.padEnd(5)} | ${match.handicapLine.padEnd(10)} | ${match.awayOdds.padStart(4)} | ${match.betSize.toString().padStart(5)} | ${match.outcome.padEnd(10)} | ${match.profit.padStart(6)}`);
        });
        
        // Find Ipswich vs Aston Villa for direct comparison
        const ipswichMatch = detailedResults.find(match => 
            match.homeTeam === 'Ipswich' && match.awayTeam === 'Aston Villa'
        );
        
        if (ipswichMatch) {
            console.log('\n📍 KEY MATCH VERIFICATION:');
            console.log('==========================');
            console.log(`Ipswich vs Aston Villa (${ipswichMatch.score})`);
            console.log(`Single_earlySeasonConfusion: +0.5/+1 @ 2.20 | $4550 | LOSS | -$4550`);
            console.log(`Our replication:             ${ipswichMatch.handicapLine} @ ${ipswichMatch.awayOdds} | $${ipswichMatch.betSize} | ${ipswichMatch.outcome} | $${ipswichMatch.profit}`);
        }
        
        // Summary assessment
        console.log('\n📈 ASSESSMENT:');
        console.log('==============');
        if (Math.abs(totalROI - 26.82) < 1) {
            console.log('🎯 PERFECT MATCH: Successfully replicated Single_earlySeasonConfusion!');
        } else if (Math.abs(totalROI - 26.82) < 5) {
            console.log('✅ VERY CLOSE: Minor differences, likely due to data interpretation');
        } else {
            console.log('⚠️  SIGNIFICANT DIFFERENCE: Need to investigate data structure gaps');
        }
        
        // Save results
        const results = {
            summary: {
                strategy: 'Exact Single_earlySeasonConfusion Replication',
                totalBets,
                totalStaked: totalStaked.toFixed(2),
                totalProfit: totalProfit.toFixed(2),
                totalROI: totalROI.toFixed(2),
                winRate: winRate.toFixed(2),
                target: {
                    roi: 26.82,
                    profit: 41217,
                    winRate: 59.4
                },
                generatedAt: new Date().toISOString()
            },
            matches: detailedResults
        };
        
        const outputPath = path.join(__dirname, 'exact_replication_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`\n💾 Results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Run the exact replication
exactReplication(); 