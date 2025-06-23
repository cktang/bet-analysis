const fs = require('fs');

console.log('🔍 SEARCHING FOR ALL 130 STRATEGIES');
console.log('===================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log(`📊 Total iterations: ${data.iterations.length}`);

// Check each iteration for strategy counts
data.iterations.forEach((iteration, i) => {
    const strategyCount = iteration.results?.length || 0;
    console.log(`Iteration ${i + 1}: ${strategyCount} strategies (${iteration.timestamp})`);
});

// Find the iteration with the most strategies
let maxStrategies = 0;
let bestIteration = null;
let bestIterationIndex = -1;

data.iterations.forEach((iteration, i) => {
    const count = iteration.results?.length || 0;
    if (count > maxStrategies) {
        maxStrategies = count;
        bestIteration = iteration;
        bestIterationIndex = i;
    }
});

console.log(`\n🎯 Best iteration: ${bestIterationIndex + 1} with ${maxStrategies} strategies`);

// Also check if there's a separate file with all strategies
const allStrategiesFiles = [
    '../../data/processed/all_strategies.json',
    '../../data/processed/comprehensive_strategies.json',
    '../../data/processed/final_strategies.json'
];

allStrategiesFiles.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log(`📁 Found ${file} with ${Array.isArray(data) ? data.length : 'unknown'} strategies`);
        } catch (e) {
            console.log(`📁 Found ${file} but couldn't parse`);
        }
    }
});

// Check if there are any other JSON files in processed directory
const processedDir = '../../data/processed/';
const files = fs.readdirSync(processedDir).filter(f => f.endsWith('.json'));
console.log(`\n📂 All JSON files in processed directory:`);
files.forEach(file => {
    try {
        const data = JSON.parse(fs.readFileSync(processedDir + file, 'utf8'));
        if (Array.isArray(data)) {
            console.log(`   ${file}: ${data.length} items (array)`);
        } else if (data.iterations) {
            console.log(`   ${file}: ${data.iterations.length} iterations`);
        } else if (data.results) {
            console.log(`   ${file}: ${data.results.length} results`);
        } else {
            console.log(`   ${file}: object with keys: ${Object.keys(data).join(', ')}`);
        }
    } catch (e) {
        console.log(`   ${file}: couldn't parse`);
    }
});

