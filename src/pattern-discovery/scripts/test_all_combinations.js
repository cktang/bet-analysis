const fs = require('fs');
const path = require('path');

// Load discovery data
const discoveryData = JSON.parse(fs.readFileSync('../results/optimized_discovery.json', 'utf8'));

// Factor definitions
const factorDefinitions = {
    'betSide-away': { category: 'BetSide', name: 'Away', desc: 'Bet away team' },
    'betSide-home': { category: 'BetSide', name: 'Home', desc: 'Bet home team' },
    'betSide-higherOdds': { category: 'BetSide', name: 'Higher Odds', desc: 'Bet higher odds side' },
    'betSide-lowerOdds': { category: 'BetSide', name: 'Lower Odds', desc: 'Bet lower odds side' },
    'staking-variable': { category: 'Staking', name: 'Variable', desc: 'Variable staking method' },
    'staking-fixed': { category: 'Staking', name: 'Fixed', desc: 'Fixed staking method' },
    'size-fix': { category: 'Size', name: 'Fixed Stakes', desc: 'Fixed bet sizing' },
    'size-dynamic': { category: 'Size', name: 'Dynamic Stakes', desc: 'Variable bet sizing' },
    'matchUp-extreme': { category: 'Match', name: 'Extreme Matchup', desc: 'Extreme odds differential' },
    'context-bottomSixHome': { category: 'Context', name: 'Bottom 6 Home', desc: 'Bottom 6 team at home' },
    'context-bottomSixAway': { category: 'Context', name: 'Bottom 6 Away', desc: 'Bottom 6 team away' },
    'handicapType-quarter': { category: 'Type', name: 'Quarter Handicap', desc: 'Quarter/split handicap' },
    'side-away': { category: 'Side', name: 'Away Team', desc: 'Bet away team' },
    'side-higherOdds': { category: 'Side', name: 'Higher Odds', desc: 'Bet higher odds side' },
    'side-lowerOdds': { category: 'Side', name: 'Lower Odds', desc: 'Bet lower odds side' },
    'side-home': { category: 'Side', name: 'Home Team', desc: 'Bet home team' },
    'oddsLevel-extreme': { category: 'Odds', name: 'Extreme Odds', desc: 'Odds >2.0' },
    'oddsLevel-balanced': { category: 'Odds', name: 'Balanced Odds', desc: 'Odds ≤2.0' },
    'time-midSeason': { category: 'Time', name: 'Mid Season', desc: 'Weeks 9-24' },
    'time-lateSeason': { category: 'Time', name: 'Late Season', desc: 'Weeks 25-38' },
    'ahLevel-homeFavorite': { category: 'AH', name: 'Home Favorite', desc: 'Home team favored' },
    'ahLevel-awayUnderdog': { category: 'AH', name: 'Away Underdog', desc: 'Away team underdog' },
    'handicapType-negative': { category: 'Type', name: 'Negative Handicap', desc: 'Negative handicap' },
    'time-finalStretch': { category: 'Time', name: 'Final Stretch', desc: 'Weeks 32-38' },
    'ahLevel--0.75': { category: 'AH', name: 'Level -0.75', desc: 'Quarter -0.5/-1' },
    'time-christmas': { category: 'Time', name: 'Christmas', desc: 'Christmas period' },
    'ahLevel-awayFavorite': { category: 'AH', name: 'Away Favorite', desc: 'Away team favored' },
    'ahLevel-homeUnderdog': { category: 'AH', name: 'Home Underdog', desc: 'Home team underdog' },
    'time-earlySeason': { category: 'Time', name: 'Early Season', desc: 'Weeks 1-8' },
    'ahLevel--1.25': { category: 'AH', name: 'Level -1.25', desc: 'Quarter -1/-1.5' },
    'ahLevel--0.25': { category: 'AH', name: 'Level -0.25', desc: 'Quarter 0/-0.5' },
    'handicapType-profit': { category: 'Type', name: 'Profit Handicap', desc: 'Even quarter' },
    'ahLevel-0.25': { category: 'AH', name: 'Level +0.25', desc: 'Quarter +0/+0.5' },
    'handicapType-eqaul': { category: 'Type', name: 'Equal Handicap', desc: 'Equal handicap' },
    'ahLevel--1.75': { category: 'AH', name: 'Level -1.75', desc: 'Quarter -1.5/-2' },
    'ahLevel-0': { category: 'AH', name: 'Level 0', desc: 'Even handicap' },
    'time-veryEarly': { category: 'Time', name: 'Very Early', desc: 'Weeks 1-4' }
};

