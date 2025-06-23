const fs = require('fs');
const path = require('path');
const { validateAsianHandicapFactor } = require('./ah_validation_utils');

console.log('📊 EXTRACTING BETTING RECORDS FOR ALL CURRENT STRATEGIES');
console.log('========================================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';
const enhancedDataPath = '../../data/enhanced';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

console.log('📁 Loading analysis results and match data...');

// Load analysis results
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Load all enhanced match data
const allMatches = [];
const seasons = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];

seasons.forEach(season => {
    const seasonPath = path.join(enhancedDataPath, season);
    if (fs.existsSync(seasonPath)) {
        const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
        const matches = Object.values(seasonData.matches);
        allMatches.push(...matches);
        console.log(`Loaded ${matches.length} matches from ${season}`);
    }
});

// Filter matches with complete data
const validMatches = allMatches.filter(match => 
    match.postMatch?.asianHandicapResults &&
    match.preMatch?.match?.asianHandicapOdds &&
    match.timeSeries?.home && match.timeSeries?.away
);

console.log(`Total valid matches: ${validMatches.length}`);

// Get latest iteration strategies
const latestIteration = data.iterations[data.iterations.length - 1];
const strategies = latestIteration.results || [];

console.log(`Found ${strategies.length} strategies to extract betting records for`);

// ⚠️ CRITICAL: Validate all strategies for Asian Handicap compliance
console.log('\n🔍 VALIDATING STRATEGIES FOR ASIAN HANDICAP COMPLIANCE...');
const validatedStrategies = [];
let contaminatedCount = 0;

strategies.forEach(strategy => {
    let isValid = true;
    
    strategy.factors?.forEach(factor => {
        const validation = validateAsianHandicapFactor(factor);
        if (!validation.isValid) {
            isValid = false;
        }
    });
    
    if (isValid) {
        validatedStrategies.push(strategy);
    } else {
        contaminatedCount++;
        console.log(`❌ SKIPPING CONTAMINATED: ${strategy.name}`);
    }
});

console.log(`✅ Valid strategies: ${validatedStrategies.length}`);
console.log(`❌ Contaminated strategies skipped: ${contaminatedCount}`);

if (contaminatedCount > 0) {
    console.log('⚠️ WARNING: Some strategies use 1X2 factors and were skipped!');
    console.log('Run remove_contaminated_strategies.js to clean the data first.');
}

// Create betting records directory
const recordsDir = './current_betting_records';
if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
}

// Extract records for all strategies
console.log('\n🚀 Starting betting record extraction...');

const allSummaries = [];
let successCount = 0;

validatedStrategies.forEach((strategy, index) => {
    try {
        const summary = extractBettingRecords(strategy);
        if (summary) {
            allSummaries.push(summary);
            successCount++;
        }
    } catch (error) {
        console.log(`   ❌ Error extracting ${strategy.name}: ${error.message}`);
    }
});

// Create master summary
const masterSummary = {
    generatedAt: new Date().toISOString(),
    totalStrategies: validatedStrategies.length,
    successfulExtractions: successCount,
    asianHandicapCompliant: true,
    contaminatedStrategiesSkipped: contaminatedCount,
    strategies: allSummaries.map(s => ({
        name: s.strategyName,
        roi: s.performance.roi,
        totalBets: s.performance.totalBets,
        winRate: s.performance.winRate
    }))
};

fs.writeFileSync(path.join(recordsDir, '_MASTER_SUMMARY.json'), JSON.stringify(masterSummary, null, 2));

// Create README
const readmeContent = `# Current Betting Records

## 📊 Summary

- **Total Strategies**: ${validatedStrategies.length}
- **Successful Extractions**: ${successCount}
- **Asian Handicap Compliant**: ✅ YES - All strategies validated
- **Contaminated Strategies Skipped**: ${contaminatedCount}
- **Generated**: ${new Date().toISOString()}

## 📁 Files

Each strategy has two files:
- **\`StrategyName_bets.csv\`**: Individual betting records with match details
- **\`StrategyName_summary.json\`**: Complete performance summary and all records

## 📋 CSV Format

\`\`\`
Date,HomeTeam,AwayTeam,Score,HandicapLine,BetSide,BetOdds,Profit,Result,FactorValue,FactorComponents,AHResult
\`\`\`

## 💰 Top 10 Strategies by ROI

${allSummaries
    .sort((a, b) => parseFloat(b.performance.roi) - parseFloat(a.performance.roi))
    .slice(0, 10)
    .map((s, i) => `${i+1}. **${s.strategyName}**: ${s.performance.roi} (${s.performance.totalBets} bets)`)
    .join('\n')}

## ⚠️ Important Notes

- **ALL STRATEGIES ARE ASIAN HANDICAP COMPLIANT** ✅
- All betting records are for **Asian Handicap** betting only
- Profits calculated based on handicap coverage, not match results
- Each bet is 100 units, profits shown as actual profit/loss
- WIN/LOSS/PUSH based on Asian Handicap outcomes only
- No 1X2 (win/lose/draw) contamination

## 🔍 Validation

All strategies have been validated to ensure they use only Asian Handicap compatible factors.
Strategies using 1X2 factors (homeWinOdds, awayWinOdds, drawOdds, implied probabilities) have been removed.

*Generated by extract_all_current_betting_records.js with AH validation*
`;

fs.writeFileSync(path.join(recordsDir, 'README.md'), readmeContent);

console.log('\n✅ BETTING RECORD EXTRACTION COMPLETE!');
console.log(`📁 Records saved to: ${path.resolve(recordsDir)}`);
console.log(`📊 Successfully extracted records for ${successCount}/${validatedStrategies.length} strategies`);
console.log(`📄 Files: ${successCount * 2} CSV/JSON files + master summary + README`);
console.log('\n📋 Access betting records at:');
console.log(`   ${path.resolve(recordsDir)}/`);
console.log('\n🎯 ALL STRATEGIES ARE ASIAN HANDICAP COMPLIANT!');
console.log('✅ No 1X2 contamination - all calculations use proper AH coverage'); 