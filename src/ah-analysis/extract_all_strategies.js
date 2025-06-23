const fs = require('fs');
const path = require('path');

console.log('📊 EXTRACTING ALL STRATEGIES FROM ANALYSIS RESULTS');
console.log('=================================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

console.log('📁 Reading analysis results...');

try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    console.log('✅ File loaded successfully');
    
    // Extract all unique strategies from all iterations
    const allStrategies = new Map();
    let totalIterations = 0;
    
    if (data.iterations && Array.isArray(data.iterations)) {
        data.iterations.forEach((iteration, i) => {
            if (iteration.results && Array.isArray(iteration.results)) {
                totalIterations++;
                iteration.results.forEach(strategy => {
                    if (strategy && strategy.name) {
                        // Keep the best version of each strategy (highest profitability)
                        const existing = allStrategies.get(strategy.name);
                        if (!existing || (strategy.profitability || 0) > (existing.profitability || 0)) {
                            allStrategies.set(strategy.name, strategy);
                        }
                    }
                });
            }
        });
    }
    
    const strategies = Array.from(allStrategies.values());
    console.log(`✅ Extracted ${strategies.length} unique strategies from ${totalIterations} iterations`);
    
    const profitable = strategies.filter(s => (s.profitability || 0) > 0);
    const avgROI = strategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / strategies.length;
    
    console.log(`   Profitable: ${profitable.length}`);
    console.log(`   Success Rate: ${((profitable.length / strategies.length) * 100).toFixed(1)}%`);
    console.log(`   Average ROI: ${avgROI.toFixed(2)}%`);
    
    // Create documentation directory
    const docsDir = './all_strategies_documentation';
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Create master summary file
    const summaryContent = `# ALL ${strategies.length} STRATEGIES TESTED

## 📊 Complete Overview

- **Total Unique Strategies**: ${strategies.length}
- **Profitable Strategies**: ${profitable.length}
- **Success Rate**: ${((profitable.length / strategies.length) * 100).toFixed(1)}%
- **Average ROI**: ${avgROI.toFixed(2)}%
- **Extracted from**: ${totalIterations} analysis iterations

## 🏆 Top 20 Strategies by ROI

${strategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .slice(0, 20)
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 📋 Complete Strategy List (Sorted by Performance)

${strategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => {
        const roi = ((s.profitability || 0) * 100).toFixed(2);
        const correlation = (s.correlation || 0).toFixed(4);
        const accuracy = ((s.accuracy || 0) * 100).toFixed(1);
        const samples = s.validSamples || s.sampleSize || 'N/A';
        
        return `### ${i + 1}. ${s.name}

**Performance Metrics:**
- 💰 **ROI**: ${roi}%
- 📊 **Correlation**: ${correlation}
- 🎯 **Accuracy**: ${accuracy}%
- 📈 **Sample Size**: ${samples}

**Strategy Details:**
- 🏷️ **Type**: ${s.type || 'Unknown'}
- 🧠 **Factors**: ${(s.factors || []).length} factors
- 💡 **Hypothesis**: ${s.hypothesis || 'Not specified'}

**Factors Used:**
${(s.factors || []).map(f => `  - \`${f}\``).join('\n')}

**Implementation Status:**
${roi > 20 ? '✅ **READY FOR LIVE BETTING** - High confidence strategy' : 
  roi > 5 ? '⚠️ **CONDITIONAL** - Needs further review before implementation' : 
  roi > 0 ? '🔍 **RESEARCH ONLY** - Profitable but low confidence' : 
  '❌ **DO NOT IMPLEMENT** - Unprofitable strategy'}

---
`;
    })
    .join('\n')}

*Generated on ${new Date().toISOString()}*
*This document contains ALL ${strategies.length} unique strategies tested*
`;
    
    fs.writeFileSync(path.join(docsDir, 'ALL_STRATEGIES_COMPLETE_LIST.md'), summaryContent);
    
    // Create performance tier files
    const tiers = {
        'EXCEPTIONAL_50_PLUS_ROI': strategies.filter(s => ((s.profitability || 0) * 100) > 50),
        'STRONG_20_TO_50_ROI': strategies.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 20 && roi <= 50;
        }),
        'MODERATE_5_TO_20_ROI': strategies.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 5 && roi <= 20;
        }),
        'MARGINAL_0_TO_5_ROI': strategies.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 0 && roi <= 5;
        }),
        'UNPROFITABLE_NEGATIVE_ROI': strategies.filter(s => ((s.profitability || 0) * 100) <= 0)
    };
    
    Object.entries(tiers).forEach(([tierName, tierStrategies]) => {
        const tierTitle = tierName.replace(/_/g, ' ').replace(/ROI/g, 'ROI');
        const content = `# ${tierTitle}

## 📊 Tier Summary
- **Strategy Count**: ${tierStrategies.length}
- **Average ROI**: ${tierStrategies.length > 0 ? (tierStrategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / tierStrategies.length).toFixed(2) : '0.00'}%

${tierStrategies.length > 0 ? tierStrategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => {
        const roi = ((s.profitability || 0) * 100).toFixed(2);
        const correlation = (s.correlation || 0).toFixed(4);
        const accuracy = ((s.accuracy || 0) * 100).toFixed(1);
        
        return `## ${i + 1}. ${s.name}

**Performance:**
- 💰 ROI: ${roi}%
- 📊 Correlation: ${correlation}
- 🎯 Accuracy: ${accuracy}%
- 📈 Sample Size: ${s.validSamples || s.sampleSize || 'N/A'}

**Strategy Details:**
- 🏷️ Type: ${s.type || 'Unknown'}
- 🧠 Factors: ${(s.factors || []).join(', ')}
- 💡 Hypothesis: ${s.hypothesis || 'Not specified'}

**Detailed Factor Breakdown:**
${(s.factors || []).map(f => `  - \`${f}\``).join('\n')}

**Implementation Recommendation:**
${roi > 20 ? '✅ **IMPLEMENT IMMEDIATELY** - High confidence, ready for live betting' : 
  roi > 5 ? '⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management and bet sizing' : 
  roi > 0 ? '🔍 **RESEARCH PHASE** - Monitor performance, not ready for live betting' : 
  '❌ **AVOID** - Unprofitable, useful for educational purposes only'}

---`;
    }).join('\n') : 'No strategies in this tier.'}
`;
        
        fs.writeFileSync(path.join(docsDir, `${tierName}.md`), content);
    });
    
    // Create a quick reference file
    const quickRef = `# QUICK REFERENCE - ALL STRATEGIES

## 🚀 READY TO IMPLEMENT (20%+ ROI)
${tiers.EXCEPTIONAL_50_PLUS_ROI.concat(tiers.STRONG_20_TO_50_ROI)
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## ⚠️ CONDITIONAL (5-20% ROI)
${tiers.MODERATE_5_TO_20_ROI
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 🔍 RESEARCH ONLY (0-5% ROI)
${tiers.MARGINAL_0_TO_5_ROI
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## ❌ AVOID (Negative ROI)
First 10 worst performers:
${tiers.UNPROFITABLE_NEGATIVE_ROI
    .sort((a, b) => (a.profitability || 0) - (b.profitability || 0))
    .slice(0, 10)
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

*Total unprofitable strategies: ${tiers.UNPROFITABLE_NEGATIVE_ROI.length}*
`;
    
    fs.writeFileSync(path.join(docsDir, 'QUICK_REFERENCE.md'), quickRef);
    
    console.log('✅ Documentation complete!');
    console.log(`📁 Files created in: ${path.resolve(docsDir)}`);
    console.log('📋 Files created:');
    console.log('   - ALL_STRATEGIES_COMPLETE_LIST.md (detailed list of all strategies)');
    console.log('   - QUICK_REFERENCE.md (summary by implementation readiness)');
    Object.entries(tiers).forEach(([tier, strategies]) => {
        console.log(`   - ${tier}.md (${strategies.length} strategies)`);
    });
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
