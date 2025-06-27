const fs = require('fs');

// Load one season of data for quick test
const data = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const matches = Object.values(data.matches || {});

console.log('🕵️ HKJC MANIPULATION THEORY TEST');
console.log('='.repeat(50));

let quarterCount = 0;
let simpleCount = 0;
let quarterExtreme = 0;
let simpleExtreme = 0;
const extremeExamples = [];

matches.forEach(match => {
  const ah = match.preMatch?.match?.asianHandicapOdds;
  const matchInfo = match.preMatch?.match;
  
  if (!ah?.homeHandicap || !matchInfo) return;
  
  const isQuarter = ah.homeHandicap.includes('/');
  const homeOdds = ah.homeOdds || 2.0;
  const awayOdds = ah.awayOdds || 2.0;
  const minOdds = Math.min(homeOdds, awayOdds);
  const maxOdds = Math.max(homeOdds, awayOdds);
  
  // Count format types
  if (isQuarter) {
    quarterCount++;
  } else {
    simpleCount++;
  }
  
  // Check for extreme odds (very confident HKJC)
  const isExtreme = minOdds <= 1.7 || maxOdds >= 2.3;
  
  if (isExtreme) {
    if (isQuarter) {
      quarterExtreme++;
    } else {
      simpleExtreme++;
    }
    
    if (extremeExamples.length < 8) {
      extremeExamples.push({
        teams: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
        handicap: ah.homeHandicap,
        homeOdds: homeOdds.toFixed(2),
        awayOdds: awayOdds.toFixed(2),
        format: isQuarter ? 'QUARTER' : 'SIMPLE',
        minOdds: minOdds.toFixed(2),
        result: `${matchInfo.homeScore}-${matchInfo.awayScore}`
      });
    }
  }
});

const total = quarterCount + simpleCount;
const totalExtreme = quarterExtreme + simpleExtreme;

console.log(`\n📊 FORMAT DISTRIBUTION (${total} matches):`);
console.log(`Quarter handicaps: ${quarterCount} (${(quarterCount/total*100).toFixed(1)}%)`);
console.log(`Simple handicaps:  ${simpleCount} (${(simpleCount/total*100).toFixed(1)}%)`);

console.log(`\n🚨 EXTREME ODDS CASES (${totalExtreme} matches):`);
console.log(`Quarter extreme: ${quarterExtreme} (${totalExtreme > 0 ? (quarterExtreme/totalExtreme*100).toFixed(1) : 0}%)`);
console.log(`Simple extreme:  ${simpleExtreme} (${totalExtreme > 0 ? (simpleExtreme/totalExtreme*100).toFixed(1) : 0}%)`);

console.log('\n🔍 MANIPULATION THEORY EVIDENCE:');
console.log(`1. HKJC offers ${(quarterCount/total*100).toFixed(1)}% quarter handicaps - why so many?`);
console.log(`2. When offering extreme odds, ${totalExtreme > 0 ? (quarterExtreme/totalExtreme*100).toFixed(1) : 0}% are quarter format`);
console.log(`3. This suggests HKJC chooses quarter when they want extreme odds`);

console.log('\n📋 EXTREME ODDS EXAMPLES:');
extremeExamples.forEach(ex => {
  console.log(`${ex.format}: ${ex.teams}`);
  console.log(`  Handicap: ${ex.handicap} | Odds: ${ex.homeOdds} vs ${ex.awayOdds} | Result: ${ex.result}`);
});

console.log('\n💡 THEORY ASSESSMENT:');
if (quarterCount > simpleCount * 2) {
  console.log('✅ HKJC heavily favors quarter handicaps (suspicious!)');
} else {
  console.log('❌ Quarter/simple ratio seems normal');
}

if (totalExtreme > 0 && quarterExtreme > simpleExtreme) {
  console.log('✅ Quarter format dominates extreme odds cases');
} else {
  console.log('❌ No clear quarter bias in extreme odds');
}

console.log('\n🏆 CONCLUSION:');
if (quarterCount > simpleCount * 2 && quarterExtreme >= simpleExtreme) {
  console.log('🚨 STRONG EVIDENCE supporting manipulation theory!');
  console.log('HKJC appears to deliberately choose quarter handicaps for extreme odds');
} else {
  console.log('📊 Mixed evidence - theory needs more investigation');
} 