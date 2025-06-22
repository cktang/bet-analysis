const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Strategy Auditor and Runner
 * Examines ALL strategy logic and reruns with proper AH calculations
 */
class ComprehensiveStrategyAuditor {
    constructor() {
        this.outputDir = path.join(__dirname, 'betting-records');
        this.clearAndCreateOutputDirectory();
        this.strategies = this.defineAllStrategies();
    }

    clearAndCreateOutputDirectory() {
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true, force: true });
            console.log('🗑️  Removed existing betting-records directory');
        }
        fs.mkdirSync(this.outputDir, { recursive: true });
        console.log(`✅ Created fresh directory: ${this.outputDir}`);
    }

    /**
     * Define ALL betting strategies with proper logic validation
     */
    defineAllStrategies() {
        return {
            // 1. RELEGATION STRATEGIES
            relegationPressure: {
                name: 'Relegation Pressure Strategy',
                description: 'Bet against teams with high relegation pressure (positions 18-20)',
                minWeek: 25,
                logic: (match, homePos, awayPos, week) => {
                    const homeRelegationPressure = Math.max(0, homePos - 17); // 18+ positions
                    const awayRelegationPressure = Math.max(0, awayPos - 17);
                    const totalPressure = homeRelegationPressure + awayRelegationPressure;
                    
                    if (totalPressure === 0) return null;
                    
                    // Bet on team with LESS relegation pressure
                    if (homeRelegationPressure < awayRelegationPressure) {
                        return { side: 'HOME', factor: totalPressure };
                    } else if (awayRelegationPressure < homeRelegationPressure) {
                        return { side: 'AWAY', factor: totalPressure };
                    }
                    return null; // Equal pressure
                }
            },

            // 2. TITLE RACE STRATEGIES  
            titleRacePressure: {
                name: 'Title Race Pressure Strategy',
                description: 'Bet on top teams under title pressure (positions 1-3)',
                minWeek: 25,
                logic: (match, homePos, awayPos, week) => {
                    const homeTitlePressure = Math.max(0, 4 - homePos); // Top 3 positions
                    const awayTitlePressure = Math.max(0, 4 - awayPos);
                    const totalPressure = homeTitlePressure + awayTitlePressure;
                    
                    if (totalPressure === 0) return null;
                    
                    // Bet on team with MORE title pressure (motivation)
                    if (homeTitlePressure > awayTitlePressure) {
                        return { side: 'HOME', factor: totalPressure };
                    } else if (awayTitlePressure > homeTitlePressure) {
                        return { side: 'AWAY', factor: totalPressure };
                    }
                    return null;
                }
            },

            // 3. EUROPA/CONFERENCE LEAGUE STRATEGIES
            europeanCompetitionPressure: {
                name: 'European Competition Pressure',
                description: 'Bet on teams fighting for European spots (positions 4-7)',
                minWeek: 25,
                logic: (match, homePos, awayPos, week) => {
                    const homeEuropePressure = homePos >= 4 && homePos <= 7 ? (8 - homePos) : 0;
                    const awayEuropePressure = awayPos >= 4 && awayPos <= 7 ? (8 - awayPos) : 0;
                    const totalPressure = homeEuropePressure + awayEuropePressure;
                    
                    if (totalPressure === 0) return null;
                    
                    // Bet on team with MORE European pressure
                    if (homeEuropePressure > awayEuropePressure) {
                        return { side: 'HOME', factor: totalPressure };
                    } else if (awayEuropePressure > homeEuropePressure) {
                        return { side: 'AWAY', factor: totalPressure };
                    }
                    return null;
                }
            },

            // 4. EARLY SEASON VOLATILITY
            earlySeasonVolatility: {
                name: 'Early Season Volatility Strategy',
                description: 'Bet on good teams vs teams with bad early start (weeks 1-15)',
                minWeek: 1,
                maxWeek: 15,
                logic: (match, homePos, awayPos, week) => {
                    // Only early season
                    if (week > 15) return null;
                    
                    const homeUnderperforming = homePos >= 15; // Bottom half teams
                    const awayUnderperforming = awayPos >= 15;
                    const homeOverperforming = homePos <= 6; // Top 6 teams
                    const awayOverperforming = awayPos <= 6;
                    
                    // Good team vs underperforming team
                    if (homeOverperforming && awayUnderperforming) {
                        return { side: 'HOME', factor: awayPos - homePos };
                    } else if (awayOverperforming && homeUnderperforming) {
                        return { side: 'AWAY', factor: homePos - awayPos };
                    }
                    return null;
                }
            },

            // 5. MID-SEASON STABILITY
            midSeasonStability: {
                name: 'Mid-Season Stability Strategy', 
                description: 'Bet on established teams in mid-season (weeks 16-24)',
                minWeek: 16,
                maxWeek: 24,
                logic: (match, homePos, awayPos, week) => {
                    if (week < 16 || week > 24) return null;
                    
                    const homeEstablished = homePos <= 10; // Top half
                    const awayEstablished = awayPos <= 10;
                    
                    // Established vs non-established
                    if (homeEstablished && !awayEstablished) {
                        return { side: 'HOME', factor: awayPos - homePos };
                    } else if (awayEstablished && !homeEstablished) {
                        return { side: 'AWAY', factor: homePos - awayPos };
                    }
                    return null;
                }
            },

            // 6. TOP VS BOTTOM STRATEGY
            topVsBottom: {
                name: 'Top vs Bottom Strategy',
                description: 'Always bet on top 6 teams when playing bottom 6 teams',
                minWeek: 1,
                logic: (match, homePos, awayPos, week) => {
                    const homeTop6 = homePos <= 6;
                    const awayTop6 = awayPos <= 6;
                    const homeBottom6 = homePos >= 15;
                    const awayBottom6 = awayPos >= 15;
                    
                    // Top 6 vs Bottom 6
                    if (homeTop6 && awayBottom6) {
                        return { side: 'HOME', factor: awayPos - homePos };
                    } else if (awayTop6 && homeBottom6) {
                        return { side: 'AWAY', factor: homePos - awayPos };
                    }
                    return null;
                }
            },

            // 7. POSITION DIFFERENTIAL STRATEGY
            positionDifferential: {
                name: 'Position Differential Strategy',
                description: 'Bet when position difference is 8+ places',
                minWeek: 10, // Allow some position settling
                logic: (match, homePos, awayPos, week) => {
                    if (week < 10) return null;
                    
                    const differential = Math.abs(homePos - awayPos);
                    if (differential >= 8) {
                        // Bet on better positioned team
                        if (homePos < awayPos) {
                            return { side: 'HOME', factor: differential };
                        } else {
                            return { side: 'AWAY', factor: differential };
                        }
                    }
                    return null;
                }
            },

            // 8. LATE SEASON DESPERATION
            lateSeasonDesperation: {
                name: 'Late Season Desperation Strategy',
                description: 'Bet on desperately placed teams in final weeks',
                minWeek: 35,
                logic: (match, homePos, awayPos, week) => {
                    if (week < 35) return null;
                    
                    const homeDesperate = homePos >= 17; // Fighting relegation/European spots
                    const awayDesperate = awayPos >= 17;
                    const homeComfortable = homePos >= 8 && homePos <= 14; // Mid-table comfort
                    const awayComfortable = awayPos >= 8 && awayPos <= 14;
                    
                    // Desperate vs comfortable
                    if (homeDesperate && awayComfortable) {
                        return { side: 'HOME', factor: homePos };
                    } else if (awayDesperate && homeComfortable) {
                        return { side: 'AWAY', factor: awayPos };
                    }
                    return null;
                }
            }
        };
    }

    loadMatchData() {
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        let allMatches = [];
        
        seasons.forEach(season => {
            const filePath = path.join(__dirname, `../../data/processed/year-${season}.json`);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const matches = Object.values(data.matches);
                allMatches = allMatches.concat(matches);
                console.log(`📊 Loaded ${matches.length} matches from ${season}`);
            }
        });
        
        console.log(`🎯 Total matches loaded: ${allMatches.length}\n`);
        return allMatches;
    }

    /**
     * Run a single strategy with proper AH calculations
     */
    runStrategy(strategyKey, strategy, allMatches) {
        console.log(`\n🔍 RUNNING: ${strategy.name}`);
        console.log(`📝 Description: ${strategy.description}`);
        
        const bettingRecords = [];
        let matchesAnalyzed = 0;
        let matchesWithAH = 0;
        
        allMatches.forEach((match, matchIndex) => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            const ahOdds = match.match?.asianHandicapOdds;
            const ahOutcomes = match.enhanced?.postMatch?.bettingOutcomes;
            
            // Check week constraints
            if (!week || !homePos || !awayPos) return;
            if (week < (strategy.minWeek || 1)) return;
            if (strategy.maxWeek && week > strategy.maxWeek) return;
            
            matchesAnalyzed++;
            
            // Must have AH data
            if (!ahOdds || !ahOutcomes) return;
            matchesWithAH++;
            
            // Apply strategy logic
            const decision = strategy.logic(match, homePos, awayPos, week);
            if (!decision) return;
            
            // Get AH data based on decision
            let betSide, odds, handicap, ahResult, profit;
            
            if (decision.side === 'HOME') {
                betSide = 'HOME';
                odds = ahOdds.homeOdds;
                handicap = ahOdds.homeHandicap;
                ahResult = ahOutcomes.homeResult;
                profit = ahOutcomes.homeProfit;
            } else {
                betSide = 'AWAY';
                odds = ahOdds.awayOdds;
                handicap = ahOdds.awayHandicap;
                ahResult = ahOutcomes.awayResult;
                profit = ahOutcomes.awayProfit;
            }
            
            const betAmount = 100;
            const homeScore = match.match?.homeScore ?? 0;
            const awayScore = match.match?.awayScore ?? 0;
            
            // Map result
            let betResult;
            if (ahResult === 'win') betResult = 'WIN';
            else if (ahResult === 'loss') betResult = 'LOSE';
            else betResult = 'PUSH';
            
            const matchId = `${match.match?.date || new Date().toISOString()}_${match.match?.homeTeam || 'Unknown'}_${match.match?.awayTeam || 'Unknown'}`;
            
            bettingRecords.push({
                matchIndex: matchIndex + 1,
                matchId: matchId.replace(/[^a-zA-Z0-9_-]/g, '_'),
                date: match.match?.date || 'Unknown',
                season: this.getSeason(match.match?.date || ''),
                week,
                homeTeam: match.match?.homeTeam || 'Unknown',
                awayTeam: match.match?.awayTeam || 'Unknown',
                homePos,
                awayPos,
                strategyFactor: decision.factor || 0,
                homeScore,
                awayScore,
                actualResult: homeScore > awayScore ? 'HOME_WIN' : 
                             awayScore > homeScore ? 'AWAY_WIN' : 'DRAW',
                betSide,
                handicap: handicap || 'N/A',
                odds: Number(odds || 1.9).toFixed(2),
                impliedProbability: (1/(odds || 1.9)*100).toFixed(1),
                betAmount,
                ahResult: betResult,
                profit: Number(profit || 0).toFixed(2),
                runningProfit: 0
            });
        });
        
        console.log(`📊 Analysis: ${matchesAnalyzed} matches analyzed, ${matchesWithAH} with AH data`);
        console.log(`🎯 Bets found: ${bettingRecords.length}`);
        
        if (bettingRecords.length === 0) {
            console.log(`❌ No bets found for ${strategy.name}`);
            return null;
        }
        
        // Sort and calculate running profit
        bettingRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += parseFloat(record.profit);
            record.runningProfit = runningTotal.toFixed(2);
        });
        
        // Save CSV
        this.saveStrategyCSV(strategyKey, bettingRecords);
        
        // Print summary
        const summary = this.printStrategySummary(strategy.name, bettingRecords);
        
        return { records: bettingRecords, summary };
    }

    getSeason(dateString) {
        if (!dateString) return 'Unknown';
        if (dateString.includes('2022')) return '2022-2023';
        if (dateString.includes('2023')) return '2023-2024';
        if (dateString.includes('2024') || dateString.includes('2025')) return '2024-2025';
        return 'Unknown';
    }

    saveStrategyCSV(strategyKey, records) {
        const headers = [
            'Match_Index', 'Match_ID', 'Date', 'Season', 'Week',
            'Home_Team', 'Away_Team', 'Home_Position', 'Away_Position', 'Strategy_Factor',
            'Home_Score', 'Away_Score', 'Actual_Result',
            'Bet_Side', 'AH_Handicap', 'AH_Odds', 'Implied_Probability_Percent',
            'Bet_Amount', 'AH_Result', 'AH_Profit_USD', 'Running_Profit_USD'
        ];
        
        const csvRows = [headers.join(',')];
        
        records.forEach(record => {
            const row = [
                record.matchIndex, record.matchId, record.date, record.season, record.week,
                `"${record.homeTeam}"`, `"${record.awayTeam}"`, 
                record.homePos, record.awayPos, record.strategyFactor,
                record.homeScore, record.awayScore, record.actualResult,
                record.betSide, record.handicap, record.odds, record.impliedProbability,
                record.betAmount, record.ahResult, record.profit, record.runningProfit
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const filePath = path.join(this.outputDir, `${strategyKey}_strategy.csv`);
        
        try {
            fs.writeFileSync(filePath, csvContent, 'utf8');
            console.log(`💾 CSV saved: ${strategyKey}_strategy.csv`);
        } catch (error) {
            console.error(`❌ Error saving CSV: ${error.message}`);
        }
    }

    printStrategySummary(strategyName, records) {
        const totalBets = records.length;
        const wins = records.filter(r => r.ahResult === 'WIN').length;
        const losses = records.filter(r => r.ahResult === 'LOSE').length;
        const pushes = records.filter(r => r.ahResult === 'PUSH').length;
        const totalProfit = records.reduce((sum, r) => sum + parseFloat(r.profit), 0);
        const winRate = (wins / totalBets * 100).toFixed(2);
        const roi = (totalProfit / (totalBets * 100) * 100).toFixed(2);
        
        console.log(`📊 ${strategyName} RESULTS:`);
        console.log(`   Bets: ${totalBets} | Wins: ${wins} (${winRate}%) | Losses: ${losses} | Pushes: ${pushes}`);
        console.log(`   Profit: $${totalProfit.toFixed(2)} | ROI: ${roi}%`);
        
        return { totalBets, wins, losses, pushes, totalProfit, winRate, roi };
    }

    /**
     * Run comprehensive audit of ALL strategies
     */
    runComprehensiveAudit() {
        console.log('🚀 COMPREHENSIVE STRATEGY AUDIT AND EXECUTION\n');
        console.log('🔍 Examining and running ALL betting strategies with proper AH calculations\n');
        
        const allMatches = this.loadMatchData();
        const results = {};
        const summaryTable = [];
        
        // Run each strategy
        Object.entries(this.strategies).forEach(([key, strategy]) => {
            const result = this.runStrategy(key, strategy, allMatches);
            if (result) {
                results[key] = result;
                summaryTable.push({
                    strategy: strategy.name,
                    bets: result.summary.totalBets,
                    winRate: result.summary.winRate,
                    roi: result.summary.roi,
                    profit: result.summary.totalProfit.toFixed(2)
                });
            }
        });
        
        // Print comprehensive summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE STRATEGY PERFORMANCE SUMMARY');
        console.log('='.repeat(80));
        
        summaryTable
            .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
            .forEach((summary, index) => {
                console.log(`${index + 1}. ${summary.strategy}`);
                console.log(`   Bets: ${summary.bets} | Win Rate: ${summary.winRate}% | ROI: ${summary.roi}% | Profit: $${summary.profit}`);
            });
        
        console.log('\n✅ All strategies completed and CSV files generated');
        console.log(`📁 Check ${this.outputDir} for all strategy CSV files`);
        
        return results;
    }
}

// Run comprehensive audit
const auditor = new ComprehensiveStrategyAuditor();
auditor.runComprehensiveAudit();