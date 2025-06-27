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

function isFullHandicap(handicapLine) {
    // Full handicaps are single values like 0, -1, -2, +1, +2 (not quarter handicaps with /)
    return !handicapLine.includes('/');
}

async function testFullHandicapVariableStaking() {
    console.log('🔍 Testing Variable Staking on FULL HANDICAPS ONLY');
    console.log('=====================================');
    console.log('Theory: Edge should disappear when HKJC isn\'t constrained by quarter handicap limitations\n');
    
    try {
        // Load processed data (which we know works)
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        let allMatches = [];
        
        for (const season of seasons) {
            const dataPath = path.join(__dirname, '../../data/processed', `year-${season}.json`);
            console.log(`Loading ${season}...`);
            const seasonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            console.log(`Season data keys:`, Object.keys(seasonData));
            
            if (seasonData.matches) {
                // Matches is an object, not an array - convert to array
                const matchesArray = Object.values(seasonData.matches);
                console.log(`${season} matches found:`, matchesArray.length);
                allMatches = allMatches.concat(matchesArray);
                
                // Check a sample match for handicap data
                if (matchesArray.length > 0) {
                    const sampleMatch = matchesArray[0];
                    console.log(`Sample match keys:`, Object.keys(sampleMatch));
                    if (sampleMatch.match?.asianHandicapOdds) {
                        console.log(`Sample handicap:`, sampleMatch.match.asianHandicapOdds.homeHandicap);
                    }
                }
            } else {
                console.log(`No matches found in ${season}`);
            }
        }
        
        console.log(`📊 Total matches loaded: ${allMatches.length}`);
        
        // Filter for full handicaps only
        const fullHandicapMatches = allMatches.filter(match => {
            return match.match?.asianHandicapOdds?.homeHandicap && 
                   isFullHandicap(match.match.asianHandicapOdds.homeHandicap);
        });
        
        console.log(`🎯 Full handicap matches found: ${fullHandicapMatches.length}`);
        
        // Debug: Show what handicap lines we're seeing
        const allHandicapLines = new Set();
        allMatches.forEach(match => {
            if (match.match?.asianHandicapOdds?.homeHandicap) {
                allHandicapLines.add(match.match.asianHandicapOdds.homeHandicap);
            }
        });
        
        console.log('\n🔍 DEBUG: All handicap lines in data:');
        Array.from(allHandicapLines).sort().forEach(line => {
            const count = allMatches.filter(m => m.match?.asianHandicapOdds?.homeHandicap === line).length;
            const isFullHandicap = !line.includes('/');
            console.log(`  ${line}: ${count} matches ${isFullHandicap ? '(FULL)' : '(QUARTER)'}`);
        });
        
        // Group by handicap level for analysis
        const handicapGroups = {};
        
        fullHandicapMatches.forEach(match => {
            const handicapLine = match.match.asianHandicapOdds.homeHandicap;
            if (!handicapGroups[handicapLine]) {
                handicapGroups[handicapLine] = [];
            }
            handicapGroups[handicapLine].push(match);
        });
        
        console.log('\n📈 Full Handicap Distribution:');
        Object.keys(handicapGroups).sort().forEach(line => {
            console.log(`  ${line}: ${handicapGroups[line].length} matches`);
        });
        
        // Test variable staking on all full handicap matches
        let totalStaked = 0;
        let totalProfit = 0;
        let totalBets = 0;
        let wins = 0;
        let losses = 0;
        let pushes = 0;
        
        const bettingRecords = [];
        
        fullHandicapMatches.forEach(match => {
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
                
                totalStaked += betSize;
                totalProfit += profit;
                totalBets++;
                
                if (outcome === 'Win' || outcome === 'Half Win') wins++;
                else if (outcome === 'Loss' || outcome === 'Half Loss') losses++;
                else pushes++;
                
                bettingRecords.push({
                    date: match.match.date,
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    score: `${homeScore}-${awayScore}`,
                    handicapLine: bet.handicap,
                    betSide: bet.side,
                    betOdds: bet.odds,
                    betSize,
                    outcome,
                    profit: profit.toFixed(2)
                });
            });
        });
        
        const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100) : 0;
        const winRate = totalBets > 0 ? ((wins / totalBets) * 100) : 0;
        
        console.log('\n🎲 FULL HANDICAP VARIABLE STAKING RESULTS:');
        console.log('==========================================');
        console.log(`Total Bets: ${totalBets}`);
        console.log(`Total Staked: $${totalStaked.toLocaleString()}`);
        console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
        console.log(`ROI: ${roi.toFixed(2)}%`);
        console.log(`Win Rate: ${winRate.toFixed(2)}%`);
        console.log(`Wins: ${wins} | Losses: ${losses} | Pushes: ${pushes}`);
        
        // Analyze by handicap level
        console.log('\n📊 BREAKDOWN BY HANDICAP LEVEL:');
        console.log('================================');
        
        const levelStats = {};
        
        bettingRecords.forEach(record => {
            const level = record.handicapLine;
            if (!levelStats[level]) {
                levelStats[level] = {
                    bets: 0,
                    staked: 0,
                    profit: 0,
                    wins: 0,
                    losses: 0,
                    pushes: 0
                };
            }
            
            levelStats[level].bets++;
            levelStats[level].staked += record.betSize;
            levelStats[level].profit += parseFloat(record.profit);
            
            if (record.outcome === 'Win' || record.outcome === 'Half Win') levelStats[level].wins++;
            else if (record.outcome === 'Loss' || record.outcome === 'Half Loss') levelStats[level].losses++;
            else levelStats[level].pushes++;
        });
        
        Object.keys(levelStats).sort().forEach(level => {
            const stats = levelStats[level];
            const levelROI = stats.staked > 0 ? ((stats.profit / stats.staked) * 100) : 0;
            const levelWinRate = stats.bets > 0 ? ((stats.wins / stats.bets) * 100) : 0;
            
            console.log(`${level}: ${stats.bets} bets, ${levelROI.toFixed(2)}% ROI, ${levelWinRate.toFixed(1)}% WR`);
        });
        
        // Compare to constraint arbitrage theory
        console.log('\n🧪 CONSTRAINT ARBITRAGE THEORY VALIDATION:');
        console.log('==========================================');
        
        if (Math.abs(roi) < 2) {
            console.log('✅ THEORY CONFIRMED: Full handicaps show minimal edge (~0% ROI)');
            console.log('   This validates that the constraint arbitrage effect is specific to quarter handicaps');
            console.log('   where HKJC cannot freely adjust lines and must rely on odds adjustments.');
        } else if (roi > 5) {
            console.log('❌ THEORY CHALLENGED: Full handicaps still show significant positive edge');
            console.log('   This suggests variable staking may be a universal edge amplifier');
            console.log('   rather than specific to constraint arbitrage.');
        } else if (roi < -5) {
            console.log('⚠️  UNEXPECTED: Full handicaps show significant negative edge');
            console.log('   This could indicate that higher odds on full handicaps signal worse value');
            console.log('   opposite to the quarter handicap constraint effect.');
        } else {
            console.log('🤔 MIXED RESULTS: Small edge detected, needs further investigation');
            console.log('   The constraint arbitrage theory is partially supported but not definitive.');
        }
        
        // Save detailed results
        const results = {
            summary: {
                totalBets,
                totalStaked,
                totalProfit: totalProfit.toFixed(2),
                roi: roi.toFixed(2),
                winRate: winRate.toFixed(2),
                wins,
                losses,
                pushes,
                generatedAt: new Date().toISOString()
            },
            levelBreakdown: levelStats,
            bettingRecords: bettingRecords.slice(0, 50) // Save first 50 records for review
        };
        
        const outputPath = path.join(__dirname, 'full_handicap_variable_staking_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`\n💾 Detailed results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testFullHandicapVariableStaking(); 