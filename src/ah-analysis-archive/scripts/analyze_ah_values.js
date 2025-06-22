const fs = require('fs');
const path = require('path');

// Script to analyze AH values and profitability by specific handicap lines
function analyzeAHValues() {
    console.log('🔍 COMPREHENSIVE ASIAN HANDICAP VALUE ANALYSIS\n');
    
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
    
    // Analyze AH values distribution
    const ahAnalysis = {};
    const hkjcVsOddsportalComparison = {};
    const quarterBallAnalysis = {};
    
    allMatches.forEach(match => {
        const ah = match.match?.asianHandicapOdds;
        if (!ah || !ah.homeHandicap) return;
        
        const homeHandicap = ah.homeHandicap;
        const awayHandicap = ah.awayHandicap;
        
        // Initialize tracking for this handicap
        if (!ahAnalysis[homeHandicap]) {
            ahAnalysis[homeHandicap] = {
                count: 0,
                homeWins: 0,
                awayWins: 0,
                draws: 0,
                totalHomeOdds: 0,
                totalAwayOdds: 0,
                profitHome: 0,
                profitAway: 0,
                isQuarterBall: homeHandicap.includes('/'),
                matches: []
            };
        }
        
        const analysis = ahAnalysis[homeHandicap];
        analysis.count++;
        analysis.totalHomeOdds += ah.homeOdds;
        analysis.totalAwayOdds += ah.awayOdds;
        
        // Determine match outcome
        const homeScore = match.match.homeScore;
        const awayScore = match.match.awayScore;
        
        if (homeScore > awayScore) {
            analysis.homeWins++;
        } else if (awayScore > homeScore) {
            analysis.awayWins++;
        } else {
            analysis.draws++;
        }
        
        // Calculate AH profit based on handicap
        const ahResult = calculateAHResult(homeScore, awayScore, homeHandicap, ah.homeOdds, ah.awayOdds);
        analysis.profitHome += ahResult.homeProfit;
        analysis.profitAway += ahResult.awayProfit;
        
        // Store match details
        analysis.matches.push({
            homeTeam: match.match.homeTeam,
            awayTeam: match.match.awayTeam,
            homeScore,
            awayScore,
            homeOdds: ah.homeOdds,
            awayOdds: ah.awayOdds,
            homeProfit: ahResult.homeProfit,
            awayProfit: ahResult.awayProfit
        });
        
        // Quarter ball analysis
        if (homeHandicap.includes('/')) {
            if (!quarterBallAnalysis[homeHandicap]) {
                quarterBallAnalysis[homeHandicap] = {
                    count: 0,
                    totalProfitHome: 0,
                    totalProfitAway: 0
                };
            }
            quarterBallAnalysis[homeHandicap].count++;
            quarterBallAnalysis[homeHandicap].totalProfitHome += ahResult.homeProfit;
            quarterBallAnalysis[homeHandicap].totalProfitAway += ahResult.awayProfit;
        }
    });
    
    // Generate comprehensive report
    console.log('📋 ASIAN HANDICAP VALUES DISTRIBUTION:\n');
    
    const sortedHandicaps = Object.keys(ahAnalysis).sort((a, b) => ahAnalysis[b].count - ahAnalysis[a].count);
    
    sortedHandicaps.forEach(handicap => {
        const data = ahAnalysis[handicap];
        const avgHomeOdds = (data.totalHomeOdds / data.count).toFixed(2);
        const avgAwayOdds = (data.totalAwayOdds / data.count).toFixed(2);
        const homeProfitability = ((data.profitHome / data.count) * 100).toFixed(2);
        const awayProfitability = ((data.profitAway / data.count) * 100).toFixed(2);
        const homeWinRate = ((data.homeWins / data.count) * 100).toFixed(1);
        const awayWinRate = ((data.awayWins / data.count) * 100).toFixed(1);
        
        console.log(`\n${handicap} (${data.isQuarterBall ? 'Quarter-ball' : 'Full/Half-ball'}):`);
        console.log(`  📊 Frequency: ${data.count} matches (${((data.count / allMatches.length) * 100).toFixed(1)}%)`);
        console.log(`  🏠 Home: Win Rate ${homeWinRate}% | Avg Odds ${avgHomeOdds} | Profitability ${homeProfitability}%`);
        console.log(`  ✈️  Away: Win Rate ${awayWinRate}% | Avg Odds ${avgAwayOdds} | Profitability ${awayProfitability}%`);
        
        if (Math.abs(parseFloat(homeProfitability)) > 2 || Math.abs(parseFloat(awayProfitability)) > 2) {
            console.log(`  ⚠️  PROFITABLE OPPORTUNITY: ${homeProfitability > 2 ? 'HOME' : 'AWAY'} side shows >2% edge`);
        }
    });
    
    console.log('\n\n🎲 QUARTER-BALL vs FULL/HALF-BALL ANALYSIS:\n');
    
    const quarterBallHandicaps = sortedHandicaps.filter(h => h.includes('/'));
    const fullHalfBallHandicaps = sortedHandicaps.filter(h => !h.includes('/'));
    
    let quarterBallTotal = { count: 0, profitHome: 0, profitAway: 0 };
    let fullHalfBallTotal = { count: 0, profitHome: 0, profitAway: 0 };
    
    quarterBallHandicaps.forEach(h => {
        quarterBallTotal.count += ahAnalysis[h].count;
        quarterBallTotal.profitHome += ahAnalysis[h].profitHome;
        quarterBallTotal.profitAway += ahAnalysis[h].profitAway;
    });
    
    fullHalfBallHandicaps.forEach(h => {
        fullHalfBallTotal.count += ahAnalysis[h].count;
        fullHalfBallTotal.profitHome += ahAnalysis[h].profitHome;
        fullHalfBallTotal.profitAway += ahAnalysis[h].profitAway;
    });
    
    console.log(`Quarter-ball handicaps (-0.25, -0.75, -1.25, etc.):`);
    console.log(`  📊 Total matches: ${quarterBallTotal.count}`);
    console.log(`  🏠 Home profitability: ${((quarterBallTotal.profitHome / quarterBallTotal.count) * 100).toFixed(2)}%`);
    console.log(`  ✈️  Away profitability: ${((quarterBallTotal.profitAway / quarterBallTotal.count) * 100).toFixed(2)}%`);
    
    console.log(`\nFull/Half-ball handicaps (-0.5, -1, -1.5, etc.):`);
    console.log(`  📊 Total matches: ${fullHalfBallTotal.count}`);
    console.log(`  🏠 Home profitability: ${((fullHalfBallTotal.profitHome / fullHalfBallTotal.count) * 100).toFixed(2)}%`);
    console.log(`  ✈️  Away profitability: ${((fullHalfBallTotal.profitAway / fullHalfBallTotal.count) * 100).toFixed(2)}%`);
    
    console.log('\n\n🏆 MOST PROFITABLE HANDICAP LINES:\n');
    
    const profitableLines = sortedHandicaps
        .map(h => ({
            handicap: h,
            count: ahAnalysis[h].count,
            homeProfitability: (ahAnalysis[h].profitHome / ahAnalysis[h].count) * 100,
            awayProfitability: (ahAnalysis[h].profitAway / ahAnalysis[h].count) * 100,
            bestSide: null
        }))
        .map(line => {
            const bestSide = Math.abs(line.homeProfitability) > Math.abs(line.awayProfitability) ? 'HOME' : 'AWAY';
            const bestProfitability = bestSide === 'HOME' ? line.homeProfitability : line.awayProfitability;
            return { ...line, bestSide, bestProfitability };
        })
        .filter(line => line.count >= 20) // Minimum sample size
        .sort((a, b) => Math.abs(b.bestProfitability) - Math.abs(a.bestProfitability));
    
    profitableLines.slice(0, 10).forEach((line, index) => {
        console.log(`${index + 1}. ${line.handicap} (${line.count} matches)`);
        console.log(`   Best side: ${line.bestSide} with ${line.bestProfitability.toFixed(2)}% profitability`);
        console.log(`   Home: ${line.homeProfitability.toFixed(2)}% | Away: ${line.awayProfitability.toFixed(2)}%`);
    });
    
    console.log('\n\n🎯 HKJC PRICING INEFFICIENCIES:\n');
    console.log('Note: This analysis is based on HKJC data which offers limited AH options compared to other bookmakers.\n');
    
    // Identify HKJC specific inefficiencies
    const hkjcInefficiencies = [];
    
    sortedHandicaps.forEach(handicap => {
        const data = ahAnalysis[handicap];
        const homeProfitability = (data.profitHome / data.count) * 100;
        const awayProfitability = (data.profitAway / data.count) * 100;
        
        if (Math.abs(homeProfitability) > 3 || Math.abs(awayProfitability) > 3) {
            hkjcInefficiencies.push({
                handicap,
                count: data.count,
                homeProfitability,
                awayProfitability,
                avgHomeOdds: data.totalHomeOdds / data.count,
                avgAwayOdds: data.totalAwayOdds / data.count
            });
        }
    });
    
    if (hkjcInefficiencies.length > 0) {
        console.log('Identified HKJC pricing inefficiencies (>3% edge):');
        hkjcInefficiencies.forEach(inefficiency => {
            console.log(`\n${inefficiency.handicap}:`);
            console.log(`  Sample size: ${inefficiency.count} matches`);
            console.log(`  Home side: ${inefficiency.homeProfitability.toFixed(2)}% (avg odds ${inefficiency.avgHomeOdds.toFixed(2)})`);
            console.log(`  Away side: ${inefficiency.awayProfitability.toFixed(2)}% (avg odds ${inefficiency.avgAwayOdds.toFixed(2)})`);
        });
    } else {
        console.log('No significant HKJC pricing inefficiencies found (>3% threshold)');
    }
    
    // Save detailed analysis to file
    const reportData = {
        generatedAt: new Date().toISOString(),
        totalMatches: allMatches.length,
        ahAnalysis,
        quarterBallAnalysis: {
            quarterBallTotal,
            fullHalfBallTotal,
            comparison: {
                quarterBallAvgProfitability: (quarterBallTotal.profitHome + quarterBallTotal.profitAway) / (quarterBallTotal.count * 2),
                fullHalfBallAvgProfitability: (fullHalfBallTotal.profitHome + fullHalfBallTotal.profitAway) / (fullHalfBallTotal.count * 2)
            }
        },
        profitableLines: profitableLines.slice(0, 10),
        hkjcInefficiencies
    };
    
    fs.writeFileSync('ah_values_analysis_report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed analysis saved to ah_values_analysis_report.json');
}

