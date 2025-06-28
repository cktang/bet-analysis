const fs = require('fs');
const path = require('path');

class DataValidation {
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

    validateAlwaysBetAway() {
        console.log('🔍 VALIDATION 1: Does "Always Bet Away" Really Win?\n');
        console.log('═══════════════════════════════════════\n');

        let totalAwayReturn = 0;
        let totalHomeReturn = 0;
        let awayWins = 0;
        let homeWins = 0;
        let awayPushes = 0;
        let homePushes = 0;
        
        console.log('Sample of first 10 matches:\n');
        
        this.allMatches.slice(0, 10).forEach((match, i) => {
            const homeTeam = match.match?.homeTeam || 'Unknown';
            const awayTeam = match.match?.awayTeam || 'Unknown';
            const homeScore = match.match?.homeScore || 0;
            const awayScore = match.match?.awayScore || 0;
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            const homeHandicap = match.match?.asianHandicapOdds?.homeHandicap || 'Unknown';
            const awayHandicap = match.match?.asianHandicapOdds?.awayHandicap || 'Unknown';
            
            console.log(`${i+1}. ${homeTeam} vs ${awayTeam}`);
            console.log(`   Score: ${homeScore}-${awayScore}`);
            console.log(`   AH Line: Home ${homeHandicap}, Away ${awayHandicap}`);
            console.log(`   AH Results: Home $${homeProfit}, Away $${awayProfit}`);
            
            // Determine outcomes
            let homeOutcome = 'Loss';
            let awayOutcome = 'Loss';
            if (homeProfit > 0) homeOutcome = 'Win';
            else if (homeProfit === 0) homeOutcome = 'Push';
            if (awayProfit > 0) awayOutcome = 'Win';
            else if (awayProfit === 0) awayOutcome = 'Push';
            
            console.log(`   Outcomes: Home ${homeOutcome}, Away ${awayOutcome}\n`);
        });

        // Calculate overall statistics
        this.allMatches.forEach(match => {
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            
            totalHomeReturn += homeProfit;
            totalAwayReturn += awayProfit;
            
            if (homeProfit > 0) homeWins++;
            else if (homeProfit === 0) homePushes++;
            
            if (awayProfit > 0) awayWins++;
            else if (awayProfit === 0) awayPushes++;
        });

        const totalMatches = this.allMatches.length;
        const homeInvestment = totalMatches * 100;
        const awayInvestment = totalMatches * 100;
        
        console.log('📊 ALWAYS BET AWAY vs ALWAYS BET HOME:\n');
        console.log(`Total matches: ${totalMatches}`);
        console.log(`Investment per strategy: $${homeInvestment.toLocaleString()}\n`);
        
        console.log('🏠 ALWAYS BET HOME:');
        console.log(`Total return: $${totalHomeReturn.toLocaleString()}`);
        console.log(`Net profit: $${(totalHomeReturn - homeInvestment).toLocaleString()}`);
        console.log(`Profitability: ${((totalHomeReturn / homeInvestment) * 100 - 100).toFixed(2)}%`);
        console.log(`Wins: ${homeWins}/${totalMatches} (${(homeWins/totalMatches*100).toFixed(1)}%)`);
        console.log(`Pushes: ${homePushes}/${totalMatches} (${(homePushes/totalMatches*100).toFixed(1)}%)\n`);
        
        console.log('✈️ ALWAYS BET AWAY:');
        console.log(`Total return: $${totalAwayReturn.toLocaleString()}`);
        console.log(`Net profit: $${(totalAwayReturn - awayInvestment).toLocaleString()}`);
        console.log(`Profitability: ${((totalAwayReturn / awayInvestment) * 100 - 100).toFixed(2)}%`);
        console.log(`Wins: ${awayWins}/${totalMatches} (${(awayWins/totalMatches*100).toFixed(1)}%)`);
        console.log(`Pushes: ${awayPushes}/${totalMatches} (${(awayPushes/totalMatches*100).toFixed(1)}%)\n`);
        
        if ((totalAwayReturn / awayInvestment) * 100 - 100 > 5) {
            console.log('🚨 CONFIRMED: Always betting away is highly profitable!');
            console.log('This suggests systematic bias in AH line setting.\n');
        } else {
            console.log('✅ No systematic bias - away betting not universally profitable.\n');
        }
    }

