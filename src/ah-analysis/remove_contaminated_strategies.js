const fs = require('fs');
const { validateAsianHandicapFactor } = require('./ah_validation_utils');

console.log('🧹 REMOVING CONTAMINATED STRATEGIES (1X2 FACTORS)');
console.log('=================================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const latestIteration = data.iterations[data.iterations.length - 1];
const originalStrategies = latestIteration.results || [];

console.log(`📊 Original strategies: ${originalStrategies.length}`);

const cleanStrategies = [];
const contaminatedStrategies = [];

originalStrategies.forEach(strategy => {
    let isClean = true;
    
    strategy.factors?.forEach(factor => {
        const validation = validateAsianHandicapFactor(factor);
        if (!validation.isValid) {
            isClean = false;
        }
    });
    
    if (isClean) {
        cleanStrategies.push(strategy);
    } else {
        contaminatedStrategies.push(strategy);
        console.log(`❌ REMOVING: ${strategy.name}`);
    }
});

console.log(`\n📊 RESULTS:`);
console.log(`✅ Clean strategies: ${cleanStrategies.length}`);
console.log(`❌ Contaminated strategies removed: ${contaminatedStrategies.length}`);

// Update with clean strategies only
latestIteration.results = cleanStrategies;

// Create backup and save
const backupPath = resultsPath + '.backup.' + Date.now();
fs.copyFileSync(resultsPath, backupPath);
fs.writeFileSync(resultsPath, JSON.stringify(data, null, 2));

console.log(`💾 Backup: ${backupPath}`);
console.log(`✅ Updated: ${resultsPath}`);
console.log('\n🎉 ALL REMAINING STRATEGIES ARE NOW ASIAN HANDICAP COMPLIANT!');