// Calculate AH result based on handicap and match outcome
function calculateAHResult(homeScore, awayScore, homeHandicap, homeOdds, awayOdds) {
    const betAmount = 100; // Standard bet amount for calculation
    
    // Parse handicap - handle quarter balls
    let homeHandicapValue;
    if (homeHandicap.includes('/')) {
        // Quarter ball handicap like "0/-0.5" or "-0.5/-1"
        const parts = homeHandicap.split('/');
        homeHandicapValue = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
    } else {
        homeHandicapValue = parseFloat(homeHandicap);
    }
    
    // Adjust scores with handicap
    const adjustedHomeScore = homeScore + homeHandicapValue;
    const adjustedAwayScore = awayScore - homeHandicapValue;
    
    let homeProfit = 0;
    let awayProfit = 0;
    
    // Calculate profits
    if (adjustedHomeScore > adjustedAwayScore) {
        // Home wins
        homeProfit = betAmount * (homeOdds - 1);
        awayProfit = -betAmount;
    } else if (adjustedAwayScore > adjustedHomeScore) {
        // Away wins
        homeProfit = -betAmount;
        awayProfit = betAmount * (awayOdds - 1);
    } else {
        // Draw with handicap
        if (homeHandicap.includes('/')) {
            // Quarter ball - half win/half push
            homeProfit = (betAmount * (homeOdds - 1)) / 2;
            awayProfit = (betAmount * (awayOdds - 1)) / 2;
        } else {
            // Full/half ball - push
            homeProfit = 0;
            awayProfit = 0;
        }
    }
    
    return { homeProfit, awayProfit };
}

// Run the analysis
analyzeAHValues();