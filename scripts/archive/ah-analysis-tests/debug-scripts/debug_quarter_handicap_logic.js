const fs = require('fs');

console.log('🔍 DEBUGGING QUARTER HANDICAP LOGIC');
console.log('='.repeat(80));
console.log('🎯 Finding the calculation error - both sides can\'t lose this heavily!');
console.log('');

// Load data
const data2022 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const data2023 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2023-2024-enhanced.json', 'utf8'));  
const data2024 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

const allMatches = [
    ...Object.values(data2022.matches || {}),
    ...Object.values(data2023.matches || {}),
    ...Object.values(data2024.matches || {})
].slice(0, 20); // Just first 20 matches for debugging

function isQuarterHandicap(handicap) {
    return handicap && handicap.includes('/');
}

function homeHasAdvantage(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        return h1 < 0 && h2 < 0;
    }
    return false;
}

function homeIsUnderdog(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        return h1 > 0 && h2 > 0;
    }
    return false;
}

function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    const scoreDiff = homeScore - awayScore;
    const adjustedDiff = betSide === 'home' ? scoreDiff : -scoreDiff;
    
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        const result1 = adjustedDiff > h1 ? 'win' : (adjustedDiff === h1 ? 'push' : 'lose');
        const result2 = adjustedDiff > h2 ? 'win' : (adjustedDiff === h2 ? 'push' : 'lose');
        
        if (result1 === 'win' && result2 === 'win') return 'win';
        if (result1 === 'lose' && result2 === 'lose') return 'lose';
        if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
        if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
        return 'push';
    }
    
    return null;
}

console.log('🔬 DETAILED ANALYSIS OF QUARTER HANDICAP MATCHES:');
console.log('='.repeat(80));

let homeAdvantageCount = 0;
let homeUnderdogCount = 0;
let homeAdvantageResults = { win: 0, lose: 0, push: 0, halfWin: 0, halfLose: 0 };
let homeUnderdogResults = { win: 0, lose: 0, push: 0, halfWin: 0, halfLose: 0 };

allMatches.forEach((match, index) => {
    const ah = match.preMatch?.match?.asianHandicapOdds;
    const matchInfo = match.preMatch?.match;
    
    if (!ah?.homeHandicap || !matchInfo) return;
    if (!isQuarterHandicap(ah.homeHandicap)) return;
    if (!ah.homeOdds || !ah.awayOdds) return;
    if (typeof matchInfo.homeScore === 'undefined') return;
    
    const isHomeAdvantage = homeHasAdvantage(ah.homeHandicap);
    const isHomeUnderdog = homeIsUnderdog(ah.homeHandicap);
    
    if (!isHomeAdvantage && !isHomeUnderdog) return; // Skip neutral cases
    
    // Test BOTH betting strategies on the same match
    const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
    const lowerOdds = Math.min(ah.homeOdds, ah.awayOdds);
    
    const higherOddsSide = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
    const lowerOddsSide = ah.homeOdds < ah.awayOdds ? 'home' : 'away';
    
    const higherOddsResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, higherOddsSide);
    const lowerOddsResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, lowerOddsSide);
    
    console.log(`\n📊 Match ${index + 1}: ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`);
    console.log(`   Score: ${matchInfo.homeScore}-${matchInfo.awayScore}`);
    console.log(`   Handicap: ${ah.homeHandicap} (${isHomeAdvantage ? 'HOME ADVANTAGE' : 'HOME UNDERDOG'})`);
    console.log(`   Odds: Home ${ah.homeOdds}, Away ${ah.awayOdds}`);
    console.log(`   Higher odds: ${higherOdds} (${higherOddsSide}) → Result: ${higherOddsResult}`);
    console.log(`   Lower odds: ${lowerOdds} (${lowerOddsSide}) → Result: ${lowerOddsResult}`);
    
    // Count results
    if (isHomeAdvantage) {
        homeAdvantageCount++;
        homeAdvantageResults[higherOddsResult.replace('-', '')]++;
    } else {
        homeUnderdogCount++;
        homeUnderdogResults[higherOddsResult.replace('-', '')]++;
    }
    
    // Check for logical inconsistencies
    if (higherOddsResult === 'lose' && lowerOddsResult === 'lose') {
        console.log(`   ⚠️  WARNING: Both sides lose - this shouldn't happen often!`);
    }
    if (higherOddsResult === 'win' && lowerOddsResult === 'win') {
        console.log(`   ⚠️  WARNING: Both sides win - this shouldn't happen often!`);
    }
});

console.log('\n📊 SUMMARY STATISTICS:');
console.log('='.repeat(60));
console.log(`🏠 Home Advantage Quarter Handicaps: ${homeAdvantageCount} matches`);
console.log(`   Higher odds betting results:`, homeAdvantageResults);

console.log(`🏃 Home Underdog Quarter Handicaps: ${homeUnderdogCount} matches`);
console.log(`   Higher odds betting results:`, homeUnderdogResults);

// Calculate win rates for verification
const homeAdvantageWinRate = homeAdvantageCount > 0 ? 
    ((homeAdvantageResults.win + homeAdvantageResults.halfWin * 0.5) / homeAdvantageCount * 100).toFixed(1) : 0;
const homeUnderdogWinRate = homeUnderdogCount > 0 ? 
    ((homeUnderdogResults.win + homeUnderdogResults.halfWin * 0.5) / homeUnderdogCount * 100).toFixed(1) : 0;

console.log(`\n🎲 Win Rates (approximate from small sample):`);
console.log(`🏠 Home Advantage + Higher Odds: ${homeAdvantageWinRate}%`);
console.log(`🏃 Home Underdog + Higher Odds: ${homeUnderdogWinRate}%`);

console.log('\n🔍 Looking for the calculation bug...');
console.log('If both strategies are losing heavily, there might be:');
console.log('1. Wrong handicap application logic');
console.log('2. Incorrect bet side determination');
console.log('3. Misunderstanding of quarter handicap rules');
console.log('4. Data quality issues');

console.log('\n✅ Debug analysis complete!'); 