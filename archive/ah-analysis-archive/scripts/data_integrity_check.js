const fs = require('fs');
const path = require('path');

class DataIntegrityCheck {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('📊 Loading data for integrity verification...\n');
        
        const seasonPath = path.join(this.dataPath, 'year-2023-2024.json');
        const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
        this.allMatches = Object.values(seasonData.matches).filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
            match.match?.asianHandicapOdds
        ).slice(0, 20); // Focus on first 20 for detailed analysis
        
        console.log(`Examining ${this.allMatches.length} matches in detail...\n`);
    }

    parseHandicap(handicapString) {
        // Parse handicaps like "0/-0.5", "-1/-1.5", "+1", etc.
        if (!handicapString) return null;
        
        if (handicapString.includes('/')) {
            // Split handicap like "0/-0.5" or "-1/-1.5"
            const parts = handicapString.split('/');
            const val1 = parseFloat(parts[0]);
            const val2 = parseFloat(parts[1]);
            return { isSplit: true, val1, val2 };
        } else {
            // Single handicap like "+1" or "-0.5"
            return { isSplit: false, val: parseFloat(handicapString) };
        }
    }

    calculateExpectedProfit(homeScore, awayScore, homeHandicap, homeOdds, awayHandicap, awayOdds, betAmount = 100) {
        const homeHcp = this.parseHandicap(homeHandicap);
        const awayHcp = this.parseHandicap(awayHandicap);
        
        if (!homeHcp || !awayHcp) return null;
        
        // Calculate adjusted scores
        const adjustedHomeScore = homeScore;
        const adjustedAwayScore = awayScore;
        
        let homeResult, awayResult;
        
        if (homeHcp.isSplit) {
            // Split handicap - bet is split between two handicaps
            const homeAdj1 = adjustedHomeScore + homeHcp.val1;
            const awayAdj1 = adjustedAwayScore;
            const homeAdj2 = adjustedHomeScore + homeHcp.val2;
            const awayAdj2 = adjustedAwayScore;
            
            // Check outcomes for both parts
            const outcome1 = this.getOutcome(homeAdj1, awayAdj1);
            const outcome2 = this.getOutcome(homeAdj2, awayAdj2);
            
            homeResult = this.combineSplitResults(outcome1, outcome2, 'home');
            awayResult = this.combineSplitResults(outcome1, outcome2, 'away');
        } else {
            // Single handicap
            const homeAdj = adjustedHomeScore + homeHcp.val;
            const awayAdj = adjustedAwayScore;
            
            const outcome = this.getOutcome(homeAdj, awayAdj);
            homeResult = outcome === 'home' ? 'win' : outcome === 'away' ? 'loss' : 'push';
            awayResult = outcome === 'away' ? 'win' : outcome === 'home' ? 'loss' : 'push';
        }
        
        // Calculate profits
        const homeProfit = this.calculateProfit(homeResult, homeOdds, betAmount);
        const awayProfit = this.calculateProfit(awayResult, awayOdds, betAmount);
        
        return { homeResult, awayResult, homeProfit, awayProfit };
    }
    
    getOutcome(homeScore, awayScore) {
        if (homeScore > awayScore) return 'home';
        if (awayScore > homeScore) return 'away';
        return 'draw';
    }
    
    combineSplitResults(outcome1, outcome2, side) {
        // For split handicaps, combine two outcomes
        const wins = [outcome1, outcome2].filter(o => o === side).length;
        const draws = [outcome1, outcome2].filter(o => o === 'draw').length;
        
        if (wins === 2) return 'win';
        if (wins === 1 && draws === 1) return 'half-win';
        if (draws === 2) return 'push';
        if (wins === 1 && draws === 0) return 'half-win';
        if (wins === 0 && draws === 1) return 'half-loss';
        return 'loss';
    }
    
    calculateProfit(result, odds, betAmount) {
        switch (result) {
            case 'win':
                return (odds - 1) * betAmount;
            case 'half-win':
                return ((odds - 1) * betAmount) / 2;
            case 'push':
                return 0;
            case 'half-loss':
                return -betAmount / 2;
            case 'loss':
                return -betAmount;
            default:
                return 0;
        }
    }

    verifyDataIntegrity() {
        console.log('🔍 VERIFYING DATA INTEGRITY: Manual Calculation vs Stored Values\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        let discrepancies = 0;
        let totalChecked = 0;
        let majorErrors = 0;

        this.allMatches.forEach((match, index) => {
            const homeTeam = match.match?.homeTeam || 'Unknown';
            const awayTeam = match.match?.awayTeam || 'Unknown';
            const homeScore = match.match?.homeScore || 0;
            const awayScore = match.match?.awayScore || 0;
            
            const homeHandicap = match.match?.asianHandicapOdds?.homeHandicap;
            const awayHandicap = match.match?.asianHandicapOdds?.awayHandicap;
            const homeOdds = match.match?.asianHandicapOdds?.homeOdds || 0;
            const awayOdds = match.match?.asianHandicapOdds?.awayOdds || 0;
            
            const storedHomeProfit = match.enhanced?.postMatch?.bettingOutcomes?.homeProfit;
            const storedAwayProfit = match.enhanced?.postMatch?.bettingOutcomes?.awayProfit;
            
            console.log(`${index + 1}. ${homeTeam} vs ${awayTeam}`);
            console.log(`   Score: ${homeScore}-${awayScore}`);
            console.log(`   AH Lines: Home ${homeHandicap} (${homeOdds}), Away ${awayHandicap} (${awayOdds})`);
            console.log(`   Stored Profits: Home $${storedHomeProfit}, Away $${storedAwayProfit}`);
            
            // Calculate what the profits SHOULD be
            const calculated = this.calculateExpectedProfit(
                homeScore, awayScore, 
                homeHandicap, homeOdds, 
                awayHandicap, awayOdds
            );
            
            if (calculated) {
                console.log(`   Calculated: Home $${calculated.homeProfit}, Away $${calculated.awayProfit}`);
                console.log(`   Results: Home ${calculated.homeResult}, Away ${calculated.awayResult}`);
                
                // Check for discrepancies
                const homeDiff = Math.abs(calculated.homeProfit - storedHomeProfit);
                const awayDiff = Math.abs(calculated.awayProfit - storedAwayProfit);
                
                if (homeDiff > 1 || awayDiff > 1) {
                    discrepancies++;
                    console.log(`   🚨 DISCREPANCY! Home diff: ${homeDiff.toFixed(2)}, Away diff: ${awayDiff.toFixed(2)}`);
                    
                    if (homeDiff > 10 || awayDiff > 10) {
                        majorErrors++;
                        console.log(`   ❌ MAJOR ERROR!`);
                    }
                } else {
                    console.log(`   ✅ Values match (within $1 tolerance)`);
                }
                
                totalChecked++;
            } else {
                console.log(`   ❓ Could not calculate expected profit`);
            }
            
            console.log('');
        });

        console.log('📊 INTEGRITY CHECK SUMMARY:\n');
        console.log(`Total matches checked: ${totalChecked}`);
        console.log(`Discrepancies found: ${discrepancies}`);
        console.log(`Major errors (>$10 diff): ${majorErrors}`);
        console.log(`Accuracy rate: ${((totalChecked - discrepancies) / totalChecked * 100).toFixed(1)}%\n`);
        
        if (discrepancies > totalChecked * 0.1) {
            console.log('🚨 HIGH ERROR RATE: Data processing may have systematic issues');
        } else if (discrepancies > 0) {
            console.log('⚠️ Some discrepancies found - investigate data processing logic');
        } else {
            console.log('✅ Data appears accurate');
        }
    }

    checkSystematicBias() {
        console.log('\n🔍 CHECKING FOR SYSTEMATIC BIAS IN ODDS:\n');
        console.log('═══════════════════════════════════════\n');

        let totalHomeOdds = 0;
        let totalAwayOdds = 0;
        let validOdds = 0;
        let homeAdvantageCount = 0;
        let awayAdvantageCount = 0;
        let evenCount = 0;

        this.allMatches.forEach(match => {
            const homeOdds = match.match?.asianHandicapOdds?.homeOdds;
            const awayOdds = match.match?.asianHandicapOdds?.awayOdds;
            
            if (homeOdds && awayOdds) {
                totalHomeOdds += homeOdds;
                totalAwayOdds += awayOdds;
                validOdds++;
                
                if (homeOdds < awayOdds) {
                    homeAdvantageCount++;
                } else if (awayOdds < homeOdds) {
                    awayAdvantageCount++;
                } else {
                    evenCount++;
                }
            }
        });

        console.log('📊 ODDS DISTRIBUTION:');
        console.log(`Average home odds: ${(totalHomeOdds / validOdds).toFixed(3)}`);
        console.log(`Average away odds: ${(totalAwayOdds / validOdds).toFixed(3)}`);
        console.log(`Home favored: ${homeAdvantageCount}/${validOdds} (${(homeAdvantageCount/validOdds*100).toFixed(1)}%)`);
        console.log(`Away favored: ${awayAdvantageCount}/${validOdds} (${(awayAdvantageCount/validOdds*100).toFixed(1)}%)`);
        console.log(`Even odds: ${evenCount}/${validOdds} (${(evenCount/validOdds*100).toFixed(1)}%)\n`);

        // Check if there's expected balance
        const expectedBalance = Math.abs(homeAdvantageCount - awayAdvantageCount) / validOdds;
        if (expectedBalance > 0.2) {
            console.log('⚠️ Significant imbalance in who is favored');
        } else {
            console.log('✅ Reasonable balance in favorites');
        }
    }

    checkRealWorldSanity() {
        console.log('\n🌍 REAL-WORLD SANITY CHECK:\n');
        console.log('═══════════════════════════════════════\n');

        let impossibleResults = 0;
        let suspiciousOdds = 0;
        
        this.allMatches.forEach((match, index) => {
            const homeOdds = match.match?.asianHandicapOdds?.homeOdds || 0;
            const awayOdds = match.match?.asianHandicapOdds?.awayOdds || 0;
            const homeProfit = match.enhanced?.postMatch?.bettingOutcomes?.homeProfit || 0;
            const awayProfit = match.enhanced?.postMatch?.bettingOutcomes?.awayProfit || 0;
            
            // Check for impossible odds (too low or too high)
            if (homeOdds < 1.01 || homeOdds > 50 || awayOdds < 1.01 || awayOdds > 50) {
                suspiciousOdds++;
                console.log(`⚠️ Suspicious odds: ${match.match?.homeTeam} vs ${match.match?.awayTeam}`);
                console.log(`   Odds: ${homeOdds} / ${awayOdds}`);
            }
            
            // Check for impossible profit scenarios
            if ((homeProfit > 0 && awayProfit > 0) || 
                (homeProfit < -100 || awayProfit < -100) ||
                (homeProfit > homeOdds * 100 || awayProfit > awayOdds * 100)) {
                impossibleResults++;
                console.log(`❌ Impossible result: ${match.match?.homeTeam} vs ${match.match?.awayTeam}`);
                console.log(`   Profits: Home $${homeProfit}, Away $${awayProfit}`);
                console.log(`   Max possible: Home $${(homeOdds-1)*100}, Away $${(awayOdds-1)*100}`);
            }
        });

        console.log(`Suspicious odds: ${suspiciousOdds}/${this.allMatches.length}`);
        console.log(`Impossible results: ${impossibleResults}/${this.allMatches.length}\n`);
        
        if (impossibleResults > 0) {
            console.log('🚨 Found impossible results - data corruption likely');
        } else if (suspiciousOdds > 0) {
            console.log('⚠️ Some suspicious odds - verify data source');
        } else {
            console.log('✅ Results appear realistic');
        }
    }
}

if (require.main === module) {
    const checker = new DataIntegrityCheck();
    checker.verifyDataIntegrity();
    checker.checkSystematicBias();
    checker.checkRealWorldSanity();
}

module.exports = DataIntegrityCheck;