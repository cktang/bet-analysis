const fs = require('fs');
const data = JSON.parse(fs.readFileSync('../../data/processed/year-2023-2024.json', 'utf8'));
const match = Object.values(data.matches)[0];
console.log('Data structure check:');
console.log('Has postMatch?', !!match.postMatch);
console.log('Has postMatch.bettingOutcomes?', !!match.postMatch?.bettingOutcomes);
console.log('Has postMatch.bettingOutcomes.homeProfit?', !!match.postMatch?.bettingOutcomes?.homeProfit);
console.log('Sample profit:', match.postMatch?.bettingOutcomes?.homeProfit);
console.log('Full match structure keys:', Object.keys(match));