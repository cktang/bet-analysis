const fs = require('fs');
const path = require('path');

/**
 * Proper Relegation Strategy (Week 25+) and Early Season Position Volatility Strategy
 */
class ProperStrategies {
    constructor() {
        this.outputDir = path.join(__dirname, 'betting_records');
        this.ensureOutputDirectory();
    }

    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    loadMatchData() {
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        let allMatches = [];
        
        seasons.forEach(season => {
            const filePath = path.join(__dirname, `data/processed/year-${season}.json`);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const matches = Object.values(data.matches);
                allMatches = allMatches.concat(matches);
                console.log(`📊 Loaded ${matches.length} matches from ${season}`);
            }
        });
        
        console.log(`🎯 Total matches loaded: ${allMatches.length}\\n`);
        return allMatches;
    }

    /**
     * PROPER Relegation Strategy - Only week 25+ when positions are meaningful
     */
    testProperRelegationStrategy() {
        console.log('🔍 TESTING PROPER RELEGATION STRATEGY (Week 25+ only)\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        allMatches.forEach(match => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            
            // Only consider late season matches (week 25+) when relegation pressure is real
            if (!week || week < 25 || !homePos || !awayPos) return;
            
            // Calculate PROPER relegation pressure (positions 18+)
            const homeRelegationPressure = Math.max(0, homePos - 17);
            const awayRelegationPressure = Math.max(0, awayPos - 17);
            const totalRelegationPressure = homeRelegationPressure + awayRelegationPressure;
            
            // Only bet when there's actual relegation pressure involved
            if (totalRelegationPressure > 0) {
                
                // Strategy Logic: Bet on team with LESS relegation pressure
                let betSide, odds;
                if (homeRelegationPressure < awayRelegationPressure) {
                    betSide = 'HOME';
                    odds = match.match?.asianHandicapOdds?.homeOdds || 2.0;
                } else if (awayRelegationPressure < homeRelegationPressure) {
                    betSide = 'AWAY';
                    odds = match.match?.asianHandicapOdds?.awayOdds || 2.0;
                } else {
                    // Equal pressure - skip bet
                    return;
                }
                
                const betAmount = 100;
                const homeScore = match.match.homeScore;
                const awayScore = match.match.awayScore;
                
                let result = 'LOSE';
                let profit = -betAmount;
                
                if ((betSide === 'HOME' && homeScore > awayScore) || 
                    (betSide === 'AWAY' && awayScore > homeScore)) {
                    result = 'WIN';
                    profit = betAmount * (odds - 1);
                } else if (homeScore === awayScore) {
                    result = 'PUSH';
                    profit = 0;
                }
                
                bettingRecords.push({
                    date: match.match.date,
                    week,
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    homePos,
                    awayPos,
                    homeRelegationPressure,
                    awayRelegationPressure,
                    totalRelegationPressure,
                    homeScore,
                    awayScore,
                    betSide,
                    odds,
                    betAmount,
                    result,
                    profit,
                    runningProfit: 0
                });
            }
        });
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += record.profit;
            record.runningProfit = runningTotal;
        });
        
        this.printResults('PROPER_RELEGATION_STRATEGY (Week 25+)', bettingRecords);
        this.saveResults('proper_relegation_strategy_week25plus', bettingRecords);
        
        return this.calculateSummary(bettingRecords);
    }

    /**
     * Early Season Position Volatility Strategy - Exploit early bad starts (Week 2-8)
     */
    testEarlySeasonVolatilityStrategy() {
        console.log('🔍 TESTING EARLY SEASON POSITION VOLATILITY STRATEGY (Week 2-8)\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        allMatches.forEach(match => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            
            // Only consider early season (week 2-8) when positions are volatile
            if (!week || week < 2 || week > 8 || !homePos || !awayPos) return;
            
            // Strategy: Look for established teams vs teams having terrible early starts
            const isHomeEstablished = this.isEstablishedTeam(match.match.homeTeam);
            const isAwayEstablished = this.isEstablishedTeam(match.match.awayTeam);
            
            // Early season position gaps (teams in bottom 5 after few games)
            const homeEarlyStruggle = homePos >= 16 ? (homePos - 15) : 0;
            const awayEarlyStruggle = awayPos >= 16 ? (awayPos - 15) : 0;
            
            let betSide = null;
            let odds = 2.0;
            
            // Strategy Logic:
            // 1. Established team vs early strugglers
            // 2. Or bet against newly promoted teams having nightmare starts
            
            if (isHomeEstablished && awayEarlyStruggle > 0) {
                // Established home team vs away team struggling early
                betSide = 'HOME';
                odds = match.match?.asianHandicapOdds?.homeOdds || 2.0;
            } else if (isAwayEstablished && homeEarlyStruggle > 0) {
                // Established away team vs home team struggling early  
                betSide = 'AWAY';
                odds = match.match?.asianHandicapOdds?.awayOdds || 2.0;
            } else if (!isHomeEstablished && !isAwayEstablished && Math.abs(homePos - awayPos) >= 10) {
                // Two non-established teams with huge early position gap
                betSide = homePos < awayPos ? 'HOME' : 'AWAY';
                odds = betSide === 'HOME' ? 
                    (match.match?.asianHandicapOdds?.homeOdds || 2.0) : 
                    (match.match?.asianHandicapOdds?.awayOdds || 2.0);
            } else {
                return; // Skip bet
            }
            
            const betAmount = 100;
            const homeScore = match.match.homeScore;
            const awayScore = match.match.awayScore;
            
            let result = 'LOSE';
            let profit = -betAmount;
            
            if ((betSide === 'HOME' && homeScore > awayScore) || 
                (betSide === 'AWAY' && awayScore > homeScore)) {
                result = 'WIN';
                profit = betAmount * (odds - 1);
            } else if (homeScore === awayScore) {
                result = 'PUSH';
                profit = 0;
            }
            
            bettingRecords.push({
                date: match.match.date,
                week,
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homePos,
                awayPos,
                homeEstablished: isHomeEstablished,
                awayEstablished: isAwayEstablished,
                homeEarlyStruggle,
                awayEarlyStruggle,
                positionGap: Math.abs(homePos - awayPos),
                homeScore,
                awayScore,
                betSide,
                odds,
                betAmount,
                result,
                profit,
                runningProfit: 0
            });
        });
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += record.profit;
            record.runningProfit = runningTotal;
        });
        
        this.printResults('EARLY_SEASON_VOLATILITY_STRATEGY (Week 2-8)', bettingRecords);
        this.saveResults('early_season_volatility_strategy_week2to8', bettingRecords);
        
        return this.calculateSummary(bettingRecords);
    }

    /**
     * Identify established Premier League teams vs newly promoted/unstable teams
     */
    isEstablishedTeam(teamName) {
        const establishedTeams = [
            'Manchester City', 'Manchester Utd', 'Liverpool', 'Arsenal', 'Chelsea', 'Tottenham',
            'Newcastle', 'Brighton', 'Aston Villa', 'West Ham', 'Crystal Palace', 'Everton',
            'Wolves', 'Fulham', 'Brentford', 'Bournemouth', 'Nottingham Forest'
        ];
        
        // Recently promoted or frequently relegated teams
        const volatileTeams = [
            'Sheffield Utd', 'Burnley', 'Luton', 'Southampton', 'Ipswich', 'Leicester'
        ];
        
        return establishedTeams.includes(teamName) && !volatileTeams.includes(teamName);
    }

    /**
     * Alternative Strategy: "Big 6" vs Bottom Half Early Season
     */
    testBig6VsBottomHalfEarlyStrategy() {
        console.log('🔍 TESTING BIG 6 vs BOTTOM HALF EARLY SEASON STRATEGY (Week 2-10)\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        const big6Teams = ['Manchester City', 'Manchester Utd', 'Liverpool', 'Arsenal', 'Chelsea', 'Tottenham'];
        
        allMatches.forEach(match => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            
            // Early season only (week 2-10)
            if (!week || week < 2 || week > 10 || !homePos || !awayPos) return;
            
            const isHomeBig6 = big6Teams.includes(match.match.homeTeam);
            const isAwayBig6 = big6Teams.includes(match.match.awayTeam);
            
            let betSide = null;
            let odds = 2.0;
            
            // Strategy: Big 6 team vs team in bottom half (position 11+) early in season
            if (isHomeBig6 && awayPos >= 11 && !isAwayBig6) {
                betSide = 'HOME';
                odds = match.match?.asianHandicapOdds?.homeOdds || 2.0;
            } else if (isAwayBig6 && homePos >= 11 && !isHomeBig6) {
                betSide = 'AWAY';
                odds = match.match?.asianHandicapOdds?.awayOdds || 2.0;
            } else {
                return; // Skip bet
            }
            
            const betAmount = 100;
            const homeScore = match.match.homeScore;
            const awayScore = match.match.awayScore;
            
            let result = 'LOSE';
            let profit = -betAmount;
            
            if ((betSide === 'HOME' && homeScore > awayScore) || 
                (betSide === 'AWAY' && awayScore > homeScore)) {
                result = 'WIN';
                profit = betAmount * (odds - 1);
            } else if (homeScore === awayScore) {
                result = 'PUSH';
                profit = 0;
            }
            
            bettingRecords.push({
                date: match.match.date,
                week,
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homePos,
                awayPos,
                homeBig6: isHomeBig6,
                awayBig6: isAwayBig6,
                homeScore,
                awayScore,
                betSide,
                odds,
                betAmount,
                result,
                profit,
                runningProfit: 0
            });
        });
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += record.profit;
            record.runningProfit = runningTotal;
        });
        
        this.printResults('BIG_6_vs_BOTTOM_HALF_EARLY (Week 2-10)', bettingRecords);
        this.saveResults('big6_vs_bottom_half_early_strategy', bettingRecords);
        
        return this.calculateSummary(bettingRecords);
    }

    printResults(strategyName, records) {
        const summary = this.calculateSummary(records);
        
        console.log(`📋 ${strategyName} RESULTS:`);
        console.log(`  📊 Total bets: ${summary.totalBets}`);
        console.log(`  ✅ Wins: ${summary.wins} (${summary.winRate}%)`);
        console.log(`  ❌ Losses: ${summary.losses}`);
        console.log(`  🤝 Pushes: ${summary.pushes}`);
        console.log(`  💰 Total profit: $${summary.totalProfit.toFixed(2)}`);
        console.log(`  📈 ROI: ${summary.profitability}%`);
        
        if (records.length > 0) {
            console.log(`  🎯 Sample matches:`);
            records.slice(0, 3).forEach(record => {
                const weekInfo = record.week ? `Week ${record.week}` : '';
                console.log(`    ${weekInfo}: ${record.homeTeam}(${record.homePos}) vs ${record.awayTeam}(${record.awayPos}) - ${record.result}`);
            });
        }
        console.log();
    }

    calculateSummary(records) {
        const totalBets = records.length;
        const wins = records.filter(r => r.result === 'WIN').length;
        const losses = records.filter(r => r.result === 'LOSE').length;
        const pushes = records.filter(r => r.result === 'PUSH').length;
        const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
        const winRate = totalBets > 0 ? (wins / totalBets * 100).toFixed(2) : '0.00';
        const profitability = totalBets > 0 ? (totalProfit / (totalBets * 100) * 100).toFixed(2) : '0.00';
        
        return {
            totalBets,
            wins,
            losses,
            pushes,
            totalProfit,
            winRate,
            profitability
        };
    }

    saveResults(fileName, records) {
        const csvHeaders = [
            'Date', 'Week', 'Home Team', 'Away Team', 'Home Pos', 'Away Pos', 
            'Home Score', 'Away Score', 'Bet Side', 'Odds', 'Result', 'Profit', 'Running Profit'
        ];
        
        const csvRows = records.map(record => [
            record.date,
            record.week,
            record.homeTeam,
            record.awayTeam,
            record.homePos,
            record.awayPos,
            record.homeScore,
            record.awayScore,
            record.betSide,
            record.odds,
            record.result,
            record.profit.toFixed(2),
            record.runningProfit.toFixed(2)
        ]);
        
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\\n');
        const csvFilePath = path.join(this.outputDir, `${fileName}.csv`);
        fs.writeFileSync(csvFilePath, csvContent);
        
        console.log(`💾 Records saved to: ${fileName}.csv`);
    }

    runAllProperStrategies() {
        console.log('🚀 TESTING PROPER WEEKLY-SEGMENTED STRATEGIES\\n');
        
        const relegationResults = this.testProperRelegationStrategy();
        const earlyVolatilityResults = this.testEarlySeasonVolatilityStrategy();
        const big6Results = this.testBig6VsBottomHalfEarlyStrategy();
        
        console.log('✅ STRATEGY COMPARISON SUMMARY:\\n');
        
        console.log('1. Proper Relegation Strategy (Week 25+):');
        console.log(`   - ${relegationResults.totalBets} bets, ${relegationResults.profitability}% ROI`);
        console.log(`   - Only late season when relegation pressure is real`);
        
        console.log('\\n2. Early Season Volatility Strategy (Week 2-8):');
        console.log(`   - ${earlyVolatilityResults.totalBets} bets, ${earlyVolatilityResults.profitability}% ROI`);
        console.log(`   - Exploits early bad starts and position volatility`);
        
        console.log('\\n3. Big 6 vs Bottom Half Early (Week 2-10):');
        console.log(`   - ${big6Results.totalBets} bets, ${big6Results.profitability}% ROI`);
        console.log(`   - Traditional favorites vs early strugglers`);
        
        console.log('\\n📁 Check betting_records/ for detailed CSV files');
        
        return {
            relegation: relegationResults,
            earlyVolatility: earlyVolatilityResults,
            big6: big6Results
        };
    }
}

// Run the proper strategies
const tester = new ProperStrategies();
tester.runAllProperStrategies();