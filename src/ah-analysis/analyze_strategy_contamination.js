const fs = require('fs');
const path = require('path');

console.log('🔍 ANALYZING STRATEGY CONTAMINATION');
console.log('==================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

console.log('📁 Reading analysis results...');

try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Extract all unique strategies from all iterations
    const allStrategies = new Map();
    
    if (data.iterations && Array.isArray(data.iterations)) {
        data.iterations.forEach((iteration, i) => {
            if (iteration.results && Array.isArray(iteration.results)) {
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
    console.log(`✅ Loaded ${strategies.length} unique strategies`);
    
    // Define post-match contamination patterns
    const contaminationPatterns = [
        // Post-match data patterns
        'postMatch',
        'fbref.homeXG',
        'fbref.awayXG', 
        'fbref.homeShots',
        'fbref.awayShots',
        'fbref.homeShotsOnTarget',
        'fbref.awayShotsOnTarget',
        'fbref.homeCorners',
        'fbref.awayCorners',
        'fbref.homeFouls',
        'fbref.awayFouls',
        'fbref.homeYellowCards',
        'fbref.awayYellowCards',
        'fbref.homeRedCards',
        'fbref.awayRedCards',
        'fbref.homePossession',
        'fbref.awayPossession',
        'fbref.week', // This might be available pre-match, but often calculated post-match
        
        // Performance metrics that use actual results
        'enhanced.performance.homeEfficiency',
        'enhanced.performance.awayEfficiency',
        'enhanced.performance.homeXGDiff',
        'enhanced.performance.awayXGDiff',
        'enhanced.performance.homePerformance',
        'enhanced.performance.awayPerformance',
        
        // Any factor that includes actual match results
        'actualGoals',
        'actualResult',
        'matchResult',
        'goalsScored',
        'goalsConceded'
    ];
    
    // Analyze each strategy for contamination
    const cleanStrategies = [];
    const contaminatedStrategies = [];
    
    strategies.forEach(strategy => {
        const factors = strategy.factors || [];
        let isContaminated = false;
        const contaminationReasons = [];
        
        factors.forEach(factor => {
            contaminationPatterns.forEach(pattern => {
                if (factor.includes(pattern)) {
                    isContaminated = true;
                    contaminationReasons.push(`Factor "${factor}" contains "${pattern}"`);
                }
            });
        });
        
        if (isContaminated) {
            contaminatedStrategies.push({
                ...strategy,
                contaminationReasons
            });
        } else {
            cleanStrategies.push(strategy);
        }
    });
    
    console.log('\n📊 CONTAMINATION ANALYSIS RESULTS:');
    console.log(`   Total Strategies: ${strategies.length}`);
    console.log(`   Clean Strategies: ${cleanStrategies.length}`);
    console.log(`   Contaminated Strategies: ${contaminatedStrategies.length}`);
    console.log(`   Contamination Rate: ${((contaminatedStrategies.length / strategies.length) * 100).toFixed(1)}%`);
    
    // Analyze clean strategies performance
    const profitableClean = cleanStrategies.filter(s => (s.profitability || 0) > 0);
    const avgROIClean = cleanStrategies.length > 0 ? 
        cleanStrategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / cleanStrategies.length : 0;
    
    console.log('\n📈 CLEAN STRATEGIES PERFORMANCE:');
    console.log(`   Profitable Clean Strategies: ${profitableClean.length}`);
    console.log(`   Clean Success Rate: ${cleanStrategies.length > 0 ? ((profitableClean.length / cleanStrategies.length) * 100).toFixed(1) : '0.0'}%`);
    console.log(`   Average ROI (Clean): ${avgROIClean.toFixed(2)}%`);
    
    // Show top contamination reasons
    const contaminationCounts = {};
    contaminatedStrategies.forEach(strategy => {
        strategy.contaminationReasons.forEach(reason => {
            const pattern = reason.match(/contains "([^"]+)"/)?.[1];
            if (pattern) {
                contaminationCounts[pattern] = (contaminationCounts[pattern] || 0) + 1;
            }
        });
    });
    
    console.log('\n🚨 TOP CONTAMINATION SOURCES:');
    Object.entries(contaminationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} strategies`);
        });
    
    // Create clean documentation
    const docsDir = './clean_strategies_documentation';
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Create clean strategies summary
    const cleanSummary = `# CLEAN STRATEGIES (NO POST-MATCH DATA)

## 🎯 Clean Analysis Results

- **Total Clean Strategies**: ${cleanStrategies.length}
- **Profitable Clean Strategies**: ${profitableClean.length}
- **Clean Success Rate**: ${cleanStrategies.length > 0 ? ((profitableClean.length / cleanStrategies.length) * 100).toFixed(1) : '0.0'}%
- **Average ROI (Clean)**: ${avgROIClean.toFixed(2)}%

## 🏆 Top 20 Clean Strategies by ROI

${cleanStrategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .slice(0, 20)
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 📋 Complete Clean Strategy List

${cleanStrategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => {
        const roi = ((s.profitability || 0) * 100).toFixed(2);
        const correlation = (s.correlation || 0).toFixed(4);
        const accuracy = ((s.accuracy || 0) * 100).toFixed(1);
        const samples = s.validSamples || s.sampleSize || 'N/A';
        
        return `### ${i + 1}. ${s.name}

**Performance Metrics:**
- �� **ROI**: ${roi}%
- 📊 **Correlation**: ${correlation}
- 🎯 **Accuracy**: ${accuracy}%
- 📈 **Sample Size**: ${samples}

**Strategy Details:**
- 🏷️ **Type**: ${s.type || 'Unknown'}
- 🧠 **Factors**: ${(s.factors || []).length} factors
- 💡 **Hypothesis**: ${s.hypothesis || 'Not specified'}

**Clean Factors Used:**
${(s.factors || []).map(f => `  - \`${f}\``).join('\n')}

**Implementation Status:**
${roi > 20 ? '✅ **READY FOR LIVE BETTING** - High confidence clean strategy' : 
  roi > 5 ? '⚠️ **CONDITIONAL** - Needs further review before implementation' : 
  roi > 0 ? '🔍 **RESEARCH ONLY** - Profitable but low confidence' : 
  '❌ **DO NOT IMPLEMENT** - Unprofitable strategy'}

---
`;
    })
    .join('\n')}

*Generated on ${new Date().toISOString()}*
*This document contains ONLY clean strategies with no post-match data contamination*
`;
    
    fs.writeFileSync(path.join(docsDir, 'CLEAN_STRATEGIES_COMPLETE_LIST.md'), cleanSummary);
    
    // Create contamination report
    const contaminationReport = `# CONTAMINATION ANALYSIS REPORT

## 📊 Summary

- **Total Strategies Analyzed**: ${strategies.length}
- **Clean Strategies**: ${cleanStrategies.length} (${((cleanStrategies.length / strategies.length) * 100).toFixed(1)}%)
- **Contaminated Strategies**: ${contaminatedStrategies.length} (${((contaminatedStrategies.length / strategies.length) * 100).toFixed(1)}%)

## 🚨 Contamination Sources

${Object.entries(contaminationCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([pattern, count]) => `- **${pattern}**: ${count} strategies (${((count / contaminatedStrategies.length) * 100).toFixed(1)}% of contaminated)`)
    .join('\n')}

## ❌ Contaminated Strategies

${contaminatedStrategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => {
        const roi = ((s.profitability || 0) * 100).toFixed(2);
        return `### ${i + 1}. ${s.name} (${roi}% ROI)

**Contamination Issues:**
${s.contaminationReasons.map(reason => `- ${reason}`).join('\n')}

**Factors:**
${(s.factors || []).map(f => `- \`${f}\``).join('\n')}

---`;
    })
    .join('\n')}

*This report identifies all strategies using post-match data that should be excluded from implementation*
`;
    
    fs.writeFileSync(path.join(docsDir, 'CONTAMINATION_REPORT.md'), contaminationReport);
    
    // Create performance tiers for clean strategies only
    const cleanTiers = {
        'EXCEPTIONAL_50_PLUS_ROI': cleanStrategies.filter(s => ((s.profitability || 0) * 100) > 50),
        'STRONG_20_TO_50_ROI': cleanStrategies.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 20 && roi <= 50;
        }),
        'MODERATE_5_TO_20_ROI': cleanStrategies.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 5 && roi <= 20;
        }),
        'MARGINAL_0_TO_5_ROI': cleanStrategies.filter(s => {
            const roi = (s.profitability || 0) * 100;
            return roi > 0 && roi <= 5;
        }),
        'UNPROFITABLE_NEGATIVE_ROI': cleanStrategies.filter(s => ((s.profitability || 0) * 100) <= 0)
    };
    
    Object.entries(cleanTiers).forEach(([tierName, tierStrategies]) => {
        const tierTitle = tierName.replace(/_/g, ' ').replace(/ROI/g, 'ROI');
        const content = `# CLEAN ${tierTitle}

## 📊 Tier Summary
- **Clean Strategy Count**: ${tierStrategies.length}
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
- 🧠 Clean Factors: ${(s.factors || []).join(', ')}
- 💡 Hypothesis: ${s.hypothesis || 'Not specified'}

**Clean Factor Breakdown:**
${(s.factors || []).map(f => `  - \`${f}\``).join('\n')}

**Implementation Recommendation:**
${roi > 20 ? '✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy' : 
  roi > 5 ? '⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management' : 
  roi > 0 ? '🔍 **RESEARCH PHASE** - Monitor performance' : 
  '❌ **AVOID** - Unprofitable'}

---`;
    }).join('\n') : 'No clean strategies in this tier.'}
`;
        
        fs.writeFileSync(path.join(docsDir, `CLEAN_${tierName}.md`), content);
    });
    
    // Create quick reference for clean strategies
    const cleanQuickRef = `# CLEAN STRATEGIES QUICK REFERENCE

## 🚀 READY TO IMPLEMENT (20%+ ROI) - CLEAN ONLY
${cleanTiers.EXCEPTIONAL_50_PLUS_ROI.concat(cleanTiers.STRONG_20_TO_50_ROI)
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## ⚠️ CONDITIONAL (5-20% ROI) - CLEAN ONLY
${cleanTiers.MODERATE_5_TO_20_ROI
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 🔍 RESEARCH ONLY (0-5% ROI) - CLEAN ONLY
${cleanTiers.MARGINAL_0_TO_5_ROI
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## ❌ AVOID (Negative ROI) - CLEAN ONLY
${cleanTiers.UNPROFITABLE_NEGATIVE_ROI.length > 0 ? 
    cleanTiers.UNPROFITABLE_NEGATIVE_ROI
        .sort((a, b) => (a.profitability || 0) - (b.profitability || 0))
        .slice(0, 5)
        .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
        .join('\n') : 'No unprofitable clean strategies (good!)'}

*Total clean strategies: ${cleanStrategies.length}*
*Total contaminated strategies removed: ${contaminatedStrategies.length}*
`;
    
    fs.writeFileSync(path.join(docsDir, 'CLEAN_QUICK_REFERENCE.md'), cleanQuickRef);
    
    console.log('\n✅ Clean strategy analysis complete!');
    console.log(`📁 Clean documentation saved to: ${path.resolve(docsDir)}`);
    console.log('📋 Clean files created:');
    console.log('   - CLEAN_STRATEGIES_COMPLETE_LIST.md (all clean strategies)');
    console.log('   - CLEAN_QUICK_REFERENCE.md (clean strategies by performance)');
    console.log('   - CONTAMINATION_REPORT.md (contaminated strategies to avoid)');
    Object.entries(cleanTiers).forEach(([tier, strategies]) => {
        console.log(`   - CLEAN_${tier}.md (${strategies.length} clean strategies)`);
    });
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
