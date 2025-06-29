const fs = require('fs');
const path = require('path');

// Load discovery data
const discoveryData = JSON.parse(fs.readFileSync('../results/optimized_discovery.json', 'utf8'));

console.log(`🔍 Loaded ${discoveryData.length} strategies from discovery data\n`);

// Extract ALL unique factors from actual strategy names
function extractAllFactorsFromData() {
    const allFactors = new Set();
    
    discoveryData.forEach(strategy => {
        const parts = strategy.name.split('_');
        parts.forEach(part => {
            if (part.includes('-') && !part.includes('strategy')) {
                allFactors.add(part);
            }
        });
    });
    
    return Array.from(allFactors).sort();
}

// Create factor definitions based on actual data
function createFactorDefinitions(actualFactors) {
    const definitions = {};
    
    actualFactors.forEach(factor => {
        const [prefix, value] = factor.split('-', 2);
        let category = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        let name = value;
        let desc = `${prefix}: ${value}`;
        
        // Clean up category names
        switch(prefix) {
            case 'side':
                category = 'Bet Side';
                name = value.charAt(0).toUpperCase() + value.slice(1);
                desc = `Bet ${value} team`;
                break;
            case 'size':
                category = 'Staking';
                name = value === 'fix' ? 'Fixed' : 'Dynamic';
                desc = `${name} staking method`;
                break;
            case 'time':
                category = 'Timing';
                name = value.replace(/([A-Z])/g, ' $1').trim();
                name = name.charAt(0).toUpperCase() + name.slice(1);
                desc = `${name} timing pattern`;
                break;
            case 'ahLevel':
                category = 'Handicap Level';
                name = `Level ${value}`;
                desc = `Asian handicap level ${value}`;
                break;
            case 'context':
                category = 'Context';
                name = value.replace(/([A-Z])/g, ' $1').trim();
                name = name.charAt(0).toUpperCase() + name.slice(1);
                desc = `${name} context`;
                break;
            case 'handicapType':
                category = 'Handicap Type';
                name = value.charAt(0).toUpperCase() + value.slice(1);
                desc = `${name} handicap type`;
                break;
            case 'oddsLevel':
                category = 'Odds Level';
                name = value.charAt(0).toUpperCase() + value.slice(1);
                desc = `${name} odds level`;
                break;
            case 'matchUp':
                category = 'Match Type';
                name = value.charAt(0).toUpperCase() + value.slice(1);
                desc = `${name} match type`;
                break;
        }
        
        definitions[factor] = { category, name, desc };
    });
    
    return definitions;
}

// Test a combination of factors using actual strategy names
function testCombination(selectedFactors, allStrategies) {
    const filtered = allStrategies.filter(strategy => {
        // Check if ALL selected factors are present in this strategy name
        return selectedFactors.every(factor => strategy.name.includes(factor));
    });

    if (filtered.length === 0) {
        return { 
            type: 'no_match', 
            patterns: 0, 
            roi: 0, 
            bets: 0, 
            profit: 0,
            factors: selectedFactors
        };
    }

    const roi = filtered.reduce((sum, p) => sum + p.roi, 0) / filtered.length;
    const bets = filtered.reduce((sum, p) => sum + p.bets, 0);
    const profit = filtered.reduce((sum, p) => sum + p.totalProfit, 0);
    const sortedPatterns = [...filtered].sort((a, b) => b.roi - a.roi);

    let result = {
        factors: selectedFactors,
        patterns: filtered.length,
        roi: roi,
        bets: bets,
        profit: profit,
        topStrategies: sortedPatterns.slice(0, 5)
    };

    // Classify result type
    if (filtered.length === 1) {
        result.type = 'single_exact';
        result.strategy = filtered[0];
    } else if (filtered.length <= 10) {
        result.type = 'small_group';
        result.representative = sortedPatterns[0]; // Best ROI strategy
    } else if (filtered.length <= 100) {
        result.type = 'aggregate';
    } else {
        result.type = 'too_broad';
    }

    return result;
}

// Generate all meaningful combinations systematically
function generateAllCombinations(factors, maxFactors = 4) {
    const results = [];
    
    console.log(`📊 Testing combinations with up to ${maxFactors} factors from ${factors.length} available factors...\n`);
    
    // Generate combinations of different sizes
    for (let size = 1; size <= maxFactors; size++) {
        console.log(`Testing ${size}-factor combinations...`);
        const combinations = generateCombinationsOfSize(factors, size);
        
        let count = 0;
        for (const combination of combinations) {
            const result = testCombination(combination, discoveryData);
            if (result.patterns > 0) { // Only keep combinations that have matches
                results.push({
                    combination: combination,
                    size: size,
                    ...result
                });
            }
            count++;
            
            // Progress indicator for larger sets
            if (count % 1000 === 0) {
                console.log(`  Tested ${count} combinations...`);
            }
        }
        
        console.log(`  ✅ Completed ${count} combinations of size ${size}\n`);
    }
    
    return results;
}

// Generate all combinations of a specific size
function* generateCombinationsOfSize(arr, size) {
    if (size === 1) {
        for (const item of arr) {
            yield [item];
        }
    } else if (size <= arr.length) {
        for (let i = 0; i <= arr.length - size; i++) {
            const rest = generateCombinationsOfSize(arr.slice(i + 1), size - 1);
            for (const combination of rest) {
                yield [arr[i], ...combination];
            }
        }
    }
}