// Extract available factors from data
function extractAvailableFactors() {
    const factorSet = new Set();
    
    Object.keys(factorDefinitions).forEach(factorKey => {
        if (factorKey.startsWith('betSide-')) {
            const betSideValue = factorKey.replace('betSide-', '');
            const hasData = discoveryData.some(pattern => pattern.betSide === betSideValue);
            if (hasData) factorSet.add(factorKey);
        } else if (factorKey.startsWith('staking-')) {
            const stakingValue = factorKey.replace('staking-', '');
            const hasData = discoveryData.some(pattern => pattern.stakingMethod === stakingValue);
            if (hasData) factorSet.add(factorKey);
        } else {
            const hasData = discoveryData.some(pattern => pattern.name.includes(factorKey));
            if (hasData) factorSet.add(factorKey);
        }
    });
    
    return Array.from(factorSet).filter(factor => factorDefinitions[factor]);
}

// Test a combination of factors
function testCombination(selectedFactors) {
    const filtered = discoveryData.filter(pattern => {
        for (const factor of selectedFactors) {
            if (factor.startsWith('betSide-')) {
                const betSideValue = factor.replace('betSide-', '');
                if (pattern.betSide !== betSideValue) return false;
            } else if (factor.startsWith('staking-')) {
                const stakingValue = factor.replace('staking-', '');
                if (!pattern.stakingMethod || pattern.stakingMethod !== stakingValue) return false;
            } else {
                if (!pattern.name.includes(factor)) return false;
            }
        }
        return pattern.bets >= 20;
    });

    if (filtered.length === 0) {
        return { 
            type: 'no_match', 
            patterns: 0, 
            roi: 0, 
            bets: 0, 
            profit: 0,
            factors: selectedFactors.map(f => factorDefinitions[f]?.name).join(' + ')
        };
    }

    const roi = filtered.reduce((sum, p) => sum + p.roi, 0) / filtered.length;
    const bets = filtered.reduce((sum, p) => sum + p.bets, 0);
    const profit = filtered.reduce((sum, p) => sum + p.totalProfit, 0);
    const sortedPatterns = [...filtered].sort((a, b) => b.roi - a.roi);

    // Determine best representation
    let result = {
        factors: selectedFactors.map(f => factorDefinitions[f]?.name).join(' + '),
        patterns: filtered.length,
        roi: roi,
        bets: bets,
        profit: profit
    };

    // Try to find exact strategy match
    const selectedBetSide = selectedFactors.find(f => f.startsWith('betSide-'))?.replace('betSide-', '');
    const factorParts = selectedFactors.map(f => {
        if (f.startsWith('betSide-')) return f.replace('betSide-', 'side-');
        if (f.startsWith('staking-')) return f.replace('staking-', 'staking-');
        return f;
    });
    
    // Try to construct expected strategy names
    const possibleNames = [
        [...factorParts, 'size-fix'].join('_'),
        [...factorParts, 'size-dynamic'].join('_'),
        ['side-' + selectedBetSide, ...factorParts.filter(p => !p.startsWith('side-')), 'size-fix'].join('_'),
        ['side-' + selectedBetSide, ...factorParts.filter(p => !p.startsWith('side-')), 'size-dynamic'].join('_')
    ];
    
    let exactMatch = null;
    for (const name of possibleNames) {
        exactMatch = filtered.find(s => s.name === name);
        if (exactMatch) break;
    }

    // Decision logic
    if (filtered.length === 1) {
        result.type = 'single_exact';
        result.strategy = filtered[0];
    } else if (exactMatch && filtered.length <= 10) {
        result.type = 'single_representative';
        result.strategy = exactMatch;
        result.note = `Best match from ${filtered.length} similar strategies`;
    } else if (selectedFactors.length >= 3 && filtered.length <= 50) {
        result.type = 'aggregate';
        result.topStrategies = sortedPatterns.slice(0, 5);
    } else {
        result.type = 'too_broad';
        result.note = `${filtered.length} strategies found - too broad for single representation`;
    }

    return result;
}

