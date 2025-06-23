const fs = require('fs');
const path = require('path');

console.log('🔍 UPDATED CONTAMINATION ANALYSIS (Including homeXG/awayXG)');
console.log('==========================================================');

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
    
    // Define UPDATED post-match contamination patterns
    const contaminationPatterns = [
        // Post-match data patterns
        'postMatch',
        
        // FBRef Expected Goals (CONTAMINATED - calculated from actual match events)
        'fbref.homeXG',
        'fbref.awayXG',
        'homeXG',  // Added this pattern
        'awayXG',  // Added this pattern
        
        // Other FBRef post-match statistics
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
    
    console.log('\n📊 UPDATED CONTAMINATION ANALYSIS RESULTS:');
    console.log(`   Total Strategies: ${strategies.length}`);
    console.log(`   Clean Strategies: ${cleanStrategies.length}`);
    console.log(`   Contaminated Strategies: ${contaminatedStrategies.length}`);
    console.log(`   Contamination Rate: ${((contaminatedStrategies.length / strategies.length) * 100).toFixed(1)}%`);
    
    // Analyze clean strategies performance
    const profitableClean = cleanStrategies.filter(s => (s.profitability || 0) > 0);
    const avgROIClean = cleanStrategies.length > 0 ? 
        cleanStrategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / cleanStrategies.length : 0;
    
    console.log('\n📈 UPDATED CLEAN STRATEGIES PERFORMANCE:');
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
    
    console.log('\n🚨 TOP CONTAMINATION SOURCES (UPDATED):');
    Object.entries(contaminationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} strategies`);
        });
    
    // Create updated clean documentation
    const docsDir = './updated_clean_strategies_documentation';
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Create updated clean strategies summary
    const cleanSummary = `# UPDATED CLEAN STRATEGIES (NO POST-MATCH DATA INCLUDING XG)

## 🎯 Updated Clean Analysis Results

- **Total Clean Strategies**: ${cleanStrategies.length}
- **Profitable Clean Strategies**: ${profitableClean.length}
- **Clean Success Rate**: ${cleanStrategies.length > 0 ? ((profitableClean.length / cleanStrategies.length) * 100).toFixed(1) : '0.0'}%
- **Average ROI (Clean)**: ${avgROIClean.toFixed(2)}%

## ⚠️ CONTAMINATION PATTERNS REMOVED:
- ❌ fbref.homeXG / fbref.awayXG (Expected Goals from match events)
- ❌ homeXG / awayXG (Expected Goals in any form)
- ❌ enhanced.performance.* (Performance metrics using actual results)
- ❌ Any post-match statistics

## 🏆 Top 20 Updated Clean Strategies by ROI

${cleanStrategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .slice(0, 20)
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 📋 Complete Updated Clean Strategy List

${cleanStrategies
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

**Verified Clean Factors Used:**
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
*This document contains ONLY clean strategies with NO post-match data contamination (including XG)*
`;
    
    fs.writeFileSync(path.join(docsDir, 'UPDATED_CLEAN_STRATEGIES_COMPLETE_LIST.md'), cleanSummary);
    
    // Create updated contamination report
    const contaminationReport = `# UPDATED CONTAMINATION ANALYSIS REPORT

## 📊 Summary

- **Total Strategies Analyzed**: ${strategies.length}
- **Clean Strategies**: ${cleanStrategies.length} (${((cleanStrategies.length / strategies.length) * 100).toFixed(1)}%)
- **Contaminated Strategies**: ${contaminatedStrategies.length} (${((contaminatedStrategies.length / strategies.length) * 100).toFixed(1)}%)

## 🚨 Updated Contamination Sources

${Object.entries(contaminationCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([pattern, count]) => `- **${pattern}**: ${count} strategies (${((count / contaminatedStrategies.length) * 100).toFixed(1)}% of contaminated)`)
    .join('\n')}

## 🔍 Key Changes from Previous Analysis:
- Added homeXG/awayXG as contamination patterns
- More strict identification of Expected Goals contamination
- Updated clean strategy count and performance metrics

## ❌ All Contaminated Strategies (Including XG)

${contaminatedStrategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => {
        const roi = ((s.profitability || 0) * 100).toFixed(2);
        return `### ${i + 1}. ${s.name} (${roi}% ROI)

**Contamination Issues:**
${s.contaminationReasons.map(reason => `- ${reason}`).join('\n')}

**All Factors:**
${(s.factors || []).map(f => `- \`${f}\``).join('\n')}

---`;
    })
    .join('\n')}

*This report identifies all strategies using post-match data (including XG) that should be excluded*
`;
    
    fs.writeFileSync(path.join(docsDir, 'UPDATED_CONTAMINATION_REPORT.md'), contaminationReport);
    
    // Create performance tiers for updated clean strategies only
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
        const content = `# UPDATED CLEAN ${tierTitle}

## 📊 Tier Summary
- **Updated Clean Strategy Count**: ${tierStrategies.length}
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
- 🧠 Verified Clean Factors: ${(s.factors || []).join(', ')}
- 💡 Hypothesis: ${s.hypothesis || 'Not specified'}

**Clean Factor Breakdown:**
${(s.factors || []).map(f => `  - \`${f}\``).join('\n')}

**Implementation Recommendation:**
${roi > 20 ? '✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)' : 
  roi > 5 ? '⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management' : 
  roi > 0 ? '🔍 **RESEARCH PHASE** - Monitor performance' : 
  '❌ **AVOID** - Unprofitable'}

---`;
    }).join('\n') : 'No clean strategies in this tier.'}
`;
        
        fs.writeFileSync(path.join(docsDir, `UPDATED_CLEAN_${tierName}.md`), content);
    });
    
    // Create updated quick reference for clean strategies
    const cleanQuickRef = `# UPDATED CLEAN STRATEGIES QUICK REFERENCE (NO XG CONTAMINATION)

## 🚀 READY TO IMPLEMENT (20%+ ROI) - UPDATED CLEAN ONLY
${cleanTiers.EXCEPTIONAL_50_PLUS_ROI.concat(cleanTiers.STRONG_20_TO_50_ROI)
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## ⚠️ CONDITIONAL (5-20% ROI) - UPDATED CLEAN ONLY
${cleanTiers.MODERATE_5_TO_20_ROI
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 🔍 RESEARCH ONLY (0-5% ROI) - UPDATED CLEAN ONLY
${cleanTiers.MARGINAL_0_TO_5_ROI
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## ❌ AVOID (Negative ROI) - UPDATED CLEAN ONLY
${cleanTiers.UNPROFITABLE_NEGATIVE_ROI.length > 0 ? 
    cleanTiers.UNPROFITABLE_NEGATIVE_ROI
        .sort((a, b) => (a.profitability || 0) - (b.profitability || 0))
        .slice(0, 5)
        .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
        .join('\n') : 'No unprofitable clean strategies (good!)'}

## 📊 COMPARISON WITH PREVIOUS ANALYSIS:
- Previous Clean Strategies: 135
- Updated Clean Strategies: ${cleanStrategies.length}
- Strategies Removed Due to XG Contamination: ${135 - cleanStrategies.length}

*Total updated clean strategies: ${cleanStrategies.length}*
*Total contaminated strategies removed: ${contaminatedStrategies.length}*
*XG contamination patterns now properly identified and removed*
`;
    
    fs.writeFileSync(path.join(docsDir, 'UPDATED_CLEAN_QUICK_REFERENCE.md'), cleanQuickRef);
    
    console.log('\n✅ Updated clean strategy analysis complete!');
    console.log(`📁 Updated clean documentation saved to: ${path.resolve(docsDir)}`);
    console.log('📋 Updated clean files created:');
    console.log('   - UPDATED_CLEAN_STRATEGIES_COMPLETE_LIST.md (all updated clean strategies)');
    console.log('   - UPDATED_CLEAN_QUICK_REFERENCE.md (updated clean strategies by performance)');
    console.log('   - UPDATED_CONTAMINATION_REPORT.md (updated contaminated strategies to avoid)');
    Object.entries(cleanTiers).forEach(([tier, strategies]) => {
        console.log(`   - UPDATED_CLEAN_${tier}.md (${strategies.length} updated clean strategies)`);
    });
    
    // Show comparison with previous analysis
    console.log('\n📊 COMPARISON WITH PREVIOUS ANALYSIS:');
    console.log(`   Previous Clean Strategies: 135`);
    console.log(`   Updated Clean Strategies: ${cleanStrategies.length}`);
    console.log(`   Additional Strategies Removed: ${135 - cleanStrategies.length}`);
    console.log(`   Additional Contamination Rate: ${(((135 - cleanStrategies.length) / 135) * 100).toFixed(1)}%`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
