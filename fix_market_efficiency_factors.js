const fs = require('fs');
const path = require('path');

// Load the combinations file
const combinationsPath = path.join(__dirname, '../../../data/processed/ah_combinations.json');
const combinationsData = JSON.parse(fs.readFileSync(combinationsPath, 'utf8'));

console.log(`Loaded ${combinationsData.combinations.length} combinations`);

let fixedCount = 0;
let strategiesWithIssues = [];

// Fix incorrect marketEfficiency factor expressions
combinationsData.combinations.forEach((combination, index) => {
    let needsUpdate = false;
    
    if (combination.factors) {
        combination.factors = combination.factors.map(factor => {
            let updatedFactor = factor;
            
            // Fix incorrect nested marketEfficiency paths
            const fixes = [
                // Fix the nested paths that don't exist
                ['enhanced.preMatch.marketEfficiency.homeImpliedProb', 'enhanced.homeImpliedProb'],
                ['enhanced.preMatch.marketEfficiency.awayImpliedProb', 'enhanced.awayImpliedProb'],
                ['enhanced.preMatch.marketEfficiency.drawImpliedProb', 'enhanced.drawImpliedProb'],
                ['enhanced.preMatch.marketEfficiency.totalImpliedProb', 'preMatch.marketEfficiency.totalImpliedProb'],
                ['enhanced.preMatch.marketEfficiency.cutPercentage', 'preMatch.marketEfficiency.hadCut'],
                
                // Fix paths missing 'preMatch' prefix
                ['enhanced.marketEfficiency.homeImpliedProb', 'enhanced.homeImpliedProb'],
                ['enhanced.marketEfficiency.awayImpliedProb', 'enhanced.awayImpliedProb'],
                ['enhanced.marketEfficiency.drawImpliedProb', 'enhanced.drawImpliedProb'],
                ['enhanced.marketEfficiency.totalImpliedProb', 'preMatch.marketEfficiency.totalImpliedProb'],
                ['enhanced.marketEfficiency.cutPercentage', 'preMatch.marketEfficiency.hadCut'],
            ];
            
            fixes.forEach(([incorrect, correct]) => {
                if (factor.includes(incorrect)) {
                    updatedFactor = updatedFactor.replace(new RegExp(incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correct);
                    needsUpdate = true;
                    console.log(`Fixed in ${combination.name}: ${incorrect} → ${correct}`);
                }
            });
            
            return updatedFactor;
        });
    }
    
    if (needsUpdate) {
        fixedCount++;
        strategiesWithIssues.push(combination.name);
    }
});

console.log(`\n📊 Fixed ${fixedCount} strategies with incorrect marketEfficiency paths:`);
strategiesWithIssues.forEach(name => console.log(`  - ${name}`));

// Save the updated combinations
fs.writeFileSync(combinationsPath, JSON.stringify(combinationsData, null, 2));
console.log(`\n✅ Updated combinations saved to ${combinationsPath}`);
console.log(`Total strategies: ${combinationsData.combinations.length}`);
console.log(`Fixed strategies: ${fixedCount}`);
console.log(`\nThese fixes should resolve the "Insufficient valid samples" errors!`); 