// Analyze and report results
function analyzeResults(results, factorDefinitions) {
    const summary = {
        total: results.length,
        byType: {},
        bySize: {},
        bestSingleStrategies: [],
        bestSmallGroups: [],
        bestAggregates: [],
        problematicCombinations: []
    };

    results.forEach(result => {
        // Count by type
        if (!summary.byType[result.type]) {
            summary.byType[result.type] = 0;
        }
        summary.byType[result.type]++;
        
        // Count by size
        if (!summary.bySize[result.size]) {
            summary.bySize[result.size] = 0;
        }
        summary.bySize[result.size]++;

        // Collect interesting results
        const factorNames = result.factors.map(f => factorDefinitions[f]?.name || f).join(' + ');
        
        if (result.type === 'single_exact' && result.roi > 5) {
            summary.bestSingleStrategies.push({
                factors: factorNames,
                strategy: result.strategy?.name,
                roi: result.roi,
                bets: result.bets
            });
        } else if (result.type === 'small_group' && result.roi > 5) {
            summary.bestSmallGroups.push({
                factors: factorNames,
                representative: result.representative?.name,
                roi: result.roi,
                bets: result.bets,
                patterns: result.patterns
            });
        } else if (result.type === 'aggregate' && result.roi > 3) {
            summary.bestAggregates.push({
                factors: factorNames,
                roi: result.roi,
                bets: result.bets,
                patterns: result.patterns
            });
        } else if (result.type === 'too_broad') {
            summary.problematicCombinations.push({
                factors: factorNames,
                patterns: result.patterns
            });
        }
    });

    // Sort by performance
    summary.bestSingleStrategies.sort((a, b) => b.roi - a.roi);
    summary.bestSmallGroups.sort((a, b) => b.roi - a.roi);
    summary.bestAggregates.sort((a, b) => b.roi - a.roi);

    return summary;
}

// Main execution
function main() {
    console.log('🎯 COMPREHENSIVE FACTOR COMBINATION ANALYSIS\n');
    console.log('============================================\n');
    
    const startTime = Date.now();
    
    // Extract all factors from actual data
    const actualFactors = extractAllFactorsFromData();
    console.log(`📋 Found ${actualFactors.length} unique factors in strategy names:\n`);
    
    // Group factors by category for display
    const byCategory = {};
    actualFactors.forEach(factor => {
        const prefix = factor.split('-')[0];
        if (!byCategory[prefix]) byCategory[prefix] = [];
        byCategory[prefix].push(factor);
    });
    
    Object.entries(byCategory).forEach(([category, factors]) => {
        console.log(`${category}: ${factors.length} factors`);
        console.log(`  ${factors.join(', ')}\n`);
    });
    
    // Create factor definitions
    const factorDefinitions = createFactorDefinitions(actualFactors);
    
    // Test combinations (limit to 3 factors for performance)
    const results = generateAllCombinations(actualFactors, 3);
    
    const endTime = Date.now();
    console.log(`⏱️  Completed analysis in ${((endTime - startTime) / 1000).toFixed(2)} seconds\n`);
    
    // Analyze results
    const summary = analyzeResults(results, factorDefinitions);
    
    // Print summary
    console.log('📊 ANALYSIS SUMMARY:');
    console.log('====================\n');
    console.log(`Total meaningful combinations: ${summary.total.toLocaleString()}`);
    console.log(`Total strategies in dataset: ${discoveryData.length.toLocaleString()}\n`);
    
    console.log('Results by type:');
    Object.entries(summary.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count.toLocaleString()}`);
    });
    
    console.log('\nResults by factor count:');
    Object.entries(summary.bySize).forEach(([size, count]) => {
        console.log(`  ${size} factors: ${count.toLocaleString()}`);
    });
    
    console.log('\n🏆 TOP SINGLE STRATEGIES (ROI > 5%):');
    summary.bestSingleStrategies.slice(0, 10).forEach(s => {
        console.log(`  ${s.factors}: ${s.roi.toFixed(2)}% ROI (${s.bets} bets)`);
        console.log(`    Strategy: ${s.strategy}`);
    });
    
    console.log('\n🎯 TOP SMALL GROUPS (≤10 strategies, ROI > 5%):');
    summary.bestSmallGroups.slice(0, 10).forEach(g => {
        console.log(`  ${g.factors}: ${g.roi.toFixed(2)}% ROI (${g.bets} bets, ${g.patterns} strategies)`);
        console.log(`    Best: ${g.representative}`);
    });
    
    console.log('\n📈 TOP AGGREGATES (ROI > 3%):');
    summary.bestAggregates.slice(0, 10).forEach(a => {
        console.log(`  ${a.factors}: ${a.roi.toFixed(2)}% ROI (${a.bets} bets, ${a.patterns} strategies)`);
    });
    
    // Save comprehensive results
    const outputFile = '../results/comprehensive_combinations_analysis.json';
    const outputData = {
        summary,
        factorDefinitions,
        allResults: results,
        metadata: {
            timestamp: new Date().toISOString(),
            totalCombinations: results.length,
            totalStrategies: discoveryData.length,
            factorCount: actualFactors.length,
            maxFactorsPerCombination: 3
        }
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    
    console.log(`\n💾 Comprehensive results saved to: ${outputFile}`);
    console.log(`\n🎯 Ready to create truly comprehensive drilling dashboard!`);
}

if (require.main === module) {
    main();
}

module.exports = { testCombination, generateAllCombinations, analyzeResults }; 