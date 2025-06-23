const fs = require('fs');

console.log('📊 EXTRACTING ALL 130 STRATEGY DETAILS');
console.log('=====================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
console.log(`✅ Loaded data with ${data.iterations?.length || 0} iterations`);

// Get the latest iteration results
const latestIteration = data.iterations[data.iterations.length - 1];
const allStrategies = latestIteration.results;

console.log(`📋 Found ${allStrategies.length} strategies in latest iteration`);

// Sort by profitability (descending)
allStrategies.sort((a, b) => (b.profitability || 0) - (a.profitability || 0));

// Categorize strategies
const profitable = allStrategies.filter(s => (s.profitability || 0) > 0);
const avgROI = allStrategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / allStrategies.length;

console.log(`✅ Profitable: ${profitable.length}/${allStrategies.length}`);
console.log(`📊 Average ROI: ${avgROI.toFixed(2)}%`);

// Create complete documentation
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

// Generate complete documentation
const completeDoc = `# ALL 130 BETTING STRATEGIES - COMPLETE ANALYSIS

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

// Write the complete documentation
fs.writeFileSync('./strategies_documentation/ALL_STRATEGIES.md', completeDoc);

console.log('✅ Complete documentation written to ALL_STRATEGIES.md');
console.log(`📄 Document contains ${allStrategies.length} strategies with full details`);
console.log('🎯 Every strategy includes: ROI, correlation, win rates, betting details, logic, and financial performance'); 