    analyzeHADvsAH() {
        console.log('🔍 VALIDATION 2: HAD vs Asian Handicap Logic Mismatch\n');
        console.log('═══════════════════════════════════════\n');

        console.log('🤔 The Issue:');
        console.log('• Strategy uses HAD implied probabilities (Home/Away/Draw)');
        console.log('• But applies decisions to Asian Handicap outcomes (no draw)');
        console.log('• These are different betting markets with different logic!\n');

        let contradictions = 0;
        let strongFavoriteWinButLoseAH = 0;
        let underdogLoseButWinAH = 0;
        
        console.log('Sample contradictions:\n');
        
        this.allMatches.slice(0, 50).forEach((match, i) => {
            const homeTeam = match.match?.homeTeam || 'Unknown';
            const awayTeam = match.match?.awayTeam || 'Unknown';
            const homeScore = match.match?.homeScore || 0;
            const awayScore = match.match?.awayScore || 0;
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            const homeHandicap = match.match?.asianHandicapOdds?.homeHandicap || 'Unknown';
            const awayImpliedProb = match.enhanced?.preMatch?.marketEfficiency?.awayImpliedProb || 0;
            
            // Check if team won match but lost AH bet, or lost match but won AH bet
            const homeWonMatch = homeScore > awayScore;
            const awayWonMatch = awayScore > homeScore;
            const draw = homeScore === awayScore;
            const homeWonAH = homeProfit > 0;
            const awayWonAH = awayProfit > 0;
            
            let isContradiction = false;
            let contradictionType = '';
            
            // Strong favorite (low away probability) wins match but loses AH
            if (awayImpliedProb < 0.2 && homeWonMatch && !homeWonAH) {
                strongFavoriteWinButLoseAH++;
                isContradiction = true;
                contradictionType = 'Strong home favorite won match but lost AH';
            }
            
            // Strong away favorite wins match but loses AH  
            if (awayImpliedProb > 0.8 && awayWonMatch && !awayWonAH) {
                isContradiction = true;
                contradictionType = 'Strong away favorite won match but lost AH';
            }
            
            // Underdog loses match but wins AH
            if (awayImpliedProb < 0.3 && !awayWonMatch && awayWonAH) {
                underdogLoseButWinAH++;
                isContradiction = true;
                contradictionType = 'Away underdog lost match but won AH';
            }
            
            if (isContradiction && contradictions < 10) {
                console.log(`${contradictions + 1}. ${homeTeam} vs ${awayTeam}`);
                console.log(`   Score: ${homeScore}-${awayScore} | AH Line: ${homeHandicap}`);
                console.log(`   Away probability: ${(awayImpliedProb * 100).toFixed(1)}%`);
                console.log(`   AH Results: Home $${homeProfit}, Away $${awayProfit}`);
                console.log(`   Issue: ${contradictionType}\n`);
                contradictions++;
            }
        });

        console.log('📊 CONTRADICTION ANALYSIS:\n');
        console.log(`Strong favorites won match but lost AH: ${strongFavoriteWinButLoseAH} cases`);
        console.log(`Underdogs lost match but won AH: ${underdogLoseButWinAH} cases`);
        console.log(`Total contradictory cases: ${strongFavoriteWinButLoseAH + underdogLoseButWinAH}\n`);
        
        const contradictionRate = (strongFavoriteWinButLoseAH + underdogLoseButWinAH) / this.allMatches.length;
        console.log(`Contradiction rate: ${(contradictionRate * 100).toFixed(1)}%\n`);
        
        if (contradictionRate > 0.1) {
            console.log('🚨 HIGH CONTRADICTION RATE!');
            console.log('HAD probabilities may not be suitable for AH betting decisions.');
            console.log('The markets have different risk/reward profiles.\n');
        } else {
            console.log('✅ Low contradiction rate - strategy logic appears valid.\n');
        }
    }

