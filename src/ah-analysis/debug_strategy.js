const fs = require('fs');
const path = require('path');

class DebugStrategy {
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
            match.fbref?.homeXG !== undefined &&
            match.fbref?.awayXG !== undefined &&
            match.match?.asianHandicapOdds?.homeHandicap
        );
    }

    parseHandicap(handicapString) {
        if (!handicapString) return 0;
        // Extract first value from split handicaps like "+0.5/+1" or "-0.5/-1"
        if (handicapString.includes('/')) {
            return parseFloat(handicapString.split('/')[0]);
        }
        return parseFloat(handicapString);
    }

    debugTopStrategy() {
        console.log('🔍 DEBUGGING TOP STRATEGY: Handicap vs XG Difference\n');
        console.log('═══════════════════════════════════════════════════\n');

        const validMatches = this.allMatches.filter(match => {
            const homeHandicap = this.parseHandicap(match.match?.asianHandicapOdds?.homeHandicap);
            const xgDiff = match.fbref.homeXG - match.fbref.awayXG;
            return !isNaN(homeHandicap) && !isNaN(xgDiff);
        });

        console.log(`Valid matches for analysis: ${validMatches.length}\n`);

        // Calculate the factor for each match
        const matchData = validMatches.map(match => {
            const homeHandicap = this.parseHandicap(match.match.asianHandicapOdds.homeHandicap);
            const xgDiff = match.fbref.homeXG - match.fbref.awayXG;
            const combinedValue = homeHandicap + xgDiff; // This is what the strategy uses
            
            return {
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homeScore: match.match.homeScore,
                awayScore: match.match.awayScore,
                homeHandicap,
                xgDiff,
                combinedValue,
                homeProfit: match.enhanced.postMatch.bettingOutcomes.homeProfit,
                awayProfit: match.enhanced.postMatch.bettingOutcomes.awayProfit,
                homeOdds: match.match.asianHandicapOdds.homeOdds,
                awayOdds: match.match.asianHandicapOdds.awayOdds
            };
        });

        // Calculate median threshold
        const values = matchData.map(m => m.combinedValue);
        const sortedValues = [...values].sort((a, b) => a - b);
        const median = sortedValues[Math.floor(sortedValues.length / 2)];

        console.log(`Strategy threshold (median): ${median.toFixed(3)}\n`);

        console.log('📊 Sample decisions (first 15 matches):\n');
        
        let totalReturn = 0;
        let correctPicks = 0;
        let homeBets = 0;
        let awayBets = 0;

        matchData.slice(0, 15).forEach((match, i) => {
            const decision = match.combinedValue > median ? 'HOME' : 'AWAY';
            const profit = match.combinedValue > median ? match.homeProfit : match.awayProfit;
            const result = profit > 0 ? '✅ WIN' : profit === 0 ? '🔶 PUSH' : '❌ LOSS';
            
            console.log(`${i+1}. ${match.homeTeam} vs ${match.awayTeam}`);
            console.log(`   Score: ${match.homeScore}-${match.awayScore}`);
            console.log(`   Home handicap: ${match.homeHandicap}`);
            console.log(`   XG difference: ${match.xgDiff.toFixed(2)} (Home XG - Away XG)`);
            console.log(`   Combined value: ${match.combinedValue.toFixed(3)}`);
            console.log(`   Decision: ${match.combinedValue.toFixed(3)} ${match.combinedValue > median ? '>' : '≤'} ${median.toFixed(3)} → BET ${decision}`);
            console.log(`   Result: ${result} $${profit} profit`);
            console.log(`   Available odds: Home ${match.homeOdds}, Away ${match.awayOdds}\n`);
        });

        // Calculate full strategy performance
        matchData.forEach(match => {
            if (match.combinedValue > median) {
                homeBets++;
                totalReturn += match.homeProfit;
                if (match.homeProfit > 0) correctPicks++;
            } else {
                awayBets++;
                totalReturn += match.awayProfit;
                if (match.awayProfit > 0) correctPicks++;
            }
        });

        const totalBets = matchData.length;
        const totalInvestment = totalBets * 100;
        const profitability = (totalReturn / totalInvestment) * 100;
        const accuracy = (correctPicks / totalBets) * 100;

        console.log('📊 STRATEGY PERFORMANCE:\n');
        console.log(`Total matches: ${totalBets}`);
        console.log(`Total investment: $${totalInvestment.toLocaleString()}`);
        console.log(`Total return: $${totalReturn.toLocaleString()}`);
        console.log(`Net profit: $${totalReturn.toLocaleString()} (already net)`);
        console.log(`Profitability: ${profitability.toFixed(2)}%`);
        console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
        console.log(`Home bets: ${homeBets} (${(homeBets/totalBets*100).toFixed(1)}%)`);
        console.log(`Away bets: ${awayBets} (${(awayBets/totalBets*100).toFixed(1)}%)\n`);

        // Check if this makes sense
        console.log('🤔 STRATEGY LOGIC ANALYSIS:\n');
        console.log('The strategy combines:');
        console.log('• Asian Handicap line (negative = home favored, positive = away favored)');
        console.log('• Expected Goals difference (positive = home expected to outscore away)');
        console.log('• Bets HOME when combined value > median, AWAY when ≤ median\n');

        if (profitability > 10) {
            console.log('🚨 SUSPICIOUSLY HIGH PROFITABILITY!');
            console.log('This level of edge would be noticed and corrected by bookmakers.');
            console.log('Possible issues:');
            console.log('• Data quality problems still present');
            console.log('• Strategy is overfitting to historical data');
            console.log('• Hindsight bias in XG data');
            console.log('• Missing transaction costs/margins\n');
        }

        // Sanity check: Always bet home vs always bet away
        let alwaysHomeProfit = 0;
        let alwaysAwayProfit = 0;
        
        matchData.forEach(match => {
            alwaysHomeProfit += match.homeProfit;
            alwaysAwayProfit += match.awayProfit;
        });

        console.log('🔍 SANITY CHECK:');
        console.log(`Always bet HOME: ${((alwaysHomeProfit / totalInvestment) * 100).toFixed(2)}%`);
        console.log(`Always bet AWAY: ${((alwaysAwayProfit / totalInvestment) * 100).toFixed(2)}%`);
        
        if (Math.abs(alwaysHomeProfit / totalInvestment) > 0.05 || Math.abs(alwaysAwayProfit / totalInvestment) > 0.05) {
            console.log('⚠️ Systematic bias still present in data');
        } else {
            console.log('✅ No obvious systematic bias');
        }
    }
}

if (require.main === module) {
    const strategyDebugger = new DebugStrategy();
    strategyDebugger.debugTopStrategy();
}

module.exports = DebugStrategy;