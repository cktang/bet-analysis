const fs = require('fs');
const path = require('path');

// Simple and accurate AH values analysis
function analyzeAHValues() {
    console.log('🔍 ASIAN HANDICAP VALUES ANALYSIS - SIMPLIFIED & ACCURATE\n');
    
    // Load all seasons data
    const seasons = ['2022-2023', '2023-2024', '2024-2025'];
    let allMatches = [];
    
    seasons.forEach(season => {
        const filePath = path.join(__dirname, `data/processed/year-${season}.json`);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const matches = Object.values(data.matches);
            allMatches = allMatches.concat(matches);
            console.log(`📊 Loaded ${matches.length} matches from ${season}`);
        }
    });
    
    console.log(`\n🎯 Total matches analyzed: ${allMatches.length}\n`);
    
    // Track AH values and their results
    const ahStats = {};
    let totalMatches = 0;
    let matchesWithAH = 0;
    
    allMatches.forEach(match => {
        totalMatches++;
        const ah = match.match?.asianHandicapOdds;
        if (!ah || !ah.homeHandicap) return;
        
        matchesWithAH++;
        const homeHandicap = ah.homeHandicap;
        const homeScore = match.match.homeScore;
        const awayScore = match.match.awayScore;
        
        if (!ahStats[homeHandicap]) {
            ahStats[homeHandicap] = {
                count: 0,
                homeWins: 0,
                awayWins: 0,
                draws: 0,
                homeOddsSum: 0,
                awayOddsSum: 0,
                homeBetsWon: 0,
                awayBetsWon: 0,
                homeBetsTotal: 0,
                awayBetsTotal: 0,
                isQuarterBall: homeHandicap.includes('/'),
                examples: []
            };
        }
        
        const stat = ahStats[homeHandicap];
        stat.count++;
        stat.homeOddsSum += ah.homeOdds;
        stat.awayOddsSum += ah.awayOdds;
        
        // Match outcome
        if (homeScore > awayScore) {
            stat.homeWins++;
        } else if (awayScore > homeScore) {
            stat.awayWins++;
        } else {
            stat.draws++;
        }
        
        // AH outcome simulation (betting 100 on each side)
        const homeResult = calculateAHResult(homeScore, awayScore, homeHandicap, 'HOME');
        const awayResult = calculateAHResult(homeScore, awayScore, homeHandicap, 'AWAY');
        
        // Track home bets
        stat.homeBetsTotal++;
        if (homeResult === 'WIN') {
            stat.homeBetsWon++;
        } else if (homeResult === 'HALF_WIN') {
            stat.homeBetsWon += 0.5;
        }
        
        // Track away bets
        stat.awayBetsTotal++;
        if (awayResult === 'WIN') {
            stat.awayBetsWon++;
        } else if (awayResult === 'HALF_WIN') {
            stat.awayBetsWon += 0.5;
        }
        
        // Store some examples
        if (stat.examples.length < 3) {
            stat.examples.push({
                match: `${match.match.homeTeam} ${homeScore}-${awayScore} ${match.match.awayTeam}`,
                homeOdds: ah.homeOdds,
                awayOdds: ah.awayOdds,
                homeResult,
                awayResult
            });
        }
    });
    
    console.log(`📈 Coverage: ${matchesWithAH}/${totalMatches} matches have AH data (${((matchesWithAH/totalMatches)*100).toFixed(1)}%)\n`);
    
    // Sort by frequency
    const sortedHandicaps = Object.keys(ahStats).sort((a, b) => ahStats[b].count - ahStats[a].count);
    
    console.log('📋 ASIAN HANDICAP VALUES OFFERED BY HKJC:\n');
    
    sortedHandicaps.forEach(handicap => {
        const stat = ahStats[handicap];
        const avgHomeOdds = (stat.homeOddsSum / stat.count).toFixed(2);
        const avgAwayOdds = (stat.awayOddsSum / stat.count).toFixed(2);
        const homeWinRate = ((stat.homeBetsWon / stat.homeBetsTotal) * 100).toFixed(1);
        const awayWinRate = ((stat.awayBetsWon / stat.awayBetsTotal) * 100).toFixed(1);
        const homeImpliedProb = (1 / parseFloat(avgHomeOdds) * 100).toFixed(1);
        const awayImpliedProb = (1 / parseFloat(avgAwayOdds) * 100).toFixed(1);
        const frequency = ((stat.count / matchesWithAH) * 100).toFixed(1);
        
        // Calculate simple profitability (win rate - implied probability)
        const homeEdge = parseFloat(homeWinRate) - parseFloat(homeImpliedProb);
        const awayEdge = parseFloat(awayWinRate) - parseFloat(awayImpliedProb);
        
        console.log(`\n${handicap} ${stat.isQuarterBall ? '(Quarter-ball)' : '(Full/Half-ball)'}:`);
        console.log(`  📊 Frequency: ${stat.count} matches (${frequency}%)`);
        console.log(`  🏠 Home: ${homeWinRate}% win rate vs ${homeImpliedProb}% implied | Avg odds ${avgHomeOdds} | Edge: ${homeEdge.toFixed(1)}%`);
        console.log(`  ✈️  Away: ${awayWinRate}% win rate vs ${awayImpliedProb}% implied | Avg odds ${avgAwayOdds} | Edge: ${awayEdge.toFixed(1)}%`);
        
        if (Math.abs(homeEdge) > 2 || Math.abs(awayEdge) > 2) {
            const bestSide = Math.abs(homeEdge) > Math.abs(awayEdge) ? 'HOME' : 'AWAY';
            const bestEdge = bestSide === 'HOME' ? homeEdge : awayEdge;
            console.log(`  ⚠️  PROFITABLE: ${bestSide} shows ${bestEdge.toFixed(1)}% edge`);
        }
        
        // Show examples for most common lines
        if (stat.count >= 50) {
            console.log(`  📝 Examples: ${stat.examples.map(ex => 
                `${ex.match} (${ex.homeResult}/${ex.awayResult})`
            ).join(', ')}`);
        }
    });
    
    // Quarter-ball vs Full/Half-ball comparison
    console.log('\n\n🎲 QUARTER-BALL vs FULL/HALF-BALL COMPARISON:\n');
    
    const quarterBallLines = sortedHandicaps.filter(h => h.includes('/'));
    const fullHalfBallLines = sortedHandicaps.filter(h => !h.includes('/'));
    
    let quarterStats = { count: 0, homeWins: 0, awayWins: 0, totalBets: 0 };
    let fullHalfStats = { count: 0, homeWins: 0, awayWins: 0, totalBets: 0 };
    
    quarterBallLines.forEach(h => {
        const stat = ahStats[h];
        quarterStats.count += stat.count;
        quarterStats.homeWins += stat.homeBetsWon;
        quarterStats.awayWins += stat.awayBetsWon;
        quarterStats.totalBets += stat.homeBetsTotal;
    });
    
    fullHalfBallLines.forEach(h => {
        const stat = ahStats[h];
        fullHalfStats.count += stat.count;
        fullHalfStats.homeWins += stat.homeBetsWon;
        fullHalfStats.awayWins += stat.awayBetsWon;
        fullHalfStats.totalBets += stat.homeBetsTotal;
    });
    
    console.log(`Quarter-ball handicaps (${quarterBallLines.join(', ')}):`);
    console.log(`  📊 ${quarterStats.count} matches`);
    console.log(`  🏠 Home win rate: ${((quarterStats.homeWins / quarterStats.totalBets) * 100).toFixed(1)}%`);
    console.log(`  ✈️  Away win rate: ${((quarterStats.awayWins / quarterStats.totalBets) * 100).toFixed(1)}%`);
    
    console.log(`\nFull/Half-ball handicaps (${fullHalfBallLines.join(', ')}):`);
    console.log(`  📊 ${fullHalfStats.count} matches`);
    console.log(`  🏠 Home win rate: ${((fullHalfStats.homeWins / fullHalfStats.totalBets) * 100).toFixed(1)}%`);
    console.log(`  ✈️  Away win rate: ${((fullHalfStats.awayWins / fullHalfStats.totalBets) * 100).toFixed(1)}%`);
    
    // HKJC vs OddsPortal comparison
    console.log('\n\n🏟️ HKJC SPECIFIC INSIGHTS:\n');
    
    const mostCommonLines = sortedHandicaps.slice(0, 10);
    console.log('Most frequently offered AH lines by HKJC:');
    mostCommonLines.forEach((line, index) => {
        const stat = ahStats[line];
        console.log(`${index + 1}. ${line}: ${stat.count} matches (${((stat.count/matchesWithAH)*100).toFixed(1)}%)`);
    });
    
    console.log('\nKey findings:');
    console.log('• HKJC offers limited AH options compared to exchanges');
    console.log('• Most common lines are quarter-ball handicaps around the level line');
    console.log('• This creates potential arbitrage opportunities with other bookmakers');
    
    // Identify potential inefficiencies
    console.log('\n\n💡 POTENTIAL PRICING INEFFICIENCIES:\n');
    
    const inefficiencies = [];
    sortedHandicaps.forEach(handicap => {
        const stat = ahStats[handicap];
        if (stat.count < 20) return; // Minimum sample size
        
        const homeWinRate = (stat.homeBetsWon / stat.homeBetsTotal) * 100;
        const awayWinRate = (stat.awayBetsWon / stat.awayBetsTotal) * 100;
        const avgHomeOdds = stat.homeOddsSum / stat.count;
        const avgAwayOdds = stat.awayOddsSum / stat.count;
        const homeImpliedProb = (1 / avgHomeOdds) * 100;
        const awayImpliedProb = (1 / avgAwayOdds) * 100;
        const homeEdge = homeWinRate - homeImpliedProb;
        const awayEdge = awayWinRate - awayImpliedProb;
        
        if (Math.abs(homeEdge) > 3 || Math.abs(awayEdge) > 3) {
            inefficiencies.push({
                handicap,
                count: stat.count,
                homeEdge: homeEdge.toFixed(1),
                awayEdge: awayEdge.toFixed(1),
                bestSide: Math.abs(homeEdge) > Math.abs(awayEdge) ? 'HOME' : 'AWAY',
                bestEdge: Math.max(Math.abs(homeEdge), Math.abs(awayEdge)).toFixed(1)
            });
        }
    });
    
    if (inefficiencies.length > 0) {
        console.log('Lines with >3% edge opportunities:');
        inefficiencies.sort((a, b) => parseFloat(b.bestEdge) - parseFloat(a.bestEdge));
        inefficiencies.forEach(ineff => {
            console.log(`• ${ineff.handicap}: ${ineff.bestSide} side shows ${ineff.bestEdge}% edge (${ineff.count} matches)`);
        });
    } else {
        console.log('No significant pricing inefficiencies found (>3% edge threshold)');
    }
    
    // Save summary
    const summary = {
        generatedAt: new Date().toISOString(),
        totalMatches: matchesWithAH,
        ahStats,
        quarterVsFullHalf: {
            quarterBall: {
                lines: quarterBallLines,
                matches: quarterStats.count,
                homeWinRate: ((quarterStats.homeWins / quarterStats.totalBets) * 100).toFixed(1)
            },
            fullHalfBall: {
                lines: fullHalfBallLines,
                matches: fullHalfStats.count,
                homeWinRate: ((fullHalfStats.homeWins / fullHalfStats.totalBets) * 100).toFixed(1)
            }
        },
        inefficiencies
    };
    
    fs.writeFileSync('ah_values_simple_analysis.json', JSON.stringify(summary, null, 2));
    console.log('\n💾 Analysis saved to ah_values_simple_analysis.json');
}

