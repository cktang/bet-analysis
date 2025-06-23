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
    strategiesWithWarnings: 0,
    issues: [],
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
        warnings: [],
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
        
        validation.warnings.forEach(warning => {
            strategyResult.warnings.push(`Factor ${factorIndex + 1} (${factor}): ${warning}`);
        });
    });
    
    // Display results
    if (strategyResult.isValid) {
        console.log(`✅ ${strategy.name}`);
        validationResults.validStrategies++;
        validationResults.clean.push(strategyResult);
        
        if (strategyResult.warnings.length > 0) {
            console.log(`   ⚠️ ${strategyResult.warnings.length} warnings`);
            validationResults.strategiesWithWarnings++;
        }
    } else {
        console.log(`❌ ${strategy.name}`);
        console.log(`   🚫 ${strategyResult.issues.length} issues:`);
        strategyResult.issues.forEach(issue => {
            console.log(`      - ${issue}`);
        });
        validationResults.invalidStrategies++;
        validationResults.contaminated.push(strategyResult);
        validationResults.issues.push(...strategyResult.issues);
    }
});

console.log('\n📊 VALIDATION SUMMARY:');
console.log('======================');
console.log(`Total Strategies: ${validationResults.totalStrategies}`);
console.log(`✅ Valid (AH Compliant): ${validationResults.validStrategies}`);
console.log(`❌ Invalid (1X2 Contaminated): ${validationResults.invalidStrategies}`);
console.log(`⚠️ With Warnings: ${validationResults.strategiesWithWarnings}`);

if (validationResults.invalidStrategies > 0) {
    console.log('\n🚫 CONTAMINATED STRATEGIES (USING 1X2 FACTORS):');
    console.log('================================================');
    validationResults.contaminated.forEach(strategy => {
        console.log(`\n❌ ${strategy.name}:`);
        strategy.factors.forEach((factor, index) => {
            const validation = validateAsianHandicapFactor(factor);
            if (!validation.isValid) {
                console.log(`   Factor ${index + 1}: ${factor}`);
                validation.issues.forEach(issue => {
                    console.log(`      🚫 ${issue}`);
                });
                
                // Suggest alternatives
                if (factor.includes('homeWinOdds')) {
                    console.log(`      💡 Suggest: match.asianHandicapOdds.homeOdds`);
                } else if (factor.includes('awayWinOdds')) {
                    console.log(`      💡 Suggest: match.asianHandicapOdds.awayOdds`);
                } else if (factor.includes('drawOdds')) {
                    console.log(`      💡 Suggest: Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap))`);
                } else if (factor.includes('ImpliedProb')) {
                    console.log(`      💡 Suggest: Use Asian Handicap odds instead of 1X2 probabilities`);
                }
            }
        });
    });
    
    console.log('\n⚠️ CRITICAL: These strategies use 1X2 factors and will produce incorrect results for Asian Handicap betting!');
    console.log('They must be fixed or removed before production use.');
}

// Save validation report
const reportPath = './strategy_validation_report.json';
fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));

console.log(`\n📄 Detailed validation report saved to: ${reportPath}`);

if (validationResults.invalidStrategies > 0) {
    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. Remove or fix contaminated strategies');
    console.log('2. Replace 1X2 factors with Asian Handicap equivalents');
    console.log('3. Re-run strategy generation with clean factors only');
    console.log('4. Validate betting record extraction uses proper AH calculations');
    
    process.exit(1); // Exit with error if contaminated strategies found
} else {
    console.log('\n🎉 ALL STRATEGIES ARE ASIAN HANDICAP COMPLIANT!');
    process.exit(0);
} 