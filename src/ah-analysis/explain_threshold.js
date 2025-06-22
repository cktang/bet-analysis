const fs = require('fs');
const path = require('path');

// Explain exactly how the 33.8% threshold is calculated

class ThresholdExplainer {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('📊 Loading data to explain threshold calculation...\n');
        
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
            }
        });

        // Filter for complete data
        this.allMatches = this.allMatches.filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
            match.fbref?.homeXG !== undefined &&
            match.fbref?.awayXG !== undefined &&
            match.enhanced?.preMatch?.marketEfficiency?.awayImpliedProb !== undefined
        );
        
        console.log(`✅ Loaded ${this.allMatches.length} matches with complete data\n`);
    }

    explainThreshold() {
        console.log('🎯 THRESHOLD CALCULATION EXPLANATION\n');
        console.log('═══════════════════════════════════════\n');

        // Extract all away implied probability values
        const awayImpliedProbs = this.allMatches.map(match => {
            return match.enhanced.preMatch.marketEfficiency.awayImpliedProb;
        });

        console.log('STEP 1: Extract all away implied probability values');
        console.log(`Found ${awayImpliedProbs.length} values\n`);

        // Show some sample values
        console.log('Sample values:');
        awayImpliedProbs.slice(0, 10).forEach((prob, i) => {
            const match = this.allMatches[i];
            console.log(`  ${i+1}. ${match.match?.homeTeam} vs ${match.match?.awayTeam}: ${prob.toFixed(4)} (${(prob * 100).toFixed(1)}%)`);
        });
        console.log('  ... (and ' + (awayImpliedProbs.length - 10) + ' more)\n');

        // Sort the values
        const sortedValues = [...awayImpliedProbs].sort((a, b) => a - b);
        
        console.log('STEP 2: Sort all values from lowest to highest');
        console.log('First 10 sorted values:');
        sortedValues.slice(0, 10).forEach((prob, i) => {
            console.log(`  ${i+1}. ${prob.toFixed(4)} (${(prob * 100).toFixed(1)}%)`);
        });
        console.log('  ...');
        console.log('Last 10 sorted values:');
        sortedValues.slice(-10).forEach((prob, i) => {
            const position = sortedValues.length - 10 + i + 1;
            console.log(`  ${position}. ${prob.toFixed(4)} (${(prob * 100).toFixed(1)}%)`);
        });
        console.log('');

        // Find median
        const medianIndex = Math.floor(sortedValues.length / 2);
        const median = sortedValues[medianIndex];

        console.log('STEP 3: Find the median (middle value)');
        console.log(`Total values: ${sortedValues.length}`);
        console.log(`Median index: ${medianIndex} (middle position)`);
        console.log(`Median value: ${median.toFixed(4)} = ${(median * 100).toFixed(1)}%\n`);

        // Show values around the median
        console.log('Values around the median:');
        const start = Math.max(0, medianIndex - 5);
        const end = Math.min(sortedValues.length, medianIndex + 6);
        
        for (let i = start; i < end; i++) {
            const marker = i === medianIndex ? ' ← MEDIAN' : '';
            console.log(`  Position ${i+1}: ${sortedValues[i].toFixed(4)} (${(sortedValues[i] * 100).toFixed(1)}%)${marker}`);
        }
        console.log('');

        // Explain what this means
        console.log('STEP 4: Use median as decision threshold');
        console.log(`Threshold = ${median.toFixed(4)} = ${(median * 100).toFixed(1)}%\n`);

        console.log('📊 WHAT THIS MEANS:\n');
        console.log('The threshold splits all matches into two equal groups:');
        
        const belowThreshold = sortedValues.filter(val => val <= median).length;
        const aboveThreshold = sortedValues.filter(val => val > median).length;
        
        console.log(`• ${belowThreshold} matches have away probability ≤ ${(median * 100).toFixed(1)}% → BET AWAY`);
        console.log(`• ${aboveThreshold} matches have away probability > ${(median * 100).toFixed(1)}% → BET HOME\n`);

        console.log('🧠 WHY USE THE MEDIAN?\n');
        console.log('1. **Equal Distribution**: Ensures roughly 50/50 split of bet types');
        console.log('2. **Data-Driven**: No arbitrary threshold, uses actual data distribution');
        console.log('3. **Robust**: Median is less affected by extreme values than average');
        console.log('4. **Balanced**: Prevents strategy from being too heavily weighted to one side\n');

        console.log('💡 ALTERNATIVE THRESHOLDS:\n');
        const percentiles = [0.25, 0.5, 0.75];
        percentiles.forEach(percentile => {
            const index = Math.floor(sortedValues.length * percentile);
            const value = sortedValues[index];
            const percentage = percentile * 100;
            console.log(`${percentage}th percentile: ${value.toFixed(4)} (${(value * 100).toFixed(1)}%)`);
        });

        console.log('\nThe median (50th percentile) was chosen for this strategy.\n');

        console.log('🔍 VERIFICATION:\n');
        console.log('You can verify this in the CSV report:');
        console.log('• Every match shows the threshold value');
        console.log('• Decision logic shows: "X.XXX > 0.338 → BET HOME" or "X.XXX ≤ 0.338 → BET AWAY"');
        console.log('• The 0.338 value comes from this median calculation');

        return median;
    }
}

if (require.main === module) {
    const explainer = new ThresholdExplainer();
    explainer.explainThreshold();
}

module.exports = ThresholdExplainer;