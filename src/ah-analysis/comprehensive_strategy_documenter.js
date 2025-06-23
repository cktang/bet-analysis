const fs = require('fs');
const path = require('path');

console.log('📊 COMPREHENSIVE STRATEGY DOCUMENTATION SYSTEM');
console.log('===============================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';
const finalReportPath = '../../data/processed/ah_final_report.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    console.error(`   Looking for: ${resultsPath}`);
    process.exit(1);
}

console.log('📁 Reading analysis results...');

try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    console.log(`✅ Loaded ${results.length} strategy results`);
    
    // Create a summary of all strategies first
    console.log('📋 Creating strategy summary...');
    
    const profitable = results.filter(s => (s.profitability || 0) > 0);
    const avgROI = results.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / results.length;
    
    console.log(`   Total Strategies: ${results.length}`);
    console.log(`   Profitable: ${profitable.length}`);
    console.log(`   Success Rate: ${((profitable.length / results.length) * 100).toFixed(1)}%`);
    console.log(`   Average ROI: ${avgROI.toFixed(2)}%`);
    
    // Create simple documentation directory
    const docsDir = './all_strategies_documentation';
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Create master summary file
    const summaryContent = `# ALL ${results.length} STRATEGIES TESTED

## 📊 Complete Overview

- **Total Strategies**: ${results.length}
- **Profitable Strategies**: ${profitable.length}
- **Success Rate**: ${((profitable.length / results.length) * 100).toFixed(1)}%
- **Average ROI**: ${avgROI.toFixed(2)}%

## 🏆 Top 20 Strategies by ROI

${results
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .slice(0, 20)
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 📋 Complete Strategy List

${results
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => {
        const roi = ((s.profitability || 0) * 100).toFixed(2);
        const correlation = (s.correlation || 0).toFixed(4);
        const accuracy = ((s.accuracy || 0) * 100).toFixed(1);
        const samples = s.validSamples || 'N/A';
        
        return `${i + 1}. **${s.name}**
   - ROI: ${roi}%
   - Correlation: ${correlation}
   - Accuracy: ${accuracy}%
   - Samples: ${samples}
   - Type: ${s.type || 'Unknown'}
   - Factors: ${(s.factors || []).length} factors
`;
    })
    .join('\n')}

---

*Generated on ${new Date().toISOString()}*
*This document contains ALL strategies tested, both profitable and unprofitable*
`;
    
    fs.writeFileSync(path.join(docsDir, 'ALL_STRATEGIES_COMPLETE_LIST.md'), summaryContent);
    
    // Create performance categories
    const categories = {
        'EXCEPTIONAL (50%+ ROI)': results.filter(s => ((s.profitability || 0) * 100) > 50),
        'STRONG (20-50% ROI)': results.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 20 && roi <= 50;
        }),
        'MODERATE (5-20% ROI)': results.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 5 && roi <= 20;
        }),
        'MARGINAL (0-5% ROI)': results.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 0 && roi <= 5;
        }),
        'UNPROFITABLE (<0% ROI)': results.filter(s => ((s.profitability || 0) * 100) <= 0)
    };
    
    Object.entries(categories).forEach(([tier, strategies]) => {
        const content = `# ${tier} - ${strategies.length} Strategies

${strategies.map((s, i) => {
    const roi = ((s.profitability || 0) * 100).toFixed(2);
    const correlation = (s.correlation || 0).toFixed(4);
    const accuracy = ((s.accuracy || 0) * 100).toFixed(1);
    
    return `## ${i + 1}. ${s.name}

**Performance:**
- ROI: ${roi}%
- Correlation: ${correlation}
- Accuracy: ${accuracy}%
- Sample Size: ${s.validSamples || 'N/A'}

**Strategy Details:**
- Type: ${s.type || 'Unknown'}
- Factors: ${(s.factors || []).join(', ')}
- Hypothesis: ${s.hypothesis || 'Not specified'}

**Implementation Status:**
${roi > 20 ? '✅ READY FOR LIVE BETTING' : 
  roi > 5 ? '⚠️ CONDITIONAL - NEEDS REVIEW' : 
  roi > 0 ? '🔍 RESEARCH ONLY' : 
  '❌ DO NOT IMPLEMENT'}

---`;
}).join('\n')}
`;
        
        const filename = `${tier.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        fs.writeFileSync(path.join(docsDir, filename), content);
    });
    
    console.log('✅ Documentation complete!');
    console.log(`📁 Files created in: ${path.resolve(docsDir)}`);
    console.log('📋 Files created:');
    console.log('   - ALL_STRATEGIES_COMPLETE_LIST.md (master list)');
    Object.keys(categories).forEach(tier => {
        console.log(`   - ${tier.replace(/[^a-zA-Z0-9]/g, '_')}.md (${categories[tier].length} strategies)`);
    });
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
