const fs = require('fs');
const path = require('path');

class PatternAnalyzer {
    constructor() {
        this.resultsDir = path.join(__dirname, '../src/pattern-discovery/results');
    }

    analyzeResults(minBets = 5, topN = 20) {
        console.log('=== Pattern Analysis Starting ===');
        
        const files = fs.readdirSync(this.resultsDir).filter(f => f.endsWith('.json'));
        console.log(`Found ${files.length} result files`);
        
        const strategies = [];
        let processed = 0;
        
        for (const file of files) {
            try {
                const filePath = path.join(this.resultsDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Filter strategies with minimum bet requirement
                if (data.totalBets >= minBets) {
                    strategies.push({
                        filename: file,
                        combination: data.combination,
                        description: data.description,
                        totalBets: data.totalBets,
                        wins: data.wins,
                        losses: data.losses,
                        pushes: data.pushes,
                        totalStake: data.totalStake,
                        totalProfit: data.totalProfit,
                        roi: data.roi,
                        winRate: data.winRate
                    });
                }
                
                processed++;
                if (processed % 10000 === 0) {
                    console.log(`Processed ${processed}/${files.length} files...`);
                }
            } catch (error) {
                console.warn(`Error processing ${file}:`, error.message);
            }
        }
        
        console.log(`\nFound ${strategies.length} strategies with ${minBets}+ bets`);
        
        // Sort by ROI descending
        strategies.sort((a, b) => b.roi - a.roi);
        
        // Show top performers
        console.log(`\n=== TOP ${topN} STRATEGIES BY ROI ===`);
        console.log('Rank | ROI%    | Bets | Win% | Profit | Description');
        console.log('-----|---------|------|------|--------|------------');
        
        for (let i = 0; i < Math.min(topN, strategies.length); i++) {
            const s = strategies[i];
            console.log(
                `${(i + 1).toString().padStart(4)} | ` +
                `${s.roi.toFixed(2).padStart(7)}% | ` +
                `${s.totalBets.toString().padStart(4)} | ` +
                `${s.winRate.toFixed(1).padStart(4)}% | ` +
                `${s.totalProfit.toFixed(0).padStart(6)} | ` +
                `${s.description.substring(0, 80)}...`
            );
        }
        
        // Show profitable strategies
        const profitable = strategies.filter(s => s.roi > 0);
        console.log(`\n=== SUMMARY ===`);
        console.log(`Total strategies analyzed: ${strategies.length}`);
        console.log(`Profitable strategies (ROI > 0%): ${profitable.length} (${((profitable.length / strategies.length) * 100).toFixed(1)}%)`);
        
        if (profitable.length > 0) {
            const avgProfitableROI = profitable.reduce((sum, s) => sum + s.roi, 0) / profitable.length;
            console.log(`Average ROI of profitable strategies: ${avgProfitableROI.toFixed(2)}%`);
            
            // Show best factor combinations
            console.log(`\n=== FACTOR ANALYSIS (Top 10 Profitable) ===`);
            const factorCount = {};
            
            profitable.slice(0, 10).forEach(s => {
                s.combination.forEach(factor => {
                    const key = `${factor.group}:${factor.name}`;
                    factorCount[key] = (factorCount[key] || 0) + 1;
                });
            });
            
            const sortedFactors = Object.entries(factorCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15);
                
            console.log('Factor | Count | Usage%');
            console.log('-------|-------|-------');
            sortedFactors.forEach(([factor, count]) => {
                console.log(
                    `${factor.padEnd(30)} | ${count.toString().padStart(5)} | ${((count / 10) * 100).toFixed(0)}%`
                );
            });
        }
        
        // Save summary
        const summary = {
            analysisDate: new Date().toISOString(),
            totalStrategies: strategies.length,
            profitableStrategies: profitable.length,
            profitablePercentage: (profitable.length / strategies.length) * 100,
            top20Strategies: strategies.slice(0, 20),
            allProfitableStrategies: profitable
        };
        
        const summaryPath = path.join(this.resultsDir, '_analysis_summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`\nSummary saved to: ${summaryPath}`);
        
        return summary;
    }
}

// Run if called directly
if (require.main === module) {
    const analyzer = new PatternAnalyzer();
    analyzer.analyzeResults();
}

module.exports = PatternAnalyzer; 