// Calculate AH result for a given side
function calculateAHResult(homeScore, awayScore, homeHandicap, side) {
    // Parse handicap value
    let handicapValue;
    let isQuarterBall = false;
    
    if (homeHandicap.includes('/')) {
        // Quarter ball like "0/-0.5" or "-1/-1.5"
        const parts = homeHandicap.split('/');
        handicapValue = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
        isQuarterBall = true;
    } else {
        handicapValue = parseFloat(homeHandicap);
    }
    
    if (side === 'HOME') {
        const adjustedHomeScore = homeScore + handicapValue;
        const adjustedAwayScore = awayScore;
        
        if (adjustedHomeScore > adjustedAwayScore) {
            return 'WIN';
        } else if (adjustedHomeScore < adjustedAwayScore) {
            return 'LOSE';
        } else {
            // Draw with handicap
            if (isQuarterBall) {
                return 'HALF_WIN'; // Quarter ball means half win, half push
            } else {
                return 'PUSH'; // Full/half ball draw = push
            }
        }
    } else { // AWAY
        const adjustedHomeScore = homeScore + handicapValue;
        const adjustedAwayScore = awayScore;
        
        if (adjustedAwayScore > adjustedHomeScore) {
            return 'WIN';
        } else if (adjustedAwayScore < adjustedHomeScore) {
            return 'LOSE';
        } else {
            // Draw with handicap
            if (isQuarterBall) {
                return 'HALF_WIN'; // Quarter ball means half win, half push
            } else {
                return 'PUSH'; // Full/half ball draw = push
            }
        }
    }
}

// Run the analysis
analyzeAHValues();