const fs = require('fs');

// Load complete results
const results = JSON.parse(fs.readFileSync('results/complete_discovery.json', 'utf8'));

// Find patterns containing awayFavorite
const awayFavoritePatterns = results.filter(r => r.name.includes('awayFavorite'));

console.log('🔍 Away Favorite Patterns (corrected results):');
console.log(`Found ${awayFavoritePatterns.length} patterns\n`);

// Show top 5 awayFavorite patterns
awayFavoritePatterns
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5)
    .forEach((pattern, i) => {
        console.log(`${i + 1}. ${pattern.name}`);
        console.log(`   ROI: ${pattern.roi}% (was 70%+ before fix)`);
        console.log(`   Bets: ${pattern.bets}, Wins: ${pattern.wins}, Losses: ${pattern.losses}`);
        console.log(`   Win Rate: ${pattern.winRate}%`);
        console.log('');
    });

// Check the specific pattern that had 70% ROI
const specificPattern = results.find(r => r.name.includes('awayFavorite') && r.name.includes('extreme'));
if (specificPattern) {
    console.log('🎯 Specific pattern that had 70% ROI:');
    console.log(`   Name: ${specificPattern.name}`);
    console.log(`   Corrected ROI: ${specificPattern.roi}%`);
    console.log(`   Bets: ${specificPattern.bets}, Wins: ${specificPattern.wins}, Losses: ${specificPattern.losses}`);
} 