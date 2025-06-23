const fs = require('fs');
const path = require('path');
const { validateAsianHandicapFactor } = require('./ah_validation_utils');

console.log('🔍 VALIDATING ALL STRATEGIES FOR ASIAN HANDICAP COMPLIANCE');
console.log('=========================================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

// Load analysis results
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const latestIteration = data.iterations[data.iterations.length - 1];
const strategies = latestIteration.results || [];

console.log(`📊 Found ${strategies.length} strategies to validate`);

const validationResults = {
    totalStrategies: strategies.length,
    validStrategies: 0,
    invalidStrategies: 0,
    contaminated: [],
    clean: []
};

console.log('\n🔍 VALIDATION RESULTS:');
console.log('======================');

strategies.forEach((strategy, index) => {
    const strategyResult = {
        name: strategy.name,
        factors: strategy.factors || [],
        issues: [],
        isValid: true
    };
    
    // Validate each factor
    strategy.factors?.forEach((factor, factorIndex) => {
        const validation = validateAsianHandicapFactor(factor);
        
        if (!validation.isValid) {
            strategyResult.isValid = false;
            validation.issues.forEach(issue => {
                strategyResult.issues.push(`Factor ${factorIndex + 1} (${factor}): ${issue}`);
            });
        }
    });
    
    // Display results
    if (strategyResult.isValid) {
        console.log(`✅ ${strategy.name}`);
        validationResults.validStrategies++;
        validationResults.clean.push(strategyResult);
    } else {
        console.log(`❌ ${strategy.name}`);
        strategyResult.issues.forEach(issue => {
            console.log(`   🚫 ${issue}`);
        });
        validationResults.invalidStrategies++;
        validationResults.contaminated.push(strategyResult);
    }
});

console.log('\n📊 VALIDATION SUMMARY:');
console.log('======================');
console.log(`Total Strategies: ${validationResults.totalStrategies}`);
console.log(`✅ Valid (AH Compliant): ${validationResults.validStrategies}`);
console.log(`❌ Invalid (1X2 Contaminated): ${validationResults.invalidStrategies}`);

if (validationResults.invalidStrategies > 0) {
    console.log('\n🚫 CONTAMINATED STRATEGIES:');
    validationResults.contaminated.forEach(strategy => {
        console.log(`❌ ${strategy.name}`);
        strategy.issues.forEach(issue => console.log(`   - ${issue}`));
    });
}

// Save validation report
fs.writeFileSync('./strategy_validation_report.json', JSON.stringify(validationResults, null, 2));