    analyzeAHLines() {
        console.log('🔍 VALIDATION 3: Asian Handicap Line Analysis\n');
        console.log('═══════════════════════════════════════\n');

        const lineDistribution = {};
        let totalLines = 0;
        
        console.log('Sample AH lines from first 20 matches:\n');
        
        this.allMatches.slice(0, 20).forEach((match, i) => {
            const homeTeam = match.match?.homeTeam || 'Unknown';
            const awayTeam = match.match?.awayTeam || 'Unknown';
            const homeHandicap = match.match?.asianHandicapOdds?.homeHandicap || 'Unknown';
            const awayHandicap = match.match?.asianHandicapOdds?.awayHandicap || 'Unknown';
            const homeScore = match.match?.homeScore || 0;
            const awayScore = match.match?.awayScore || 0;
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            
            console.log(`${i+1}. ${homeTeam} vs ${awayTeam}`);
            console.log(`   AH Lines: Home ${homeHandicap} vs Away ${awayHandicap}`);
            console.log(`   Score: ${homeScore}-${awayScore}`);
            console.log(`   AH Outcomes: Home $${homeProfit}, Away $${awayProfit}\n`);
        });

        // Analyze line distribution
        this.allMatches.forEach(match => {
            const homeHandicap = match.match?.asianHandicapOdds?.homeHandicap;
            if (homeHandicap) {
                lineDistribution[homeHandicap] = (lineDistribution[homeHandicap] || 0) + 1;
                totalLines++;
            }
        });

        console.log('📊 ASIAN HANDICAP LINE DISTRIBUTION:\n');
        const sortedLines = Object.entries(lineDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
        sortedLines.forEach(([line, count]) => {
            const percentage = (count / totalLines * 100).toFixed(1);
            console.log(`${line}: ${count} matches (${percentage}%)`);
        });
        
        console.log('\n🔍 Key Observations:');
        console.log('• Most common lines show the typical handicap spread');
        console.log('• Lines range from heavy favorites to close matches');
        console.log('• AH eliminates draw through handicap system');
        console.log('• Each line has specific risk/reward profile\n');
        
        return lineDistribution;
    }

    checkDataIntegrity() {
        console.log('🔍 VALIDATION 4: Data Integrity Check\n');
        console.log('═══════════════════════════════════════\n');

        let inconsistencies = 0;
        let bothZeroProfit = 0;
        let bothPositiveProfit = 0;
        let invalidProfits = 0;
        
        console.log('Checking for data anomalies...\n');
        
        this.allMatches.forEach((match, i) => {
            const homeProfit = match.enhanced.postMatch.bettingOutcomes.homeProfit;
            const awayProfit = match.enhanced.postMatch.bettingOutcomes.awayProfit;
            
            // Check for impossible scenarios
            if (homeProfit > 0 && awayProfit > 0) {
                bothPositiveProfit++;
                if (bothPositiveProfit <= 5) {
                    console.log(`⚠️ Both positive: ${match.match?.homeTeam} vs ${match.match?.awayTeam}`);
                    console.log(`   Home: $${homeProfit}, Away: $${awayProfit}\n`);
                }
            }
            
            if (homeProfit === 0 && awayProfit === 0) {
                bothZeroProfit++;
            }
            
            if (!Number.isFinite(homeProfit) || !Number.isFinite(awayProfit)) {
                invalidProfits++;
            }
        });

        console.log('📊 DATA INTEGRITY RESULTS:\n');
        console.log(`Total matches analyzed: ${this.allMatches.length}`);
        console.log(`Both bets positive (impossible): ${bothPositiveProfit}`);
        console.log(`Both bets zero (pushes): ${bothZeroProfit}`);
        console.log(`Invalid profit values: ${invalidProfits}\n`);
        
        if (bothPositiveProfit > 0) {
            console.log('🚨 DATA ISSUE: Found matches where both AH bets are profitable!');
            console.log('This is impossible - suggests data error or misinterpretation.\n');
        } else {
            console.log('✅ No impossible profit scenarios found.\n');
        }
    }
}

if (require.main === module) {
    const validator = new DataValidation();
    validator.validateAlwaysBetAway();
    validator.analyzeHADvsAH();
    validator.analyzeAHLines();
    validator.checkDataIntegrity();
}

module.exports = DataValidation;