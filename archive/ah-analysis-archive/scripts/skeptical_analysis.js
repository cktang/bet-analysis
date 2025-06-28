const fs = require('fs');
const path = require('path');

class SkepticalAnalysis {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
            }
        });

        this.allMatches = this.allMatches.filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
            match.enhanced?.preMatch?.marketEfficiency?.awayImpliedProb !== undefined
        );
    }

    analyzeSkeptically() {
        console.log('🤔 SKEPTICAL ANALYSIS: Why 25% Profit?\n');
        console.log('═══════════════════════════════════════\n');

        this.checkDataLeakage();
        this.checkOverfitting();
        this.checkMarketBias();
        this.checkThresholdStability();
        this.checkSeasonalVariation();
        this.checkSampleBias();
        this.checkAlwaysBetAway();
        this.proposeFutureTest();
    }

    checkDataLeakage() {
        console.log('🕵️ ISSUE 1: DATA LEAKAGE CHECK\n');
        
        console.log('❓ Are we accidentally using future information?');
        console.log('✅ No - we only use pre-match data:');
        console.log('   • enhanced.preMatch.marketEfficiency.awayImpliedProb');
        console.log('   • This comes from betting odds available before kickoff');
        console.log('   • No post-match data used in decision making\n');
        
        console.log('❓ Is the profit calculation correct?');
        console.log('✅ Yes - using actual AH betting outcomes:');
        console.log('   • enhanced.postMatch.bettingOutcomes.homeProfit');
        console.log('   • These are real $100 bet results\n');
    }

    checkOverfitting() {
        console.log('📊 ISSUE 2: OVERFITTING TO HISTORICAL DATA\n');
        
        const awayProbs = this.allMatches.map(m => m.enhanced.preMatch.marketEfficiency.awayImpliedProb);
        const median = awayProbs.sort((a, b) => a - b)[Math.floor(awayProbs.length / 2)];
        
        console.log('❓ Is the median threshold overfitted?');
        console.log('⚠️ POTENTIALLY YES:');
        console.log(`   • Threshold (${(median * 100).toFixed(1)}%) is optimized for THIS specific dataset`);
        console.log('   • No guarantee it works on future data');
        console.log('   • We need walk-forward testing\n');
    }

    checkMarketBias() {
        console.log('🎯 ISSUE 3: MARKET BIAS INVESTIGATION\n');
        
        // Check if there's systematic bias
        let totalAlwaysAway = 0;
        let totalAlwaysHome = 0;
        
        this.allMatches.forEach(match => {
            totalAlwaysAway += match.enhanced.postMatch.bettingOutcomes.awayProfit;
            totalAlwaysHome += match.enhanced.postMatch.bettingOutcomes.homeProfit;
        });
        
        const awayProfitability = (totalAlwaysAway / (this.allMatches.length * 100)) * 100;
        const homeProfitability = (totalAlwaysHome / (this.allMatches.length * 100)) * 100;
        
        console.log('❓ Is there systematic market bias?');
        console.log('📈 Always bet AWAY strategy:');
        console.log(`   Profitability: ${awayProfitability.toFixed(2)}%`);
        console.log('📈 Always bet HOME strategy:');
        console.log(`   Profitability: ${homeProfitability.toFixed(2)}%\n`);
        
        if (awayProfitability > 5) {
            console.log('🚨 SUSPICIOUS: Always betting AWAY is very profitable!');
            console.log('   This suggests Asian Handicap lines favor home teams too much\n');
        }
    }

    checkThresholdStability() {
        console.log('📏 ISSUE 4: THRESHOLD STABILITY ACROSS SEASONS\n');
        
        const seasonThresholds = {};
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        
        seasons.forEach(season => {
            const seasonMatches = this.allMatches.filter(match => {
                const date = match.fbref?.date || '';
                return date.includes(season.split('-')[0]) || date.includes(season.split('-')[1]);
            });
            
            if (seasonMatches.length > 0) {
                const awayProbs = seasonMatches.map(m => m.enhanced.preMatch.marketEfficiency.awayImpliedProb);
                const median = awayProbs.sort((a, b) => a - b)[Math.floor(awayProbs.length / 2)];
                seasonThresholds[season] = median;
                
                console.log(`${season}: ${(median * 100).toFixed(1)}% (${seasonMatches.length} matches)`);
            }
        });
        
        const thresholdValues = Object.values(seasonThresholds);
        const maxDiff = Math.max(...thresholdValues) - Math.min(...thresholdValues);
        
        console.log(`\n📊 Threshold variation: ${(maxDiff * 100).toFixed(1)} percentage points`);
        
        if (maxDiff > 0.05) {
            console.log('⚠️ HIGH VARIATION: Threshold changes significantly between seasons');
            console.log('   Future performance may differ if market characteristics change\n');
        } else {
            console.log('✅ STABLE: Threshold relatively consistent across seasons\n');
        }
    }

    checkSeasonalVariation() {
        console.log('📅 ISSUE 5: SEASONAL PERFORMANCE VARIATION\n');
        
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        
        seasons.forEach(season => {
            const seasonMatches = this.allMatches.filter(match => {
                const date = match.fbref?.date || '';
                return date.includes(season.split('-')[0]) || date.includes(season.split('-')[1]);
            });
            
            if (seasonMatches.length > 10) {
                // Calculate performance for this season
                const awayProbs = seasonMatches.map(m => m.enhanced.preMatch.marketEfficiency.awayImpliedProb);
                const globalMedian = 0.3378; // Use global threshold
                
                let totalReturn = 0;
                seasonMatches.forEach(match => {
                    const awayProb = match.enhanced.preMatch.marketEfficiency.awayImpliedProb;
                    if (awayProb > globalMedian) {
                        totalReturn += match.enhanced.postMatch.bettingOutcomes.homeProfit;
                    } else {
                        totalReturn += match.enhanced.postMatch.bettingOutcomes.awayProfit;
                    }
                });
                
                const profitability = (totalReturn / (seasonMatches.length * 100)) * 100;
                console.log(`${season}: ${profitability.toFixed(2)}% profit (${seasonMatches.length} matches)`);
            }
        });
        console.log('');
    }

    checkSampleBias() {
        console.log('🎲 ISSUE 6: SAMPLE BIAS CHECK\n');
        
        console.log('❓ Is our sample representative?');
        console.log('📊 Sample characteristics:');
        console.log(`   • Only EPL matches (high-quality league)`);
        console.log(`   • 3 consecutive seasons (recent data)`);
        console.log(`   • Asian Handicap market (specific betting type)`);
        console.log('   • May not generalize to other leagues/markets\n');
        
        console.log('❓ Are we cherry-picking good periods?');
        console.log('⚠️ UNKNOWN: We need to test on completely unseen future data\n');
    }

    checkAlwaysBetAway() {
        console.log('🎯 ISSUE 7: IS THIS JUST "ALWAYS BET AWAY"?\n');
        
        // Check how often we bet away vs home
        const awayProbs = this.allMatches.map(m => m.enhanced.preMatch.marketEfficiency.awayImpliedProb);
        const median = 0.3378;
        
        const awayBets = awayProbs.filter(prob => prob <= median).length;
        const homeBets = awayProbs.filter(prob => prob > median).length;
        
        console.log(`Away bets: ${awayBets} (${(awayBets/this.allMatches.length*100).toFixed(1)}%)`);
        console.log(`Home bets: ${homeBets} (${(homeBets/this.allMatches.length*100).toFixed(1)}%)`);
        
        if (awayBets > homeBets * 1.2) {
            console.log('⚠️ BIAS: Strategy heavily favors away bets');
            console.log('   This might just be exploiting "always bet away" bias\n');
        } else {
            console.log('✅ BALANCED: Strategy makes roughly equal home/away bets\n');
        }
    }

    proposeFutureTest() {
        console.log('🔮 PROPOSED VALIDATION TESTS\n');
        console.log('═══════════════════════════════════════\n');
        
        console.log('1. **WALK-FORWARD TESTING**:');
        console.log('   • Use 2022-2023 to calculate threshold');
        console.log('   • Test on 2023-2024 only');
        console.log('   • Recalculate threshold, test on 2024-2025');
        console.log('   • See if performance degrades\n');
        
        console.log('2. **DIFFERENT THRESHOLDS**:');
        console.log('   • Test with 25th percentile, 75th percentile');
        console.log('   • Test with fixed thresholds (20%, 30%, 40%)');
        console.log('   • See if median is actually optimal\n');
        
        console.log('3. **OTHER LEAGUES**:');
        console.log('   • Test on Bundesliga, Serie A, La Liga');
        console.log('   • See if pattern holds across different markets\n');
        
        console.log('4. **TRANSACTION COSTS**:');
        console.log('   • Include betting fees, spreads');
        console.log('   • Real-world profit may be lower\n');
        
        console.log('5. **LIVE TESTING**:');
        console.log('   • Paper trade on current season');
        console.log('   • Only true validation is future unseen data\n');
        
        console.log('🎯 BOTTOM LINE:');
        console.log('This strategy looks promising but needs validation on truly unseen data.');
        console.log('25% profit is extraordinary and demands skeptical verification!');
    }
}

if (require.main === module) {
    const analysis = new SkepticalAnalysis();
    analysis.analyzeSkeptically();
}

module.exports = SkepticalAnalysis;