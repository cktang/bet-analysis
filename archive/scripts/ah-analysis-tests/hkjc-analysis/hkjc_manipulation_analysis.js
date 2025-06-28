// HKJC Manipulation Analysis - Testing the "Extreme Odds Theory"
// Theory: HKJC deliberately chooses quarter handicaps vs simple handicaps
// to offer extreme odds when they have strong conviction about outcomes

const fs = require('fs');

// Load all seasons data
const data2022File = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const data2023File = JSON.parse(fs.readFileSync('../../data/enhanced/year-2023-2024-enhanced.json', 'utf8'));
const data2024File = JSON.parse(fs.readFileSync('../../data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

// Extract matches from the structured data
const matches2022 = Object.values(data2022File.matches || {});
const matches2023 = Object.values(data2023File.matches || {});
const matches2024 = Object.values(data2024File.matches || {});

const allMatches = [...matches2022, ...matches2023, ...matches2024];

console.log('🔍 HKJC MANIPULATION ANALYSIS');
console.log(`📊 Total matches: ${allMatches.length}`);

// 1. EXTREME ODDS DETECTION
function analyzeExtremeOdds() {
    console.log('\n🚨 === EXTREME ODDS ANALYSIS ===');
    
    const extremeOddsMatches = [];
    const quarterHandicaps = [];
    const simpleHandicaps = [];
    
    allMatches.forEach(match => {
        const matchData = match.preMatch?.match;
        const homeOdds = matchData?.asianHandicapOdds?.homeOdds;
        const awayOdds = matchData?.asianHandicapOdds?.awayOdds;
        const handicap = matchData?.asianHandicapOdds?.homeHandicap;
        
        if (!homeOdds || !awayOdds || !handicap || !matchData) return;
        
        // Classify handicap type
        if (handicap.includes('/')) {
            quarterHandicaps.push(match);
        } else {
            simpleHandicaps.push(match);
        }
        
        // Detect extreme odds (< 1.7 or > 2.3)
        if (homeOdds < 1.7 || homeOdds > 2.3 || awayOdds < 1.7 || awayOdds > 2.3) {
            extremeOddsMatches.push({
                date: matchData.date,
                homeTeam: matchData.homeTeam,
                awayTeam: matchData.awayTeam,
                handicap: handicap,
                homeOdds: homeOdds,
                awayOdds: awayOdds,
                homeScore: matchData.homeScore,
                awayScore: matchData.awayScore,
                homeWin: matchData.homeScore > matchData.awayScore,
                awayWin: matchData.awayScore > matchData.homeScore,
                draw: matchData.homeScore === matchData.awayScore,
                isQuarter: handicap.includes('/'),
                week: match.preMatch?.fbref?.week || 'Unknown'
            });
        }
    });
    
    console.log(`📈 Quarter handicaps: ${quarterHandicaps.length}`);
    console.log(`📉 Simple handicaps: ${simpleHandicaps.length}`);
    console.log(`⚡ Extreme odds matches: ${extremeOddsMatches.length}`);
    
    return { extremeOddsMatches, quarterHandicaps, simpleHandicaps };
}

// 2. HKJC ACCURACY ANALYSIS
function analyzeHKJCAccuracy(extremeMatches) {
    console.log('\n🎯 === HKJC PREDICTION ACCURACY ===');
    
    const lowOddsWins = [];
    const highOddsWins = [];
    
    extremeMatches.forEach(match => {
        if (match.homeOdds < 1.7) {
            // HKJC offered very low odds on home team
            lowOddsWins.push({
                ...match,
                hkjcPrediction: 'Home',
                hkjcCorrect: match.homeWin,
                hkjcOdds: match.homeOdds
            });
        }
        
        if (match.awayOdds < 1.7) {
            // HKJC offered very low odds on away team  
            lowOddsWins.push({
                ...match,
                hkjcPrediction: 'Away',
                hkjcCorrect: match.awayWin,
                hkjcOdds: match.awayOdds
            });
        }
    });
    
    const correctPredictions = lowOddsWins.filter(m => m.hkjcCorrect).length;
    const totalPredictions = lowOddsWins.length;
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions * 100).toFixed(1) : 0;
    
    console.log(`🎲 HKJC low odds predictions: ${totalPredictions}`);
    console.log(`✅ Correct predictions: ${correctPredictions}`);
    console.log(`📊 HKJC accuracy: ${accuracy}%`);
    
    // Expected accuracy from odds
    const avgOdds = lowOddsWins.length > 0 ? 
        lowOddsWins.reduce((sum, m) => sum + m.hkjcOdds, 0) / lowOddsWins.length : 0;
    const impliedProb = avgOdds > 0 ? (1 / avgOdds * 100).toFixed(1) : 0;
    
    console.log(`🎯 Implied probability from odds: ${impliedProb}%`);
    console.log(`💰 HKJC edge: ${accuracy > impliedProb ? '+' : ''}${(accuracy - impliedProb).toFixed(1)}%`);
    
    return { lowOddsWins, accuracy, impliedProb };
}

// 3. FORMAT CHOICE ANALYSIS
function analyzeFormatChoice(quarterHandicaps, simpleHandicaps) {
    console.log('\n⚖️ === FORMAT CHOICE ANALYSIS ===');
    
    // Group by similar strength (odds ranges)
    const oddsRanges = [
        { min: 1.5, max: 1.8, label: 'Heavy Favorites' },
        { min: 1.8, max: 2.0, label: 'Moderate Favorites' },
        { min: 2.0, max: 2.2, label: 'Slight Favorites' },
        { min: 2.2, max: 2.5, label: 'Near Even' }
    ];
    
    oddsRanges.forEach(range => {
        const quarterInRange = quarterHandicaps.filter(m => 
            m.preMatch?.match?.asianHandicapOdds?.homeOdds >= range.min && 
            m.preMatch?.match?.asianHandicapOdds?.homeOdds < range.max
        );
        
        const simpleInRange = simpleHandicaps.filter(m =>
            m.preMatch?.match?.asianHandicapOdds?.homeOdds >= range.min && 
            m.preMatch?.match?.asianHandicapOdds?.homeOdds < range.max
        );
        
        console.log(`📋 ${range.label} (${range.min}-${range.max}):`);
        console.log(`   Quarter: ${quarterInRange.length} | Simple: ${simpleInRange.length}`);
        
        if (quarterInRange.length > 0 && simpleInRange.length > 0) {
            const quarterWinRate = quarterInRange.filter(m => m.preMatch?.match?.homeScore > m.preMatch?.match?.awayScore).length / quarterInRange.length;
            const simpleWinRate = simpleInRange.filter(m => m.preMatch?.match?.homeScore > m.preMatch?.match?.awayScore).length / simpleInRange.length;
            
            console.log(`   Quarter home win rate: ${(quarterWinRate * 100).toFixed(1)}%`);
            console.log(`   Simple home win rate: ${(simpleWinRate * 100).toFixed(1)}%`);
        }
    });
}

// 4. QUARTER VS SIMPLE EDGE ANALYSIS
function analyzeQuarterVsSimpleEdge(quarterHandicaps, simpleHandicaps) {
    console.log('\n🔄 === QUARTER VS SIMPLE EDGE ANALYSIS ===');
    
    // Test quarter fade strategy on different formats
    const earlyQuarter = quarterHandicaps.filter(m => 
        (m.fbref?.week || 999) <= 8 && 
        m.asianHandicapOdds?.homeHandicap === '0/-0.5'
    );
    
    const earlySimple = simpleHandicaps.filter(m =>
        (m.fbref?.week || 999) <= 8 &&
        Math.abs(parseFloat(m.asianHandicapOdds?.homeHandicap || '999')) <= 0.5
    );
    
    // Calculate fade performance
    const quarterAwayWins = earlyQuarter.filter(m => m.awayScore > m.homeScore).length;
    const quarterDraws = earlyQuarter.filter(m => m.homeScore === m.awayScore).length;
    const quarterAwayEdge = earlyQuarter.length > 0 ? 
        (quarterAwayWins + quarterDraws * 0.5) / earlyQuarter.length : 0;
    
    const simpleAwayWins = earlySimple.filter(m => m.awayScore > m.homeScore).length;
    const simpleDraws = earlySimple.filter(m => m.homeScore === m.awayScore).length;  
    const simpleAwayEdge = earlySimple.length > 0 ?
        (simpleAwayWins + simpleDraws * 0.5) / earlySimple.length : 0;
    
    console.log(`🎯 Early season quarter (0/-0.5) fade:`);
    console.log(`   Matches: ${earlyQuarter.length}`);
    console.log(`   Away edge: ${(quarterAwayEdge * 100).toFixed(1)}%`);
    
    console.log(`🎯 Early season simple (level/±0.5) fade:`);
    console.log(`   Matches: ${earlySimple.length}`);
    console.log(`   Away edge: ${(simpleAwayEdge * 100).toFixed(1)}%`);
    
    console.log(`💡 Quarter vs Simple edge difference: ${((quarterAwayEdge - simpleAwayEdge) * 100).toFixed(1)}%`);
}

// 5. SPECIFIC EXTREME CASES
function showExtremeExamples(extremeMatches) {
    console.log('\n🔍 === EXTREME CASES EXAMPLES ===');
    
    // Show most extreme cases
    const veryExtreme = extremeMatches
        .filter(m => m.homeOdds < 1.6 || m.awayOdds < 1.6 || m.homeOdds > 2.4 || m.awayOdds > 2.4)
        .slice(0, 10);
    
    veryExtreme.forEach(match => {
        const result = match.homeWin ? 'HOME WIN' : match.awayWin ? 'AWAY WIN' : 'DRAW';
        const correctSide = match.homeOdds < match.awayOdds ? 
            (match.homeWin ? '✅ HKJC RIGHT' : '❌ HKJC WRONG') :
            (match.awayWin ? '✅ HKJC RIGHT' : '❌ HKJC WRONG');
            
        console.log(`📊 ${match.homeTeam} vs ${match.awayTeam}`);
        console.log(`   Handicap: ${match.handicap} | Week: ${match.week}`);
        console.log(`   Odds: ${match.homeOdds} vs ${match.awayOdds}`);
        console.log(`   Result: ${match.homeScore}-${match.awayScore} (${result}) ${correctSide}`);
        console.log('');
    });
}

// MAIN EXECUTION
function main() {
    const { extremeOddsMatches, quarterHandicaps, simpleHandicaps } = analyzeExtremeOdds();
    
    if (extremeOddsMatches.length > 0) {
        analyzeHKJCAccuracy(extremeOddsMatches);
    }
    
    analyzeFormatChoice(quarterHandicaps, simpleHandicaps);
    analyzeQuarterVsSimpleEdge(quarterHandicaps, simpleHandicaps);
    
    if (extremeOddsMatches.length > 0) {
        showExtremeExamples(extremeOddsMatches);
    }
    
    // CONCLUSION
    console.log('\n🏆 === CONCLUSION ===');
    console.log('This analysis tests the theory that HKJC deliberately');
    console.log('chooses quarter handicaps vs simple handicaps to');
    console.log('offer extreme odds when they have strong conviction.');
    
    // Save detailed results
    const results = {
        extremeOddsMatches,
        quarterHandicaps: quarterHandicaps.length,
        simpleHandicaps: simpleHandicaps.length,
        analysis: 'HKJC Manipulation Theory Test'
    };
    
    fs.writeFileSync('hkjc_manipulation_results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to hkjc_manipulation_results.json');
}

main(); 