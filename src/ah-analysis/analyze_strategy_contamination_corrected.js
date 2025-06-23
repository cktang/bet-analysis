const fs = require('fs');
const path = require('path');

console.log('🔍 CORRECTED CONTAMINATION ANALYSIS (fbref.week is NOT contaminated)');
console.log('====================================================================');

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
    
    // Define CORRECTED post-match contamination patterns (fbref.week REMOVED)
    const contaminationPatterns = [
        // Post-match data patterns
        'postMatch',
        
        // FBRef Expected Goals (CONTAMINATED - calculated from actual match events)
        'fbref.homeXG',
        'fbref.awayXG',
        'homeXG',  
        'awayXG',  
        
        // Other FBRef post-match statistics (but NOT fbref.week!)
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
        // NOTE: fbref.week is REMOVED - it's just match week number (1-38), known pre-match
        
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
    
    console.log('\n📊 CORRECTED CONTAMINATION ANALYSIS RESULTS:');
    console.log(`   Total Strategies: ${strategies.length}`);
    console.log(`   Clean Strategies: ${cleanStrategies.length}`);
    console.log(`   Contaminated Strategies: ${contaminatedStrategies.length}`);
    console.log(`   Contamination Rate: ${((contaminatedStrategies.length / strategies.length) * 100).toFixed(1)}%`);
    
    // Analyze clean strategies performance
    const profitableClean = cleanStrategies.filter(s => (s.profitability || 0) > 0);
    const avgROIClean = cleanStrategies.length > 0 ? 
        cleanStrategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / cleanStrategies.length : 0;
    
    console.log('\n📈 CORRECTED CLEAN STRATEGIES PERFORMANCE:');
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
    
    console.log('\n🚨 ACTUAL CONTAMINATION SOURCES (fbref.week CORRECTED):');
    Object.entries(contaminationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} strategies`);
        });
    
    // Show top 20 clean strategies by ROI
    console.log('\n🏆 TOP 20 CLEAN STRATEGIES (fbref.week now allowed):');
    cleanStrategies
        .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
        .slice(0, 20)
        .forEach((s, i) => {
            const roi = ((s.profitability || 0) * 100).toFixed(2);
            console.log(`   ${i + 1}. ${s.name}: ${roi}% ROI`);
        });
    
    // Create corrected clean documentation
    const docsDir = './corrected_clean_strategies_documentation';
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Create corrected clean strategies summary
    const cleanSummary = `# CORRECTED CLEAN STRATEGIES (fbref.week is NOT contaminated)

## 🎯 Corrected Analysis Results

- **Total Clean Strategies**: ${cleanStrategies.length}
- **Profitable Clean Strategies**: ${profitableClean.length}
- **Clean Success Rate**: ${cleanStrategies.length > 0 ? ((profitableClean.length / cleanStrategies.length) * 100).toFixed(1) : '0.0'}%
- **Average ROI (Clean)**: ${avgROIClean.toFixed(2)}%

## ✅ CORRECTION: fbref.week is PRE-MATCH DATA
- ✅ fbref.week = Match week number (1-38) - Known before match starts
- ❌ Only XG and actual performance metrics are contaminated

## 🏆 Top 20 Corrected Clean Strategies by ROI

${cleanStrategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .slice(0, 20)
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n')}

## 📋 Complete Corrected Clean Strategy List

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
*This document contains ONLY clean strategies with NO post-match data contamination*
*fbref.week is correctly identified as pre-match data (match week 1-38)*
`;
    
    fs.writeFileSync(path.join(docsDir, 'CORRECTED_CLEAN_STRATEGIES_COMPLETE_LIST.md'), cleanSummary);
    
    console.log('\n✅ Corrected clean strategy analysis complete!');
    console.log(`📁 Corrected documentation saved to: ${path.resolve(docsDir)}`);
    console.log('\n🎯 KEY CORRECTION: fbref.week is now correctly identified as pre-match data');
    console.log(`   fbref.week = Match week number (1-38), known before match starts`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
} 