// Generate all meaningful combinations
function generateAllCombinations() {
    const availableFactors = extractAvailableFactors();
    console.log(`Testing combinations from ${availableFactors.length} available factors...`);
    
    const results = [];
    const tested = new Set();

    // Test single factors
    for (const factor of availableFactors) {
        const key = [factor].sort().join('|');
        if (!tested.has(key)) {
            tested.add(key);
            results.push({
                combination: [factor],
                ...testCombination([factor])
            });
        }
    }

    // Test 2-factor combinations
    for (let i = 0; i < availableFactors.length; i++) {
        for (let j = i + 1; j < availableFactors.length; j++) {
            const combination = [availableFactors[i], availableFactors[j]];
            const key = combination.sort().join('|');
            if (!tested.has(key)) {
                tested.add(key);
                results.push({
                    combination: combination,
                    ...testCombination(combination)
                });
            }
        }
    }

    // Test 3-factor combinations (limit to most promising)
    let threeFactorCount = 0;
    const maxThreeFactor = 1000; // Limit to prevent explosion
    
    for (let i = 0; i < availableFactors.length && threeFactorCount < maxThreeFactor; i++) {
        for (let j = i + 1; j < availableFactors.length && threeFactorCount < maxThreeFactor; j++) {
            for (let k = j + 1; k < availableFactors.length && threeFactorCount < maxThreeFactor; k++) {
                const combination = [availableFactors[i], availableFactors[j], availableFactors[k]];
                const key = combination.sort().join('|');
                if (!tested.has(key)) {
                    tested.add(key);
                    results.push({
                        combination: combination,
                        ...testCombination(combination)
                    });
                    threeFactorCount++;
                }
            }
        }
    }

    return results;
}

// Analyze and report results
function analyzeResults(results) {
    const summary = {
        total: results.length,
        byType: {},
        bestSingleStrategies: [],
        bestAggregates: [],
        problematicCombinations: []
    };

    results.forEach(result => {
        if (!summary.byType[result.type]) {
            summary.byType[result.type] = 0;
        }
        summary.byType[result.type]++;

        // Collect interesting results
        if (result.type === 'single_exact' || result.type === 'single_representative') {
            if (result.roi > 5) {
                summary.bestSingleStrategies.push({
                    factors: result.factors,
                    strategy: result.strategy?.name,
                    roi: result.roi,
                    bets: result.bets,
                    patterns: result.patterns
                });
            }
        } else if (result.type === 'aggregate' && result.roi > 3) {
            summary.bestAggregates.push({
                factors: result.factors,
                roi: result.roi,
                bets: result.bets,
                patterns: result.patterns
            });
        } else if (result.type === 'too_broad') {
            summary.problematicCombinations.push({
                factors: result.factors,
                patterns: result.patterns,
                note: result.note
            });
        }
    });

    // Sort by performance
    summary.bestSingleStrategies.sort((a, b) => b.roi - a.roi);
    summary.bestAggregates.sort((a, b) => b.roi - a.roi);

    return summary;
}

// Main execution
function main() {
    console.log('🔍 Testing all meaningful factor combinations...\n');
    
    const startTime = Date.now();
    const results = generateAllCombinations();
    const endTime = Date.now();
    
    console.log(`✅ Tested ${results.length} combinations in ${endTime - startTime}ms\n`);
    
    const summary = analyzeResults(results);
    
    // Print summary
    console.log('📊 SUMMARY:');
    console.log(`Total combinations tested: ${summary.total}`);
    console.log('\nBy type:');
    Object.entries(summary.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    
    console.log('\n🏆 TOP SINGLE STRATEGIES (ROI > 5%):');
    summary.bestSingleStrategies.slice(0, 10).forEach(s => {
        console.log(`  ${s.factors}: ${s.roi.toFixed(2)}% ROI (${s.bets} bets) - ${s.strategy}`);
    });
    
    console.log('\n📈 TOP AGGREGATES (ROI > 3%):');
    summary.bestAggregates.slice(0, 10).forEach(a => {
        console.log(`  ${a.factors}: ${a.roi.toFixed(2)}% ROI (${a.bets} bets, ${a.patterns} strategies)`);
    });
    
    console.log('\n⚠️  PROBLEMATIC COMBINATIONS (too broad):');
    summary.problematicCombinations.slice(0, 5).forEach(p => {
        console.log(`  ${p.factors}: ${p.patterns} strategies - ${p.note}`);
    });
    
    // Save detailed results
    const outputFile = '../results/all_combinations_analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify({
        summary,
        allResults: results,
        timestamp: new Date().toISOString(),
        totalCombinations: results.length
    }, null, 2));
    
    console.log(`\n💾 Detailed results saved to: ${outputFile}`);
    console.log('\n🎯 Use this data to update the dashboard with pre-computed combinations!');
}

if (require.main === module) {
    main();
}

module.exports = { testCombination, generateAllCombinations, analyzeResults }; 