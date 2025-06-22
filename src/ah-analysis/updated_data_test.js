const fs = require('fs');
const path = require('path');

class UpdatedDataTest {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadUpdatedData();
    }

    loadUpdatedData() {
        console.log('📊 Loading UPDATED data structure...\n');
        
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
                console.log(`✅ ${season}: ${matches.length} matches loaded`);
            }
        });

        console.log(`📊 Total: ${this.allMatches.length} matches\n`);
    }

    examineDataStructure() {
        console.log('🔍 EXAMINING UPDATED DATA STRUCTURE\n');
        console.log('═══════════════════════════════════════\n');

        const sampleMatch = this.allMatches[0];
        
        console.log('📋 Sample Match Structure:');
        console.log(`Match: ${sampleMatch.match?.homeTeam} vs ${sampleMatch.match?.awayTeam}`);
        console.log(`Score: ${sampleMatch.match?.homeScore}-${sampleMatch.match?.awayScore}\n`);

        console.log('📊 Enhanced Structure:');
        if (sampleMatch.enhanced) {
            console.log('  ✅ enhanced section exists');
            console.log('  PreMatch keys:', Object.keys(sampleMatch.enhanced.preMatch || {}));
            console.log('  PostMatch keys:', Object.keys(sampleMatch.enhanced.postMatch || {}));
            console.log('');
        }

        console.log('🎯 Asian Handicap Data Paths:');
        
        // Check preMatch AH odds
        const preMatchAH = sampleMatch.enhanced?.preMatch?.asianHandicapOdds;
        if (preMatchAH) {
            console.log('  ✅ enhanced.preMatch.asianHandicapOdds:');
            console.log(`    homeHandicap: ${preMatchAH.homeHandicap}`);
            console.log(`    homeOdds: ${preMatchAH.homeOdds}`);
            console.log(`    awayHandicap: ${preMatchAH.awayHandicap}`);
            console.log(`    awayOdds: ${preMatchAH.awayOdds}`);
        }

        // Check postMatch betting outcomes
        const bettingOutcomes = sampleMatch.enhanced?.postMatch?.bettingOutcomes;
        if (bettingOutcomes) {
            console.log('  ✅ enhanced.postMatch.bettingOutcomes:');
            console.log(`    homeResult: ${bettingOutcomes.homeResult}`);
            console.log(`    awayResult: ${bettingOutcomes.awayResult}`);
            console.log(`    homeProfit: ${bettingOutcomes.homeProfit}`);
            console.log(`    awayProfit: ${bettingOutcomes.awayProfit}`);
            console.log(`    homeBet100Return: ${bettingOutcomes.homeBet100Return}`);
            console.log(`    awayBet100Return: ${bettingOutcomes.awayBet100Return}`);
        }

        // Check market efficiency
        const marketEff = sampleMatch.enhanced?.preMatch?.marketEfficiency;
        if (marketEff) {
            console.log('  ✅ enhanced.preMatch.marketEfficiency:');
            console.log(`    homeImpliedProb: ${marketEff.homeImpliedProb}`);
            console.log(`    awayImpliedProb: ${marketEff.awayImpliedProb}`);
            console.log(`    drawImpliedProb: ${marketEff.drawImpliedProb}`);
        }

        console.log('');
    }

    testUpdatedAwayImpliedProbStrategy() {
        console.log('🎯 TESTING UPDATED AWAY IMPLIED PROBABILITY STRATEGY\n');
        console.log('═══════════════════════════════════════════════════\n');

        // Filter matches with complete data using new structure
        const validMatches = this.allMatches.filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
            match.enhanced?.preMatch?.marketEfficiency?.awayImpliedProb !== undefined &&
            match.fbref?.homeXG !== undefined &&
            match.fbref?.awayXG !== undefined
        );

        console.log(`📊 Valid matches with complete data: ${validMatches.length}/${this.allMatches.length}\n`);

        if (validMatches.length === 0) {
            console.log('❌ No valid matches found - check data structure');
            return;
        }

        // Extract away implied probabilities
        const awayImpliedProbs = validMatches.map(match => 
            match.enhanced.preMatch.marketEfficiency.awayImpliedProb
        );

        // Calculate median threshold
        const sortedProbs = [...awayImpliedProbs].sort((a, b) => a - b);
        const threshold = sortedProbs[Math.floor(sortedProbs.length / 2)];

        console.log(`🎯 Strategy threshold (median): ${(threshold * 100).toFixed(2)}%\n`);

        // Test strategy
        let totalReturn = 0;
        let totalInvestment = validMatches.length * 100;
        let correctPicks = 0;
        let homeBets = 0;
        let awayBets = 0;
        let homeReturn = 0;
        let awayReturn = 0;

        console.log('📋 Sample decision logic (first 10 matches):\n');

        validMatches.slice(0, 10).forEach((match, i) => {
            const awayProb = match.enhanced.preMatch.marketEfficiency.awayImpliedProb;
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            
            let betChoice, profit;
            if (awayProb > threshold) {
                betChoice = 'HOME';
                profit = homeProfit;
                homeBets++;
                homeReturn += profit;
            } else {
                betChoice = 'AWAY';
                profit = awayProfit;
                awayBets++;
                awayReturn += profit;
            }
            
            totalReturn += profit;
            if (profit > 0) correctPicks++;

            console.log(`${i+1}. ${match.match.homeTeam} vs ${match.match.awayTeam}`);
            console.log(`   Score: ${match.match.homeScore}-${match.match.awayScore}`);
            console.log(`   Away prob: ${(awayProb * 100).toFixed(1)}% | Threshold: ${(threshold * 100).toFixed(1)}%`);
            console.log(`   Decision: ${awayProb > threshold ? `${(awayProb * 100).toFixed(1)}% > ${(threshold * 100).toFixed(1)}% → BET HOME` : `${(awayProb * 100).toFixed(1)}% ≤ ${(threshold * 100).toFixed(1)}% → BET AWAY`}`);
            console.log(`   Result: ${profit > 0 ? '✅' : '❌'} $${profit} profit\n`);
        });

        // Apply strategy to all matches
        validMatches.forEach(match => {
            const awayProb = match.enhanced.preMatch.marketEfficiency.awayImpliedProb;
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            
            let profit;
            if (awayProb > threshold) {
                profit = homeProfit;
                if (homeReturn === 0 && awayReturn === 0) homeBets++; // Only count once in the slice above
            } else {
                profit = awayProfit;
                if (homeReturn === 0 && awayReturn === 0) awayBets++; // Only count once in the slice above
            }
        });

        // Recalculate full stats
        homeBets = 0;
        awayBets = 0;
        homeReturn = 0;
        awayReturn = 0;
        totalReturn = 0;
        correctPicks = 0;

        validMatches.forEach(match => {
            const awayProb = match.enhanced.preMatch.marketEfficiency.awayImpliedProb;
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            
            let profit;
            if (awayProb > threshold) {
                homeBets++;
                profit = homeProfit;
                homeReturn += profit;
            } else {
                awayBets++;
                profit = awayProfit;
                awayReturn += profit;
            }
            
            totalReturn += profit;
            if (profit > 0) correctPicks++;
        });

        // Calculate performance metrics
        const profitability = (totalReturn / totalInvestment) * 100;
        const accuracy = (correctPicks / validMatches.length) * 100;
        const homeProfitability = homeBets > 0 ? (homeReturn / (homeBets * 100)) * 100 : 0;
        const awayProfitability = awayBets > 0 ? (awayReturn / (awayBets * 100)) * 100 : 0;

        console.log('📊 UPDATED STRATEGY RESULTS:\n');
        console.log('═══════════════════════════════════════\n');
        
        console.log('💰 FINANCIAL PERFORMANCE:');
        console.log(`Total matches: ${validMatches.length.toLocaleString()}`);
        console.log(`Total investment: $${totalInvestment.toLocaleString()}`);
        console.log(`Total return: $${totalReturn.toLocaleString()}`);
        console.log(`Net profit: $${(totalReturn - totalInvestment).toLocaleString()}`);
        console.log(`Profitability: ${profitability.toFixed(2)}%`);
        console.log(`Average profit per bet: $${(totalReturn / validMatches.length).toFixed(2)}\n`);
        
        console.log('🎲 BETTING BREAKDOWN:');
        console.log(`Overall accuracy: ${accuracy.toFixed(1)}%`);
        console.log(`HOME bets: ${homeBets} (${(homeBets/validMatches.length*100).toFixed(1)}%)`);
        console.log(`HOME profitability: ${homeProfitability.toFixed(2)}%`);
        console.log(`AWAY bets: ${awayBets} (${(awayBets/validMatches.length*100).toFixed(1)}%)`);
        console.log(`AWAY profitability: ${awayProfitability.toFixed(2)}%\n`);

        // Check for sanity
        console.log('🔍 SANITY CHECKS:\n');
        console.log(`Always bet HOME: ${(homeReturn / (validMatches.length * 100) * 100).toFixed(2)}%`);
        console.log(`Always bet AWAY: ${(awayReturn / (validMatches.length * 100) * 100).toFixed(2)}%`);
        
        // Quick data integrity check
        let bothPositive = 0;
        let bothNegative = 0;
        validMatches.slice(0, 50).forEach(match => {
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            
            if (homeProfit > 0 && awayProfit > 0) bothPositive++;
            if (homeProfit < 0 && awayProfit < 0) bothNegative++;
        });
        
        console.log(`\nData integrity (first 50 matches):`);
        console.log(`Both bets positive (impossible): ${bothPositive}/50`);
        console.log(`Both bets negative (impossible): ${bothNegative}/50`);
        
        if (bothPositive > 0 || bothNegative > 0) {
            console.log('⚠️ Data quality issues still present');
        } else {
            console.log('✅ Data appears consistent');
        }
    }
}

if (require.main === module) {
    const tester = new UpdatedDataTest();
    tester.examineDataStructure();
    tester.testUpdatedAwayImpliedProbStrategy();
}

module.exports = UpdatedDataTest;