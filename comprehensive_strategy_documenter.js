const fs = require('fs');
const path = require('path');

/**
 * COMPREHENSIVE STRATEGY DOCUMENTER
 * 
 * This script reads the full analysis results and creates detailed documentation
 * for ALL 312 strategies tested, not just the winning ones.
 * 
 * It creates:
 * 1. Individual strategy files with detailed explanations
 * 2. Categorized strategy summaries
 * 3. Performance comparison charts
 * 4. Implementation guides
 */

console.log('📊 COMPREHENSIVE STRATEGY DOCUMENTATION SYSTEM');
console.log('===============================================');

// Load the full analysis results
const resultsPath = '../../data/processed/ah_analysis_results.json';
const finalReportPath = '../../data/processed/ah_final_report.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    console.error(`   Looking for: ${resultsPath}`);
    process.exit(1);
}

console.log('📁 Reading analysis results...');

try {
    // Read the results in chunks to handle large file
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const finalReport = JSON.parse(fs.readFileSync(finalReportPath, 'utf8'));
    
    console.log(`✅ Loaded ${results.length} strategy results`);
    
    // Create comprehensive documentation directory
    const docsDir = './strategy_documentation';
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Create subdirectories
    const subdirs = [
        'profitable_strategies',
        'unprofitable_strategies',
        'high_correlation_strategies',
        'category_summaries',
        'implementation_guides'
    ];
    
    subdirs.forEach(dir => {
        const fullPath = path.join(docsDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
    
    // Strategy categories
    const categories = {
        'Single Factor': [],
        'Adaptive Combinations': [],
        'Complex Multi-Factor': [],
        'Cross-Rule Combinations': [],
        'Positional Strategies': [],
        'Form-Based Strategies': [],
        'Market Efficiency': [],
        'Expected Goals': [],
        'Rescue Strategies': []
    };
    
    // Performance tiers
    const performanceTiers = {
        'Exceptional (>50% ROI)': [],
        'Strong (20-50% ROI)': [],
        'Moderate (5-20% ROI)': [],
        'Marginal (0-5% ROI)': [],
        'Unprofitable (<0% ROI)': []
    };
    
    // Process each strategy
    console.log('📝 Processing strategies...');
    
    results.forEach((strategy, index) => {
        if (!strategy || !strategy.name) return;
        
        // Categorize strategy
        categorizeStrategy(strategy);
        
        // Tier by performance
        tierByPerformance(strategy);
        
        // Create individual strategy documentation
        createStrategyDocument(strategy, index + 1);
        
        if ((index + 1) % 50 === 0) {
            console.log(`   Processed ${index + 1}/${results.length} strategies`);
        }
    });
    
    // Create category summaries
    console.log('📋 Creating category summaries...');
    Object.keys(categories).forEach(category => {
        createCategorySummary(category, categories[category]);
    });
    
    // Create performance tier summaries
    console.log('🎯 Creating performance tier summaries...');
    Object.keys(performanceTiers).forEach(tier => {
        createPerformanceTierSummary(tier, performanceTiers[tier]);
    });
    
    // Create master index
    console.log('📚 Creating master index...');
    createMasterIndex();
    
    // Create implementation guide
    console.log('🔧 Creating implementation guide...');
    createImplementationGuide();
    
    console.log('✅ Comprehensive documentation complete!');
    console.log(`📁 Documentation saved to: ${path.resolve(docsDir)}`);
    
    function categorizeStrategy(strategy) {
        const name = strategy.name.toLowerCase();
        const factors = strategy.factors || [];
        
        if (name.includes('single_')) {
            categories['Single Factor'].push(strategy);
        } else if (name.includes('adaptive_')) {
            categories['Adaptive Combinations'].push(strategy);
        } else if (name.includes('crossrule_')) {
            categories['Cross-Rule Combinations'].push(strategy);
        } else if (name.includes('position') || name.includes('league')) {
            categories['Positional Strategies'].push(strategy);
        } else if (name.includes('form') || name.includes('streak')) {
            categories['Form-Based Strategies'].push(strategy);
        } else if (name.includes('efficiency') || name.includes('market')) {
            categories['Market Efficiency'].push(strategy);
        } else if (name.includes('xg') || factors.some(f => f && f.includes('XG'))) {
            categories['Expected Goals'].push(strategy);
        } else if (name.includes('rescue')) {
            categories['Rescue Strategies'].push(strategy);
        } else {
            categories['Complex Multi-Factor'].push(strategy);
        }
    }
    
    function tierByPerformance(strategy) {
        const profitability = strategy.profitability || 0;
        const profitPercent = profitability * 100;
        
        if (profitPercent > 50) {
            performanceTiers['Exceptional (>50% ROI)'].push(strategy);
        } else if (profitPercent > 20) {
            performanceTiers['Strong (20-50% ROI)'].push(strategy);
        } else if (profitPercent > 5) {
            performanceTiers['Moderate (5-20% ROI)'].push(strategy);
        } else if (profitPercent > 0) {
            performanceTiers['Marginal (0-5% ROI)'].push(strategy);
        } else {
            performanceTiers['Unprofitable (<0% ROI)'].push(strategy);
        }
    }
    
    function createStrategyDocument(strategy, index) {
        const isProfitable = (strategy.profitability || 0) > 0;
        const subdir = isProfitable ? 'profitable_strategies' : 'unprofitable_strategies';
        
        const filename = `${String(index).padStart(3, '0')}_${strategy.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        const filepath = path.join(docsDir, subdir, filename);
        
        const content = generateStrategyDocumentation(strategy, index);
        fs.writeFileSync(filepath, content);
    }
    
    function generateStrategyDocumentation(strategy, index) {
        const profitability = (strategy.profitability || 0) * 100;
        const correlation = strategy.correlation || 0;
        const accuracy = (strategy.accuracy || 0) * 100;
        
        return `# Strategy #${index}: ${strategy.name}

## 📊 Performance Summary

| Metric | Value |
|--------|-------|
| **ROI** | ${profitability.toFixed(2)}% |
| **Correlation** | ${correlation.toFixed(4)} |
| **Accuracy** | ${accuracy.toFixed(2)}% |
| **Sample Size** | ${strategy.sampleSize || 'N/A'} |
| **Valid Samples** | ${strategy.validSamples || 'N/A'} |

## 🎯 Strategy Classification

- **Type**: ${strategy.type || 'Unknown'}
- **Category**: ${getStrategyCategory(strategy)}
- **Performance Tier**: ${getPerformanceTier(strategy)}

## 🧠 Strategy Logic

### Factors Used:
${(strategy.factors || []).map(factor => `- \`${factor}\``).join('\n')}

### Hypothesis:
${strategy.hypothesis || 'No hypothesis provided'}

### Implementation Logic:
${generateImplementationLogic(strategy)}

## 📈 Detailed Performance

${generatePerformanceDetails(strategy)}

## 🔍 Analysis

### Strengths:
${generateStrengths(strategy)}

### Weaknesses:
${generateWeaknesses(strategy)}

### Recommended Use Cases:
${generateUseCases(strategy)}

## 🚀 Implementation Status

${generateImplementationStatus(strategy)}

---

*Generated on ${new Date().toISOString()}*
`;
    }
    
    function getStrategyCategory(strategy) {
        for (const [category, strategies] of Object.entries(categories)) {
            if (strategies.includes(strategy)) {
                return category;
            }
        }
        return 'Uncategorized';
    }
    
    function getPerformanceTier(strategy) {
        for (const [tier, strategies] of Object.entries(performanceTiers)) {
            if (strategies.includes(strategy)) {
                return tier;
            }
        }
        return 'Unknown';
    }
    
    function generateImplementationLogic(strategy) {
        const factors = strategy.factors || [];
        if (factors.length === 0) {
            return 'No factors specified for this strategy.';
        }
        
        let logic = `This strategy combines ${factors.length} factors:\n\n`;
        
        factors.forEach((factor, i) => {
            logic += `${i + 1}. **${factor}**: ${explainFactor(factor)}\n`;
        });
        
        if (strategy.threshold !== undefined) {
            logic += `\n**Decision Threshold**: ${strategy.threshold}\n`;
            logic += `- Values above threshold → Bet on outcome\n`;
            logic += `- Values below threshold → Skip bet\n`;
        }
        
        return logic;
    }
    
    function explainFactor(factor) {
        const explanations = {
            'fbref.homeXG - fbref.awayXG': 'Expected Goals difference (Home XG minus Away XG)',
            'match.homeWinOdds / match.awayWinOdds': 'Win odds ratio (Home odds divided by Away odds)',
            'enhanced.performance.homeEfficiency - enhanced.performance.awayEfficiency': 'Team efficiency difference',
            'timeSeries.home.leaguePosition': 'Home team\'s current league position',
            'timeSeries.away.leaguePosition': 'Away team\'s current league position',
            'match.asianHandicapOdds.homeHandicap': 'Asian Handicap line for home team',
            'enhanced.marketEfficiency.totalImpliedProb': 'Total implied probability from all odds'
        };
        
        return explanations[factor] || 'Custom factor - see strategy details';
    }
    
    function generatePerformanceDetails(strategy) {
        if (!strategy.strategy) {
            return 'No detailed performance data available.';
        }
        
        const s = strategy.strategy;
        let details = '';
        
        if (s.totalBets !== undefined) {
            details += `- **Total Bets**: ${s.totalBets}\n`;
            details += `- **Correct Picks**: ${s.correctPicks || 'N/A'}\n`;
            details += `- **Total Return**: ${s.totalReturn || 'N/A'}\n`;
            if (s.totalBets > 0) {
                details += `- **Average Profit per Bet**: ${((s.totalReturn || 0) / s.totalBets).toFixed(2)}\n`;
            }
        }
        
        if (s.homeBets !== undefined) {
            details += `- **Home Bets**: ${s.homeBets} (${s.homeWins || 0} wins)\n`;
            details += `- **Away Bets**: ${s.awayBets} (${s.awayWins || 0} wins)\n`;
            details += `- **Home ROI**: ${((s.homeProfitability || 0) * 100).toFixed(2)}%\n`;
            details += `- **Away ROI**: ${((s.awayProfitability || 0) * 100).toFixed(2)}%\n`;
        }
        
        return details || 'No performance details available.';
    }
    
    function generateStrengths(strategy) {
        const strengths = [];
        const profitability = (strategy.profitability || 0) * 100;
        const correlation = Math.abs(strategy.correlation || 0);
        const accuracy = (strategy.accuracy || 0) * 100;
        
        if (profitability > 20) strengths.push('High profitability');
        if (correlation > 0.5) strengths.push('Strong correlation with outcomes');
        if (accuracy > 70) strengths.push('High prediction accuracy');
        if (strategy.validSamples > 1000) strengths.push('Large sample size for reliability');
        
        return strengths.length > 0 ? strengths.map(s => `- ${s}`).join('\n') : '- No significant strengths identified';
    }
    
    function generateWeaknesses(strategy) {
        const weaknesses = [];
        const profitability = (strategy.profitability || 0) * 100;
        const correlation = Math.abs(strategy.correlation || 0);
        const accuracy = (strategy.accuracy || 0) * 100;
        
        if (profitability < 0) weaknesses.push('Unprofitable strategy');
        if (correlation < 0.1) weaknesses.push('Weak correlation with outcomes');
        if (accuracy < 55) weaknesses.push('Low prediction accuracy');
        if (strategy.validSamples < 100) weaknesses.push('Small sample size');
        
        return weaknesses.length > 0 ? weaknesses.map(w => `- ${w}`).join('\n') : '- No significant weaknesses identified';
    }
    
    function generateUseCases(strategy) {
        const profitability = (strategy.profitability || 0) * 100;
        
        if (profitability > 30) {
            return '- Primary betting strategy for high-confidence scenarios\n- Suitable for aggressive bankroll management';
        } else if (profitability > 10) {
            return '- Secondary betting strategy\n- Good for portfolio diversification\n- Conservative bankroll management recommended';
        } else if (profitability > 0) {
            return '- Research and analysis only\n- Not recommended for live betting\n- May be useful for filtering other strategies';
        } else {
            return '- Educational purposes only\n- Example of what NOT to bet on\n- Useful for understanding market inefficiencies';
        }
    }
    
    function generateImplementationStatus(strategy) {
        const profitability = (strategy.profitability || 0) * 100;
        
        if (profitability > 20) {
            return '✅ **READY FOR IMPLEMENTATION**\n- High confidence strategy\n- Recommended for live betting\n- Include in automated systems';
        } else if (profitability > 5) {
            return '⚠️ **CONDITIONAL IMPLEMENTATION**\n- Moderate confidence strategy\n- Manual review recommended\n- Consider for portfolio inclusion';
        } else if (profitability > 0) {
            return '🔍 **RESEARCH PHASE**\n- Low confidence strategy\n- Requires further analysis\n- Not recommended for live betting';
        } else {
            return '❌ **NOT RECOMMENDED**\n- Unprofitable strategy\n- Do not implement\n- Useful for educational purposes only';
        }
    }
    
    function createCategorySummary(category, strategies) {
        const filename = `${category.replace(/[^a-zA-Z0-9]/g, '_')}_summary.md`;
        const filepath = path.join(docsDir, 'category_summaries', filename);
        
        const profitable = strategies.filter(s => (s.profitability || 0) > 0);
        const avgROI = strategies.length > 0 ? 
            strategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / strategies.length : 0;
        
        const content = `# ${category} Strategies Summary

## 📊 Overview

- **Total Strategies**: ${strategies.length}
- **Profitable Strategies**: ${profitable.length}
- **Success Rate**: ${strategies.length > 0 ? ((profitable.length / strategies.length) * 100).toFixed(1) : '0.0'}%
- **Average ROI**: ${avgROI.toFixed(2)}%

## 🏆 Top Performers

${strategies.length > 0 ? strategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .slice(0, 5)
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n') : 'No strategies in this category'}

## 📋 Complete List

${strategies.length > 0 ? strategies
    .map((s, i) => {
        const isProfitable = (s.profitability || 0) > 0;
        const subdir = isProfitable ? 'profitable_strategies' : 'unprofitable_strategies';
        return `${i + 1}. [${s.name}](../${subdir}/${s.name.replace(/[^a-zA-Z0-9]/g, '_')}.md) - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`;
    })
    .join('\n') : 'No strategies in this category'}

---

*Generated on ${new Date().toISOString()}*
`;
        
        fs.writeFileSync(filepath, content);
    }
    
    function createPerformanceTierSummary(tier, strategies) {
        const filename = `${tier.replace(/[^a-zA-Z0-9]/g, '_')}_summary.md`;
        const filepath = path.join(docsDir, 'category_summaries', filename);
        
        const avgROI = strategies.length > 0 ? 
            strategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / strategies.length : 0;
        const avgCorrelation = strategies.length > 0 ? 
            strategies.reduce((sum, s) => sum + Math.abs(s.correlation || 0), 0) / strategies.length : 0;
        
        const content = `# ${tier} Performance Tier

## 📊 Tier Statistics

- **Strategy Count**: ${strategies.length}
- **Average ROI**: ${avgROI.toFixed(2)}%
- **Average Correlation**: ${avgCorrelation.toFixed(4)}
- **Tier Range**: ${tier.match(/\(([^)]+)\)/)?.[1] || 'N/A'}

## 📋 Strategies in This Tier

${strategies.length > 0 ? strategies
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .map((s, i) => `${i + 1}. **${s.name}** - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`)
    .join('\n') : 'No strategies in this tier'}

---

*Generated on ${new Date().toISOString()}*
`;
        
        fs.writeFileSync(filepath, content);
    }
    
    function createMasterIndex() {
        const filepath = path.join(docsDir, 'README.md');
        
        const totalStrategies = results.length;
        const profitableCount = results.filter(s => (s.profitability || 0) > 0).length;
        const avgROI = totalStrategies > 0 ? 
            results.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / totalStrategies : 0;
        
        const content = `# Comprehensive Strategy Documentation

## 🎯 System Overview

This documentation covers **ALL ${totalStrategies} strategies** tested by the Asian Handicap analysis system.

### 📊 Performance Summary

- **Total Strategies Tested**: ${totalStrategies}
- **Profitable Strategies**: ${profitableCount}
- **Success Rate**: ${totalStrategies > 0 ? ((profitableCount / totalStrategies) * 100).toFixed(1) : '0.0'}%
- **Average ROI**: ${avgROI.toFixed(2)}%

## 📁 Documentation Structure

### By Performance
- [Profitable Strategies](./profitable_strategies/) - ${profitableCount} strategies with positive ROI
- [Unprofitable Strategies](./unprofitable_strategies/) - ${totalStrategies - profitableCount} strategies with negative ROI

### By Category
${Object.keys(categories).map(cat => 
    `- [${cat}](./category_summaries/${cat.replace(/[^a-zA-Z0-9]/g, '_')}_summary.md) - ${categories[cat].length} strategies`
).join('\n')}

### By Performance Tier
${Object.keys(performanceTiers).map(tier => 
    `- [${tier}](./category_summaries/${tier.replace(/[^a-zA-Z0-9]/g, '_')}_summary.md) - ${performanceTiers[tier].length} strategies`
).join('\n')}

## 🔧 Implementation Guides

- [Implementation Guide](./implementation_guides/README.md) - How to implement strategies
- [Risk Management](./implementation_guides/risk_management.md) - Managing betting risks
- [Portfolio Construction](./implementation_guides/portfolio_construction.md) - Building strategy portfolios

## 🎯 Quick Access

### Top 10 Strategies by ROI
${results.length > 0 ? results
    .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
    .slice(0, 10)
    .map((s, i) => {
        const isProfitable = (s.profitability || 0) > 0;
        const subdir = isProfitable ? 'profitable_strategies' : 'unprofitable_strategies';
        return `${i + 1}. [${s.name}](./profitable_strategies/${s.name.replace(/[^a-zA-Z0-9]/g, '_')}.md) - ${((s.profitability || 0) * 100).toFixed(2)}% ROI`;
    })
    .join('\n') : 'No strategies available'}

---

*Documentation generated on ${new Date().toISOString()}*
*Total strategies documented: ${totalStrategies}*
`;
        
        fs.writeFileSync(filepath, content);
    }
    
    function createImplementationGuide() {
        const guideDir = path.join(docsDir, 'implementation_guides');
        const filepath = path.join(guideDir, 'README.md');
        
        const content = `# Strategy Implementation Guide

## 🚀 Getting Started

This guide explains how to implement the documented strategies in your betting system.

## 📋 Implementation Checklist

### 1. Strategy Selection
- [ ] Review strategy documentation
- [ ] Check performance tier
- [ ] Verify data requirements
- [ ] Assess risk tolerance

### 2. Data Requirements
- [ ] Asian Handicap odds
- [ ] Expected Goals data (FBRef)
- [ ] Team performance metrics
- [ ] League position data
- [ ] Market efficiency calculations

### 3. System Integration
- [ ] Implement factor calculations
- [ ] Set up threshold logic
- [ ] Configure bet sizing
- [ ] Enable logging/tracking

### 4. Risk Management
- [ ] Set maximum bet size
- [ ] Configure stop-loss limits
- [ ] Implement position sizing
- [ ] Monitor drawdown

## 🔧 Technical Implementation

### Factor Calculation Examples

\`\`\`javascript
// Expected Goals Difference
const xgDiff = match.fbref.homeXG - match.fbref.awayXG;

// Win Odds Ratio
const oddsRatio = match.homeWinOdds / match.awayWinOdds;

// Efficiency Difference
const efficiencyDiff = match.enhanced.performance.homeEfficiency - 
                      match.enhanced.performance.awayEfficiency;

// Combined Score
const score = (xgDiff * 0.4) + (oddsRatio * 0.3) + (efficiencyDiff * 0.3);

// Betting Decision
if (score > strategy.threshold) {
    placeBet('home', calculateBetSize(score));
} else if (score < -strategy.threshold) {
    placeBet('away', calculateBetSize(Math.abs(score)));
}
\`\`\`

### Bet Sizing Formula

\`\`\`javascript
function calculateBetSize(confidence, bankroll, maxRisk = 0.02) {
    const kellyFraction = (confidence * winRate - (1 - winRate)) / confidence;
    const safeFraction = Math.min(kellyFraction * 0.25, maxRisk); // Quarter Kelly
    return bankroll * safeFraction;
}
\`\`\`

## 📊 Performance Monitoring

### Key Metrics to Track
- Win Rate
- Average Odds
- ROI (Return on Investment)
- Maximum Drawdown
- Sharpe Ratio
- Bet Frequency

### Monitoring Dashboard
Create a dashboard to track:
1. Daily P&L
2. Strategy performance
3. Risk metrics
4. Market conditions

## ⚠️ Important Warnings

1. **Look-Ahead Bias**: Ensure all factors use only pre-match data
2. **Market Changes**: Strategies may degrade over time
3. **Sample Size**: Small samples can be misleading
4. **Correlation**: Avoid highly correlated strategies in portfolio

---

*For specific strategy implementation details, see individual strategy documentation.*
`;
        
        fs.writeFileSync(filepath, content);
    }

} catch (error) {
    console.error('❌ Error processing strategies:', error.message);
    process.exit(1);
} 