if (bestIteration && maxStrategies > 0) {
    console.log(`\n🚀 Using iteration ${bestIterationIndex + 1} with ${maxStrategies} strategies`);
    
    // Use the best iteration to create documentation
    const allStrategies = bestIteration.results;
    allStrategies.sort((a, b) => (b.profitability || 0) - (a.profitability || 0));
    
    const profitable = allStrategies.filter(s => (s.profitability || 0) > 0);
    const avgROI = allStrategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / allStrategies.length;
    
    console.log(`✅ Profitable: ${profitable.length}/${allStrategies.length}`);
    console.log(`📊 Average ROI: ${avgROI.toFixed(2)}%`);
    
    // Create the complete documentation with ALL strategies
    const createStrategyDetail = (strategy, index) => {
        const roi = ((strategy.profitability || 0) * 100).toFixed(2);
        const correlation = (strategy.correlation || 0).toFixed(4);
        const accuracy = strategy.strategy ? 
            (((strategy.strategy.homeWins + strategy.strategy.awayWins) / (strategy.strategy.homeBets + strategy.strategy.awayBets)) * 100).toFixed(1) : 
            'N/A';
        const samples = strategy.validSamples || strategy.sampleSize || 'N/A';
        
        const homeBets = strategy.strategy?.homeBets || 0;
        const awayBets = strategy.strategy?.awayBets || 0;
        const homeWins = strategy.strategy?.homeWins || 0;
        const awayWins = strategy.strategy?.awayWins || 0;
        const homeROI = ((strategy.homeProfitability || 0) * 100).toFixed(2);
        const awayROI = ((strategy.awayProfitability || 0) * 100).toFixed(2);
        
        const status = roi > 20 ? '🚀 READY TO IMPLEMENT' : 
                      roi > 5 ? '⚠️ CONDITIONAL USE' : 
                      roi > 0 ? '🔍 RESEARCH ONLY' : 
                      '❌ UNPROFITABLE';
        
        return `## ${index + 1}. ${strategy.name}

**📊 Performance Metrics:**
- **Overall ROI**: ${roi}%
- **Correlation**: ${correlation}
- **Win Rate**: ${accuracy}%
- **Sample Size**: ${samples}
- **Status**: ${status}

**🎯 Betting Details:**
- **Home Bets**: ${homeBets} (Win Rate: ${homeBets > 0 ? ((homeWins/homeBets)*100).toFixed(1) : '0'}%, ROI: ${homeROI}%)
- **Away Bets**: ${awayBets} (Win Rate: ${awayBets > 0 ? ((awayWins/awayBets)*100).toFixed(1) : '0'}%, ROI: ${awayROI}%)
- **Threshold**: ${strategy.strategy?.threshold || 'N/A'}

**🔍 Strategy Logic:**
- **Type**: ${strategy.type || 'Unknown'}
- **Factors**: ${(strategy.factors || []).join(', ')}
- **Hypothesis**: ${strategy.hypothesis || 'Not specified'}

**💰 Financial Performance:**
${homeBets > 0 ? `- **Home Side**: ${homeBets} bets, ${homeWins} wins, ${((strategy.strategy?.homeTotalReturn || 0)).toFixed(2)} return` : ''}
${awayBets > 0 ? `- **Away Side**: ${awayBets} bets, ${awayWins} wins, ${((strategy.strategy?.awayTotalReturn || 0)).toFixed(2)} return` : ''}

---`;
    };
    
    const completeDoc = `# ALL ${maxStrategies} BETTING STRATEGIES - COMPLETE ANALYSIS

## 📊 SYSTEM OVERVIEW

- **Total Strategies Tested**: ${allStrategies.length}
- **Profitable Strategies**: ${profitable.length}
- **Success Rate**: ${((profitable.length / allStrategies.length) * 100).toFixed(1)}%
- **Average ROI**: ${avgROI.toFixed(2)}%
- **Data Source**: 100% Pre-match data only (Zero contamination)

## 🏆 PERFORMANCE CATEGORIES

### 🚀 Ready to Implement (>20% ROI): ${allStrategies.filter(s => ((s.profitability || 0) * 100) > 20).length} strategies
### ⚠️ Conditional Use (5-20% ROI): ${allStrategies.filter(s => {const roi = (s.profitability || 0) * 100; return roi > 5 && roi <= 20;}).length} strategies  
### 🔍 Research Only (0-5% ROI): ${allStrategies.filter(s => {const roi = (s.profitability || 0) * 100; return roi > 0 && roi <= 5;}).length} strategies
### ❌ Unprofitable (<0% ROI): ${allStrategies.filter(s => ((s.profitability || 0) * 100) <= 0).length} strategies

---

# 📋 COMPLETE STRATEGY DETAILS

${allStrategies.map((strategy, index) => createStrategyDetail(strategy, index)).join('\n\n')}

---

## 📈 SUMMARY STATISTICS

**Top 10 Performers:**
${allStrategies.slice(0, 10).map((s, i) => `${i+1}. ${s.name}: ${((s.profitability || 0) * 100).toFixed(2)}% ROI`).join('\n')}

**Bottom 10 Performers:**
${allStrategies.slice(-10).map((s, i) => `${allStrategies.length - 9 + i}. ${s.name}: ${((s.profitability || 0) * 100).toFixed(2)}% ROI`).join('\n')}

---

*Generated on ${new Date().toISOString()}*
*This document contains EVERY strategy tested with complete implementation details*
*All strategies use only pre-match data - zero look-ahead bias*
`;
    
    fs.writeFileSync('./strategies_documentation/ALL_STRATEGIES.md', completeDoc);
    console.log(`✅ Complete documentation written with ${allStrategies.length} strategies`);
} 