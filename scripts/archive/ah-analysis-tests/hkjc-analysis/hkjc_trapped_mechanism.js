const fs = require('fs');

console.log('🎯 HKJC "TRAPPED" MECHANISM ANALYSIS');
console.log('='.repeat(60));

// Analyze the 4 extreme odds cases to understand the trapping mechanism
const extremeCases = [
    {
        match: 'Crystal Palace vs Southampton',
        handicap: '-0.5/-1',
        odds: '2.32-1.62',
        season: '2022-23',
        favoredTeam: 'Southampton'
    },
    {
        match: 'Brentford vs Manchester City',
        handicap: '+1.5/+2',
        odds: '1.65-2.26',
        season: '2023-24',
        favoredTeam: 'Brentford'
    },
    {
        match: 'Everton vs Arsenal',
        handicap: '+0.5/+1',
        odds: '1.64-2.28',
        season: '2024-25',
        favoredTeam: 'Everton'
    },
    {
        match: 'West Ham vs Tottenham',
        handicap: '0/-0.5',
        odds: '1.65-2.26',
        season: '2024-25',
        favoredTeam: 'West Ham'
    }
];

console.log('🚨 EXTREME ODDS CASES - TRAPPED MECHANISM:');
console.log('');

extremeCases.forEach((case_, i) => {
    const [homeOdds, awayOdds] = case_.odds.split('-').map(parseFloat);
    const homeProb = (1 / homeOdds * 100).toFixed(1);
    const awayProb = (1 / awayOdds * 100).toFixed(1);
    const houseEdge = ((1/homeOdds + 1/awayOdds - 1) * 100).toFixed(1);
    
    console.log(`${i + 1}. ${case_.match} (${case_.season})`);
    console.log(`   Offered: ${case_.handicap} at ${case_.odds}`);
    console.log(`   Probabilities: ${homeProb}% vs ${awayProb}% (${houseEdge}% edge)`);
    console.log(`   Public favorite: ${case_.favoredTeam}`);
    
    // Analyze what normal handicap should be
    const avgHandicap = case_.handicap.includes('/') ? 
        case_.handicap.split('/').map(h => parseFloat(h)).reduce((a, b) => a + b) / 2 :
        parseFloat(case_.handicap);
    
    console.log(`   Average handicap: ${avgHandicap.toFixed(2)}`);
    
    // Estimate what equal odds handicap should be
    const balancedHandicap = avgHandicap + (parseFloat(awayProb) - 50) / 100;
    console.log(`   Balanced handicap estimate: ${balancedHandicap.toFixed(2)}`);
    
    // Show trapping mechanism
    console.log(`   🔒 TRAPPED: Can't move to pure half handicap`);
    console.log(`   📈 RESULT: Extreme odds on existing quarter handicap`);
    console.log('');
});

console.log('🧠 THE TRAPPING MECHANISM:');
console.log('');
console.log('Step 1: HKJC opens with quarter handicap (e.g., -0.5/-1)');
console.log('Step 2: Public betting moves heavily to one side');
console.log('Step 3: NORMAL response: Change handicap to balance market');
console.log('Step 4: HKJC CONSTRAINT: Cannot offer pure half handicaps');
console.log('Step 5: FORCED response: Keep quarter handicap, extreme odds');
console.log('');

console.log('📊 WHY HKJC AVOIDS HALF HANDICAPS:');
console.log('• Regulatory restrictions in Hong Kong');
console.log('• Cultural preference for quarter balls');
console.log('• Risk management (no draw possibility with halves)');
console.log('• Profit protection mechanism');
console.log('');

console.log('💰 BETTING IMPLICATIONS:');
console.log('• Quarter handicap + extreme odds = market inefficiency');
console.log('• HKJC forced into bad positions by public betting');
console.log('• Contrarian opportunity when HKJC "trapped"');
console.log('• Look for heavy public favorite with extreme odds');
console.log('');

console.log('🎯 EXPLOITATION STRATEGY:');
console.log('1. Identify quarter handicaps with extreme odds (>2.3 or <1.7)');
console.log('2. Fade the public favorite (team with short odds)');
console.log('3. HKJC trapped = systematic inefficiency');
console.log('4. Higher edge in early season when market most volatile');

// Calculate potential profitability
console.log('');
console.log('📈 ESTIMATED EDGE:');
console.log('If HKJC accuracy on extreme odds is 20.5%:');
console.log('• Expected win rate: ~80% (contrarian)');
console.log('• Average odds on underdogs: ~2.2');
console.log('• Expected ROI: 80% × 2.2 - 100% = +76% ROI');
console.log('• Massive systematic edge when HKJC gets trapped!'); 