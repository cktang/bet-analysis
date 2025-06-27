const fs = require('fs');

// Load data
const data = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const matches = Object.values(data.matches || {});

console.log('🧠 TESTING: DOES HKJC AVOID HALF HANDICAPS?');
console.log('='.repeat(50));

// Collect all handicaps
const handicapCounts = {};
let totalMatches = 0;

matches.forEach(match => {
    const ah = match.preMatch?.match?.asianHandicapOdds;
    if (!ah?.homeHandicap) return;
    
    const handicap = ah.homeHandicap;
    handicapCounts[handicap] = (handicapCounts[handicap] || 0) + 1;
    totalMatches++;
});

// Categorize handicaps
const allHandicaps = Object.keys(handicapCounts).sort((a, b) => handicapCounts[b] - handicapCounts[a]);

console.log(`\n📊 ALL HANDICAPS OFFERED (${totalMatches} matches):`);
allHandicaps.forEach(h => {
    const count = handicapCounts[h];
    const pct = (count / totalMatches * 100).toFixed(1);
    console.log(`${h}: ${count} (${pct}%)`);
});

// Check for pure half handicaps
const pureHalfHandicaps = allHandicaps.filter(h => 
    h.includes('.5') && !h.includes('/')
);

console.log('\n🔍 PURE HALF HANDICAP CHECK:');
console.log(`Found ${pureHalfHandicaps.length} pure half handicaps:`);

if (pureHalfHandicaps.length === 0) {
    console.log('🚨 CONFIRMED: HKJC OFFERS ZERO PURE HALF HANDICAPS!');
    console.log('They only offer:');
    console.log('• Quarter/split handicaps (0/-0.5, -0.5/-1, etc.)');  
    console.log('• Level handicaps (0, -1, -2, etc.)');
    console.log('• NO pure half handicaps (-0.5, -1.5, etc.)');
} else {
    pureHalfHandicaps.forEach(h => {
        console.log(`  ${h}: ${handicapCounts[h]} matches`);
    });
}

// Now let's analyze the Crystal Palace vs Southampton case
console.log('\n🎯 CRYSTAL PALACE vs SOUTHAMPTON ANALYSIS:');
console.log('Offered: -0.5/-1 at 2.32-1.62');
console.log('This means:');
console.log('• Half bet on Palace -0.5 (must win by 1+)');
console.log('• Half bet on Palace -1 (must win by 2+)');
console.log('• Southampton heavily backed in betting');

// Calculate what the "equal odds" handicap should be
const palaceOdds = 2.32;
const southamptonOdds = 1.62;

// Implied probabilities
const palaceProb = 1 / palaceOdds;
const southamptonProb = 1 / southamptonOdds;
const totalProb = palaceProb + southamptonProb;

console.log(`\nCurrent implied probabilities:`);
console.log(`Palace: ${(palaceProb * 100).toFixed(1)}%`);
console.log(`Southampton: ${(southamptonProb * 100).toFixed(1)}%`);
console.log(`Total: ${(totalProb * 100).toFixed(1)}% (${((totalProb - 1) * 100).toFixed(1)}% house edge)`);

console.log('\n💡 THEORY IMPLICATIONS:');
console.log('If HKJC refuses to offer -0.5 or -1.5 handicaps:');
console.log('• They get "trapped" with -0.5/-1 when market moves');
console.log('• Must adjust odds instead of changing handicap');
console.log('• Creates extreme odds situations we observed');
console.log('• Public betting on Southampton pushed odds to extremes');

console.log('\n🎯 EQUAL ODDS HANDICAP ESTIMATE:');
console.log('For balanced 1.90-1.90 odds, handicap should be around:');
console.log('• Palace 0 to -0.5 (pick\'em to slight favorite)');
console.log('• Current -0.5/-1 with extreme odds suggests heavy Southampton backing'); 