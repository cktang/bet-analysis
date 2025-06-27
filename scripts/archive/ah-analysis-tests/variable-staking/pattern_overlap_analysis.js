const fs = require('fs');

console.log('🔍 PATTERN OVERLAP ANALYSIS');
console.log('='.repeat(60));
console.log('🤔 Question: Do these two patterns describe the SAME phenomenon?');
console.log('   1) Early season gradient: Strong favorites (1.60-1.75) underperform');
console.log('   2) Early season away strategy: Bet away in 0/-0.5 handicaps');
console.log('');

// Load data
const data2022 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const data2023 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2023-2024-enhanced.json', 'utf8'));  
const data2024 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

const allMatches = [
    ...Object.values(data2022.matches || {}),
    ...Object.values(data2023.matches || {}),
    ...Object.values(data2024.matches || {})
];

console.log(`📊 Total matches loaded: ${allMatches.length}\n`);

// Analyze early season 0/-0.5 handicaps specifically
function analyzeEarlySeasonQuarterFavorites() {
    const earlySeasonQuarters = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        const week = match.preMatch?.fbref?.week;
        
        if (!ah?.homeHandicap || !matchInfo || !week) return;
        if (week > 8) return; // Early season only
        if (ah.homeHandicap !== '0/-0.5') return; // Classic quarter favorite only
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        
        // Calculate AH result
        const handicapValues = ah.homeHandicap.split('/').map(h => parseFloat(h));
        const avgHandicap = handicapValues.reduce((a, b) => a + b) / handicapValues.length;
        const adjustedHomeScore = matchInfo.homeScore + avgHandicap;
        
        let ahWinner = 'draw';
        if (adjustedHomeScore > matchInfo.awayScore) ahWinner = 'home';
        if (adjustedHomeScore < matchInfo.awayScore) ahWinner = 'away';
        
        earlySeasonQuarters.push({
            date: matchInfo.date,
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            homeScore: matchInfo.homeScore,
            awayScore: matchInfo.awayScore,
            handicap: ah.homeHandicap,
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            ahWinner: ahWinner,
            week: week,
            homeInGradientRange: homeOdds >= 1.60 && homeOdds <= 1.75,
            awayInGradientRange: awayOdds >= 1.60 && awayOdds <= 1.75
        });
    });
    
    return earlySeasonQuarters;
}

// Run the analysis
console.log('🎯 EARLY SEASON 0/-0.5 HANDICAP ANALYSIS');
console.log('='.repeat(60));

const earlyQuarters = analyzeEarlySeasonQuarterFavorites();

console.log(`📈 Total early season (weeks 1-8) 0/-0.5 handicaps: ${earlyQuarters.length}`);

// Odds distribution analysis
const oddsRanges = [
    { min: 1.50, max: 1.60, label: "1.50-1.60 (Very Strong)" },
    { min: 1.60, max: 1.70, label: "1.60-1.70 (Strong)" },
    { min: 1.70, max: 1.80, label: "1.70-1.80 (Mild)" },
    { min: 1.80, max: 1.90, label: "1.80-1.90 (Slight)" },
    { min: 1.90, max: 2.00, label: "1.90-2.00 (Near Even)" },
    { min: 2.00, max: 2.20, label: "2.00-2.20 (Underdogs)" }
];

console.log('\n📊 ODDS DISTRIBUTION IN EARLY SEASON 0/-0.5 HANDICAPS:');
console.log('-'.repeat(70));
console.log('Range                | Home Count | Away Count | Total | % of Total');
console.log('-'.repeat(70));

let totalGradientOverlap = 0;

oddsRanges.forEach(range => {
    const homeInRange = earlyQuarters.filter(q => q.homeOdds >= range.min && q.homeOdds < range.max).length;
    const awayInRange = earlyQuarters.filter(q => q.awayOdds >= range.min && q.awayOdds < range.max).length;
    const total = homeInRange + awayInRange;
    const percentage = earlyQuarters.length > 0 ? (total / earlyQuarters.length * 100) : 0;
    
    if (range.min === 1.60 && range.max === 1.70) {
        totalGradientOverlap = total;
    }
    
    console.log(`${range.label.padEnd(20)} | ${homeInRange.toString().padStart(10)} | ${awayInRange.toString().padStart(10)} | ${total.toString().padStart(5)} | ${percentage.toFixed(1).padStart(8)}%`);
});

console.log('\n🔍 PATTERN OVERLAP INVESTIGATION:');
console.log('-'.repeat(50));

// Test the away strategy on early season 0/-0.5 handicaps
let awayStrategyBets = 0, awayStrategyWins = 0, awayStrategyProfit = 0;

earlyQuarters.forEach(quarter => {
    awayStrategyBets++;
    
    const betAmount = 100;
    let profit = 0;
    
    if (quarter.ahWinner === 'away') {
        awayStrategyWins++;
        profit = betAmount * (quarter.awayOdds - 1);
    } else if (quarter.ahWinner === 'draw') {
        awayStrategyWins += 0.5;
        profit = (betAmount * (quarter.awayOdds - 1)) / 2;
    } else {
        profit = -betAmount;
    }
    
    awayStrategyProfit += profit;
});

