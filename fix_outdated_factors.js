const fs = require('fs');
const path = require('path');

// Load the combinations file
const combinationsPath = path.join(__dirname, 'data/processed/ah_combinations.json');
const combinationsData = JSON.parse(fs.readFileSync(combinationsPath, 'utf8'));

console.log(`Loaded ${combinationsData.combinations.length} combinations`);

let fixedCount = 0;
let strategiesWithIssues = [];

// Fix outdated factor expressions
combinationsData.combinations.forEach((combination, index) => {
    let needsUpdate = false;
    
    if (combination.factors) {
        combination.factors = combination.factors.map(factor => {
            let updatedFactor = factor;
            
            // Fix fbref.week -> preMatch.fbref.week
            if (factor.includes('fbref.week') && !factor.includes('preMatch.fbref.week')) {
                updatedFactor = factor.replace(/fbref\.week/g, 'preMatch.fbref.week');
                needsUpdate = true;
                console.log(`Fixed in ${combination.name}: ${factor.substring(0,50)}...`);
            }
            
            return updatedFactor;
        });
    }
    
    if (needsUpdate) {
        fixedCount++;
        strategiesWithIssues.push(combination.name);
    }
});

console.log(`\n📊 Fixed ${fixedCount} strategies with outdated factor expressions:`);
strategiesWithIssues.forEach(name => console.log(`  - ${name}`));

// Save the updated combinations
fs.writeFileSync(combinationsPath, JSON.stringify(combinationsData, null, 2));
console.log(`\n✅ Updated combinations saved to ${combinationsPath}`);
console.log(`Total strategies: ${combinationsData.combinations.length}`);
console.log(`Fixed strategies: ${fixedCount}`); 