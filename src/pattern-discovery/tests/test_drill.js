const fs = require('fs');
const path = require('path');

// Load discovery data
console.log('🔍 Testing Factor Drilling Logic...\n');

const dataPath = path.join(__dirname, 'results', 'optimized_discovery.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`📊 Loaded ${data.length} total patterns\n`);

// Test basic filtering
function getPerformance(selectedFactors = []) {
    const filtered = data.filter(pattern => {
        // Must be away bet with variable staking
        if (pattern.betSide !== 'away') return false;
        if (!pattern.stakingMethod || pattern.stakingMethod !== 'variable') return false;
        
        // Must include all selected factors
        for (const factor of selectedFactors) {
            if (!pattern.name.includes(factor)) return false;
        }
        
        // Must have minimum bets
        return pattern.bets >= 20;
    });

    if (filtered.length === 0) {
        return { patterns: 0, roi: 0, bets: 0, profit: 0 };
    }

    const roi = filtered.reduce((sum, p) => sum + p.roi, 0) / filtered.length;
    const bets = filtered.reduce((sum, p) => sum + p.bets, 0);
    const profit = filtered.reduce((sum, p) => sum + p.totalProfit, 0);
    
    return { patterns: filtered.length, roi, bets, profit };
}

// Test drilling sequence
console.log('🎯 Testing Factor Drilling Sequence:\n');

// Step 1: Just mandatory factors
const step1 = getPerformance();
console.log(`Step 1 - Mandatory Only: ${step1.patterns} patterns, ${step1.roi.toFixed(2)}% ROI, $${step1.profit.toLocaleString()} profit`);

// Step 2: Add early season
const step2 = getPerformance(['time-earlySeason']);
const step2Impact = step2.roi - step1.roi;
console.log(`Step 2 - +Early Season: ${step2.patterns} patterns, ${step2.roi.toFixed(2)}% ROI (${step2Impact > 0 ? '+' : ''}${step2Impact.toFixed(2)}% impact)`);

// Step 3: Add quarter handicap
const step3 = getPerformance(['time-earlySeason', 'ahLevel--0.25']);
const step3Impact = step3.roi - step2.roi;
console.log(`Step 3 - +Quarter (0/-0.5): ${step3.patterns} patterns, ${step3.roi.toFixed(2)}% ROI (${step3Impact > 0 ? '+' : ''}${step3Impact.toFixed(2)}% impact)`);

// Step 4: Add odds level
const step4 = getPerformance(['time-earlySeason', 'ahLevel--0.25', 'oddsLevel-balanced']);
const step4Impact = step4.roi - step3.roi;
console.log(`Step 4 - +Balanced Odds: ${step4.patterns} patterns, ${step4.roi.toFixed(2)}% ROI (${step4Impact > 0 ? '+' : ''}${step4Impact.toFixed(2)}% impact)`);

console.log('\n📈 Drilling Summary:');
console.log(`• Best single factor to add: ${step2Impact > 0 ? 'Early Season (+' + step2Impact.toFixed(2) + '%)' : 'N/A'}`);
console.log(`• Best two-factor combo: Early Season + Quarter (${step3.roi.toFixed(2)}% ROI)`);
console.log(`• Pattern count evolution: ${step1.patterns} → ${step2.patterns} → ${step3.patterns} → ${step4.patterns}`);

// Test some alternative factors
console.log('\n🔀 Testing Alternative Factors:');

const altQuarter = getPerformance(['time-earlySeason', 'ahLevel--0.75']);
console.log(`Early Season + Quarter (-0.5/-1): ${altQuarter.patterns} patterns, ${altQuarter.roi.toFixed(2)}% ROI`);

const altExtreme = getPerformance(['time-earlySeason', 'oddsLevel-extreme']);
console.log(`Early Season + Extreme Odds: ${altExtreme.patterns} patterns, ${altExtreme.roi.toFixed(2)}% ROI`);

console.log('\n✅ Drilling logic test complete!');
console.log('💡 Dashboard ready at: http://localhost:8889');

// Show available factor types in data
console.log('\n🔍 Available Factor Types in Data:');
const factorTypes = new Set();
data.forEach(pattern => {
    const parts = pattern.name.split('_');
    parts.forEach(part => {
        if (part.includes('-') && !part.includes('strategy')) {
            factorTypes.add(part);
        }
    });
});

Array.from(factorTypes).sort().forEach(factor => {
    console.log(`  • ${factor}`);
}); 