const awayStrategyWinRate = awayStrategyBets > 0 ? (awayStrategyWins / awayStrategyBets * 100) : 0;
const awayStrategyROI = awayStrategyBets > 0 ? (awayStrategyProfit / (awayStrategyBets * 100) * 100) : 0;

console.log(`📈 Away Strategy Performance (Early Season 0/-0.5):`);
console.log(`   Bets: ${awayStrategyBets}`);
console.log(`   Win Rate: ${awayStrategyWinRate.toFixed(1)}%`);
console.log(`   ROI: ${awayStrategyROI.toFixed(1)}%`);

// Test performance by odds ranges
console.log('\n📊 AWAY STRATEGY PERFORMANCE BY HOME TEAM ODDS:');
console.log('-'.repeat(65));
console.log('Home Odds Range      | Bets | Win Rate | ROI    | Avg Away Odds');
console.log('-'.repeat(65));

oddsRanges.forEach(range => {
    const quarterSubset = earlyQuarters.filter(q => q.homeOdds >= range.min && q.homeOdds < range.max);
    
    if (quarterSubset.length === 0) return;
    
    let bets = 0, wins = 0, profit = 0, oddsSum = 0;
    
    quarterSubset.forEach(quarter => {
        bets++;
        oddsSum += quarter.awayOdds;
        
        const betAmount = 100;
        let quarterProfit = 0;
        
        if (quarter.ahWinner === 'away') {
            wins++;
            quarterProfit = betAmount * (quarter.awayOdds - 1);
        } else if (quarter.ahWinner === 'draw') {
            wins += 0.5;
            quarterProfit = (betAmount * (quarter.awayOdds - 1)) / 2;
        } else {
            quarterProfit = -betAmount;
        }
        
        profit += quarterProfit;
    });
    
    const winRate = bets > 0 ? (wins / bets * 100) : 0;
    const roi = bets > 0 ? (profit / (bets * 100) * 100) : 0;
    const avgAwayOdds = bets > 0 ? (oddsSum / bets) : 0;
    
    console.log(`${range.label.padEnd(20)} | ${bets.toString().padStart(4)} | ${winRate.toFixed(1).padStart(8)}% | ${roi.toFixed(1).padStart(6)}% | ${avgAwayOdds.toFixed(2).padStart(12)}`);
});

console.log('\n🎯 KEY FINDINGS:');
console.log('-'.repeat(40));

// Calculate overlap statistics
const strongFavoriteHomeTeams = earlyQuarters.filter(q => q.homeOdds >= 1.60 && q.homeOdds <= 1.75).length;
const overlapPercentage = earlyQuarters.length > 0 ? (strongFavoriteHomeTeams / earlyQuarters.length * 100) : 0;

console.log(`• Early season 0/-0.5 handicaps with home odds 1.60-1.75: ${strongFavoriteHomeTeams}/${earlyQuarters.length} (${overlapPercentage.toFixed(1)}%)`);

// Test gradient prediction
const gradientCases = earlyQuarters.filter(q => q.homeOdds >= 1.60 && q.homeOdds <= 1.75);
if (gradientCases.length > 0) {
    let gradientWins = 0, gradientProfit = 0;
    
    gradientCases.forEach(quarter => {
        const betAmount = 100;
        let profit = 0;
        
        if (quarter.ahWinner === 'away') {
            gradientWins++;
            profit = betAmount * (quarter.awayOdds - 1);
        } else if (quarter.ahWinner === 'draw') {
            gradientWins += 0.5;
            profit = (betAmount * (quarter.awayOdds - 1)) / 2;
        } else {
            profit = -betAmount;
        }
        
        gradientProfit += profit;
    });
    
    const gradientWinRate = (gradientWins / gradientCases.length * 100);
    const gradientROI = (gradientProfit / (gradientCases.length * 100) * 100);
    
    console.log(`• Gradient subset (1.60-1.75 home odds) performance:`);
    console.log(`  - Win Rate: ${gradientWinRate.toFixed(1)}% (away strategy)`);
    console.log(`  - ROI: ${gradientROI.toFixed(1)}%`);
}

console.log('\n💡 CONCLUSION:');
if (overlapPercentage > 60) {
    console.log('✅ PATTERNS COINCIDE! The two discoveries describe the SAME phenomenon:');
    console.log('   - Most early season 0/-0.5 handicaps involve strong favorites (1.60-1.75)');
    console.log('   - Away strategy = Fade strong favorites = Same underlying market inefficiency');
} else if (overlapPercentage > 30) {
    console.log('🤔 PARTIAL OVERLAP: The patterns partially coincide but have distinct elements');
} else {
    console.log('❌ SEPARATE PATTERNS: These appear to be different market inefficiencies');
}

console.log('\n✅ Pattern overlap analysis complete!'); 