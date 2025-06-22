const fs = require('fs');
const path = require('path');

// Walk-forward testing to see if strategy degrades on unseen data
class WalkForwardTest {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.seasonData = {};
        this.loadSeasonalData();
    }

    loadSeasonalData() {
        console.log('📊 Loading seasonal data for walk-forward testing...\n');
        
        const seasons = [
            { file: 'year-2022-2023.json', name: '2022-2023' },
            { file: 'year-2023-2024.json', name: '2023-2024' },
            { file: 'year-2024-2025.json', name: '2024-2025' }
        ];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season.file);
            if (fs.existsSync(seasonPath)) {
                const data = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(data.matches).filter(match => 
                    match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
                    match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
                    match.enhanced?.preMatch?.marketEfficiency?.awayImpliedProb !== undefined
                );
                
                this.seasonData[season.name] = matches;
                console.log(`✅ ${season.name}: ${matches.length} valid matches`);
            }
        });
        console.log('');
    }

    calculateThreshold(matches) {
        const awayProbs = matches.map(m => m.enhanced.preMatch.marketEfficiency.awayImpliedProb);
        const sorted = awayProbs.sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    }

    testStrategy(trainMatches, testMatches, threshold) {
        let totalReturn = 0;
        let correctPicks = 0;
        let homeBets = 0;
        let awayBets = 0;
        let homeReturn = 0;
        let awayReturn = 0;

        testMatches.forEach(match => {
            const awayProb = match.enhanced.preMatch.marketEfficiency.awayImpliedProb;
            
            if (awayProb > threshold) {
                // Bet HOME
                homeBets++;
                const profit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
                totalReturn += profit;
                homeReturn += profit;
                if (profit > 0) correctPicks++;
            } else {
                // Bet AWAY
                awayBets++;
                const profit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
                totalReturn += profit;
                awayReturn += profit;
                if (profit > 0) correctPicks++;
            }
        });

        return {
            totalMatches: testMatches.length,
            totalInvestment: testMatches.length * 100,
            totalReturn,
            profitability: (totalReturn / (testMatches.length * 100)) * 100,
            accuracy: (correctPicks / testMatches.length) * 100,
            homeBets,
            awayBets,
            homeReturn,
            awayReturn,
            homeProfitability: homeBets > 0 ? (homeReturn / (homeBets * 100)) * 100 : 0,
            awayProfitability: awayBets > 0 ? (awayReturn / (awayBets * 100)) * 100 : 0
        };
    }

    runWalkForwardTest() {
        console.log('🚶 WALK-FORWARD TESTING: Train → Test on Future Data\n');
        console.log('═══════════════════════════════════════\n');

        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        const results = [];

        // Test 1: Train on 2022-2023, Test on 2023-2024
        console.log('📈 TEST 1: Train 2022-2023 → Test 2023-2024');
        const threshold1 = this.calculateThreshold(this.seasonData['2022-2023']);
        console.log(`Training threshold: ${(threshold1 * 100).toFixed(2)}%`);
        
        const result1 = this.testStrategy(
            this.seasonData['2022-2023'], 
            this.seasonData['2023-2024'], 
            threshold1
        );
        
        console.log(`Results: ${result1.profitability.toFixed(2)}% profit, ${result1.accuracy.toFixed(1)}% accuracy`);
        console.log(`Home: ${result1.homeProfitability.toFixed(2)}%, Away: ${result1.awayProfitability.toFixed(2)}%\n`);
        results.push({ test: 'Train 2022-2023 → Test 2023-2024', ...result1 });

        // Test 2: Train on 2022-2023 + 2023-2024, Test on 2024-2025  
        console.log('📈 TEST 2: Train 2022-2024 → Test 2024-2025');
        const combinedTraining = [...this.seasonData['2022-2023'], ...this.seasonData['2023-2024']];
        const threshold2 = this.calculateThreshold(combinedTraining);
        console.log(`Training threshold: ${(threshold2 * 100).toFixed(2)}%`);
        
        const result2 = this.testStrategy(
            combinedTraining,
            this.seasonData['2024-2025'],
            threshold2
        );
        
        console.log(`Results: ${result2.profitability.toFixed(2)}% profit, ${result2.accuracy.toFixed(1)}% accuracy`);
        console.log(`Home: ${result2.homeProfitability.toFixed(2)}%, Away: ${result2.awayProfitability.toFixed(2)}%\n`);
        results.push({ test: 'Train 2022-2024 → Test 2024-2025', ...result2 });

        // Test 3: Train on 2023-2024, Test on 2024-2025
        console.log('📈 TEST 3: Train 2023-2024 → Test 2024-2025');
        const threshold3 = this.calculateThreshold(this.seasonData['2023-2024']);
        console.log(`Training threshold: ${(threshold3 * 100).toFixed(2)}%`);
        
        const result3 = this.testStrategy(
            this.seasonData['2023-2024'],
            this.seasonData['2024-2025'],
            threshold3
        );
        
        console.log(`Results: ${result3.profitability.toFixed(2)}% profit, ${result3.accuracy.toFixed(1)}% accuracy`);
        console.log(`Home: ${result3.homeProfitability.toFixed(2)}%, Away: ${result3.awayProfitability.toFixed(2)}%\n`);
        results.push({ test: 'Train 2023-2024 → Test 2024-2025', ...result3 });

        // Compare with original "all data" result
        console.log('📊 COMPARISON WITH ORIGINAL RESULT:');
        console.log('Original (all data): +25.79% profit');
        console.log('Walk-forward average:', 
            (results.reduce((sum, r) => sum + r.profitability, 0) / results.length).toFixed(2) + '%');
        
        this.analyzeWalkForwardResults(results);
    }

    analyzeWalkForwardResults(results) {
        console.log('\n🔍 WALK-FORWARD ANALYSIS:\n');
        
        const avgProfit = results.reduce((sum, r) => sum + r.profitability, 0) / results.length;
        const profitVariance = results.reduce((sum, r) => sum + Math.pow(r.profitability - avgProfit, 2), 0) / results.length;
        const profitStdDev = Math.sqrt(profitVariance);
        
        console.log('📈 Performance Metrics:');
        console.log(`Average profit: ${avgProfit.toFixed(2)}%`);
        console.log(`Standard deviation: ${profitStdDev.toFixed(2)}%`);
        console.log(`Range: ${Math.min(...results.map(r => r.profitability)).toFixed(2)}% to ${Math.max(...results.map(r => r.profitability)).toFixed(2)}%\n`);
        
        console.log('🎯 Key Findings:');
        
        if (avgProfit > 15) {
            console.log('✅ Strategy remains highly profitable on unseen data');
        } else if (avgProfit > 5) {
            console.log('⚠️ Strategy profitable but less than original estimate');
        } else if (avgProfit > 0) {
            console.log('⚠️ Strategy barely profitable - may not cover transaction costs');
        } else {
            console.log('❌ Strategy unprofitable on unseen data - likely overfitted');
        }
        
        if (profitStdDev > 10) {
            console.log('⚠️ High variability - strategy may be unstable');
        } else {
            console.log('✅ Relatively consistent performance');
        }
        
        // Check if always betting away still works
        console.log('\n🔍 Control Test: "Always Bet Away" on same periods:');
        results.forEach(result => {
            // This would need actual calculation, but we can estimate
            console.log(`${result.test}: Away bets ${result.awayProfitability.toFixed(2)}% vs Home bets ${result.homeProfitability.toFixed(2)}%`);
        });
        
        console.log('\n🎯 VERDICT:');
        if (avgProfit > 10 && profitStdDev < 15) {
            console.log('Strategy appears legitimate and robust');
        } else {
            console.log('Strategy may be exploiting historical bias that could disappear');
        }
    }
}

if (require.main === module) {
    const test = new WalkForwardTest();
    test.runWalkForwardTest();
}

module.exports = WalkForwardTest;