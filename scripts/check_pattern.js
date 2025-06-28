const fs = require('fs');

// Load complete results
const results = JSON.parse(fs.readFileSync('results/complete_discovery.json', 'utf8'));

// Find the specific pattern
const targetPattern = "betSide-away_staking-fixed_ahLevel-awayFavorite_oddsLevel-extreme";
const pattern = results.find(r => r.name === targetPattern);

if (pattern) {
    console.log('🎯 Pattern Details:', targetPattern);
    console.log('📊 Expression:', pattern.expression);
    console.log('📈 Results:');
    console.log(`   Bets: ${pattern.bets}`);
    console.log(`   Wins: ${pattern.wins}`);
    console.log(`   Losses: ${pattern.losses}`);
    console.log(`   Win Rate: ${pattern.winRate}%`);
    console.log(`   ROI: ${pattern.roi}%`);
    console.log(`   Avg Odds: ${pattern.averageOdds}`);
    console.log(`   Bet Side: ${pattern.betSide}`);
    console.log(`   Staking: ${pattern.stakingMethod}`);
    
    // Let's also break down the expression
    console.log('\n🔍 Expression Breakdown:');
    const parts = pattern.expression.split(' && ');
    parts.forEach((part, i) => {
        console.log(`   ${i + 1}. ${part}`);
    });
} else {
    console.log('❌ Pattern not found');
} 