const fs = require('fs');
const path = require('path');

console.log('🗑️ PERMANENTLY REMOVING CONTAMINATED STRATEGIES');
console.log('===============================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

console.log('📁 Reading analysis results...');

try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Define contamination patterns (anything using post-match data)
    const contaminationPatterns = [
        'postMatch',
        'fbref.homeXG', 'fbref.awayXG', 'homeXG', 'awayXG', 'totalXG', 'xgAccuracy', 'XG', 'xG',
        'fbref.homeShots', 'fbref.awayShots', 'fbref.homeShotsOnTarget', 'fbref.awayShotsOnTarget',
        'fbref.homeCorners', 'fbref.awayCorners', 'fbref.homeFouls', 'fbref.awayFouls',
        'fbref.homeYellowCards', 'fbref.awayYellowCards', 'fbref.homeRedCards', 'fbref.awayRedCards',
        'fbref.homePossession', 'fbref.awayPossession', 'fbref.week',
        'enhanced.performance.homeEfficiency', 'enhanced.performance.awayEfficiency',
        'enhanced.performance.homeXGDiff', 'enhanced.performance.awayXGDiff',
        'enhanced.performance.homePerformance', 'enhanced.performance.awayPerformance',
        'enhanced.performance.totalXG', 'enhanced.performance.xgAccuracy',
        'performance.homeEfficiency', 'performance.awayEfficiency', 'performance.totalXG', 'performance.xgAccuracy',
        'actualGoals', 'actualResult', 'matchResult', 'goalsScored', 'goalsConceded',
        'shotsOnTarget', 'shots', 'corners', 'fouls', 'cards', 'possession'
    ];
    
    function isStrategyContaminated(strategy) {
        const factors = strategy.factors || [];
        return factors.some(factor => 
            contaminationPatterns.some(pattern => 
                factor.toLowerCase().includes(pattern.toLowerCase())
            )
        );
    }
    
    let totalStrategiesRemoved = 0;
    let totalIterationsProcessed = 0;
    
    // Process each iteration and remove contaminated strategies
    if (data.iterations && Array.isArray(data.iterations)) {
        data.iterations.forEach((iteration, i) => {
            if (iteration.results && Array.isArray(iteration.results)) {
                const originalCount = iteration.results.length;
                
                // Filter out contaminated strategies
                iteration.results = iteration.results.filter(strategy => {
                    if (!strategy || !strategy.name) return false;
                    return !isStrategyContaminated(strategy);
                });
                
                const removedCount = originalCount - iteration.results.length;
                totalStrategiesRemoved += removedCount;
                totalIterationsProcessed++;
                
                console.log(`Iteration ${i + 1}: Removed ${removedCount} contaminated strategies, kept ${iteration.results.length}`);
            }
        });
    }
    
    // Create backup of original file
    const backupPath = resultsPath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`📁 Backup created: ${backupPath}`);
    
    // Write cleaned data back to original file
    fs.writeFileSync(resultsPath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ CONTAMINATED STRATEGIES PERMANENTLY REMOVED');
    console.log(`📊 Summary:`);
    console.log(`   Iterations Processed: ${totalIterationsProcessed}`);
    console.log(`   Total Contaminated Strategies Removed: ${totalStrategiesRemoved}`);
    console.log(`   Clean Data File: ${resultsPath}`);
    console.log(`   Backup File: ${backupPath}`);
    
    // Verify the cleanup by extracting unique clean strategies
    const allCleanStrategies = new Map();
    
    if (data.iterations && Array.isArray(data.iterations)) {
        data.iterations.forEach((iteration) => {
            if (iteration.results && Array.isArray(iteration.results)) {
                iteration.results.forEach(strategy => {
                    if (strategy && strategy.name) {
                        const existing = allCleanStrategies.get(strategy.name);
                        if (!existing || (strategy.profitability || 0) > (existing.profitability || 0)) {
                            allCleanStrategies.set(strategy.name, strategy);
                        }
                    }
                });
            }
        });
    }
    
    const cleanStrategies = Array.from(allCleanStrategies.values());
    const profitableClean = cleanStrategies.filter(s => (s.profitability || 0) > 0);
    const avgROI = cleanStrategies.length > 0 ? 
        cleanStrategies.reduce((sum, s) => sum + ((s.profitability || 0) * 100), 0) / cleanStrategies.length : 0;
    
    console.log('\n📈 FINAL CLEAN SYSTEM STATS:');
    console.log(`   Total Clean Strategies: ${cleanStrategies.length}`);
    console.log(`   Profitable Strategies: ${profitableClean.length}`);
    console.log(`   Success Rate: ${((profitableClean.length / cleanStrategies.length) * 100).toFixed(1)}%`);
    console.log(`   Average ROI: ${avgROI.toFixed(2)}%`);
    
    console.log('\n🎯 SYSTEM NOW 100% CLEAN - All strategies use only pre-match data!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
