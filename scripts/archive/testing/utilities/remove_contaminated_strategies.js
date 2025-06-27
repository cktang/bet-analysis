const fs = require('fs');
const path = require('path');
const { validateAsianHandicapFactor } = require('./ah_validation_utils');

console.log('🧹 REMOVING CONTAMINATED STRATEGIES (1X2 FACTORS)');
console.log('=================================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

// Load analysis results
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const latestIteration = data.iterations[data.iterations.length - 1];
const originalStrategies = latestIteration.results || [];

console.log(`📊 Original strategies: ${originalStrategies.length}`);

// Filter out contaminated strategies
const cleanStrategies = [];
const contaminatedStrategies = [];

originalStrategies.forEach(strategy => {
    let isClean = true;
    
    // Check each factor for 1X2 contamination
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
        
        // Show contaminated factors
        strategy.factors?.forEach((factor, index) => {
            const validation = validateAsianHandicapFactor(factor);
            if (!validation.isValid) {
                console.log(`   Factor ${index + 1}: ${factor}`);
                validation.issues.forEach(issue => {
                    console.log(`      🚫 ${issue}`);
                });
            }
        });
    }
});

console.log(`\n📊 RESULTS:`);
console.log(`✅ Clean strategies: ${cleanStrategies.length}`);
console.log(`❌ Contaminated strategies removed: ${contaminatedStrategies.length}`);

// Update the latest iteration with clean strategies only
latestIteration.results = cleanStrategies;

// Create backup of original file
const backupPath = resultsPath + '.backup.' + Date.now();
fs.copyFileSync(resultsPath, backupPath);
console.log(`💾 Backup created: ${backupPath}`);

// Save cleaned results
fs.writeFileSync(resultsPath, JSON.stringify(data, null, 2));
console.log(`✅ Updated results saved to: ${resultsPath}`);

// Create contamination report
const contaminationReport = {
    timestamp: new Date().toISOString(),
    originalCount: originalStrategies.length,
    cleanCount: cleanStrategies.length,
    contaminatedCount: contaminatedStrategies.length,
    contaminatedStrategies: contaminatedStrategies.map(s => ({
        name: s.name,
        factors: s.factors,
        issues: s.factors?.map(factor => {
            const validation = validateAsianHandicapFactor(factor);
            return {
                factor,
                issues: validation.issues
            };
        }).filter(f => f.issues.length > 0)
    })),
    cleanStrategies: cleanStrategies.map(s => s.name)
};

fs.writeFileSync('./contamination_removal_report.json', JSON.stringify(contaminationReport, null, 2));
console.log(`📄 Contamination report saved to: contamination_removal_report.json`);

console.log('\n🎯 CONTAMINATED STRATEGIES REMOVED:');
contaminatedStrategies.forEach(strategy => {
    console.log(`❌ ${strategy.name}`);
});

console.log('\n✅ CLEAN STRATEGIES RETAINED:');
cleanStrategies.slice(0, 10).forEach(strategy => {
    console.log(`✅ ${strategy.name}`);
});
if (cleanStrategies.length > 10) {
    console.log(`   ... and ${cleanStrategies.length - 10} more clean strategies`);
}

console.log('\n🎉 ALL REMAINING STRATEGIES ARE NOW ASIAN HANDICAP COMPLIANT!');
console.log('No more 1X2 contamination - all strategies use proper AH factors.');

console.log('\n📋 NEXT STEPS:');
console.log('1. Re-extract betting records with clean strategies only');
console.log('2. Verify all calculations use Asian Handicap coverage');
console.log('3. Update rule files to prevent future 1X2 contamination'); 