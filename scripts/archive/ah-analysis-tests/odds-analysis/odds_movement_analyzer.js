const fs = require('fs');
const path = require('path');

class OddsMovementAnalyzer {
    constructor() {
        this.oddsMovementPath = path.join(__dirname, '../../data/odds-movement');
        this.allOddsData = [];
        this.matchTimelines = {};
        this.insights = {};
    }

    // Convert timestamp to readable date
    timestampToDate(timestamp) {
        return new Date(timestamp).toISOString();
    }

    // Load all odds movement files
    loadAllOddsData() {
        console.log('🔄 Loading odds movement data...');
        
        const files = fs.readdirSync(this.oddsMovementPath)
            .filter(file => file.endsWith('.json'))
            .sort(); // Sort by timestamp (filename)

        let totalRecords = 0;
        
        files.forEach(file => {
            const filePath = path.join(this.oddsMovementPath, file);
            const timestamp = parseInt(file.replace('.json', ''));
            
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                data.forEach(record => {
                    // Add file timestamp if not present in record
                    if (!record.ts) {
                        record.ts = timestamp;
                    }
                    
                    // Add readable date
                    record.readableDate = this.timestampToDate(record.ts);
                    
                    this.allOddsData.push(record);
                    totalRecords++;
                });
                
            } catch (error) {
                console.log(`⚠️  Error reading ${file}: ${error.message}`);
            }
        });

        console.log(`📊 Loaded ${totalRecords} odds records from ${files.length} files`);
        return this.allOddsData;
    }

    // Group odds by match to see movement over time
    createMatchTimelines() {
        console.log('📈 Creating match timelines...');
        
        this.allOddsData.forEach(record => {
            const matchKey = `${record.id}_${record.date}`;
            
            if (!this.matchTimelines[matchKey]) {
                this.matchTimelines[matchKey] = {
                    matchId: record.id,
                    home: record.home,
                    away: record.away,
                    date: record.date,
                    oddsHistory: []
                };
            }
            
            this.matchTimelines[matchKey].oddsHistory.push({
                timestamp: record.ts,
                readableDate: record.readableDate,
                ahHome: record.ahHome,
                ahAway: record.ahAway,
                oddsHome: record.oddsHome,
                oddsAway: record.oddsAway,
                live: record.live,
                homeScore: record.homeScore,
                awayScore: record.awayScore
            });
        });

        // Sort odds history by timestamp for each match
        Object.keys(this.matchTimelines).forEach(matchKey => {
            this.matchTimelines[matchKey].oddsHistory.sort((a, b) => a.timestamp - b.timestamp);
        });

        console.log(`🎯 Created timelines for ${Object.keys(this.matchTimelines).length} matches`);
        return this.matchTimelines;
    }

    // Analyze odds movement patterns
    analyzeOddsMovement() {
        console.log('🔍 Analyzing odds movement patterns...');
        
        const analysis = {
            totalMatches: Object.keys(this.matchTimelines).length,
            matchesWithMovement: 0,
            averageOddsChanges: 0,
            significantMovements: [],
            quarterHandicapPatterns: [],
            liveVsPreMatchDifferences: [],
            marketEfficiencyIndicators: []
        };

        Object.values(this.matchTimelines).forEach(match => {
            const history = match.oddsHistory;
            
            if (history.length > 1) {
                analysis.matchesWithMovement++;
                
                // Track odds changes over time
                for (let i = 1; i < history.length; i++) {
                    const prev = history[i - 1];
                    const curr = history[i];
                    
                    // Calculate handicap line changes
                    const ahAwayChange = curr.ahAway - prev.ahAway;
                    const oddsAwayChange = curr.oddsAway - prev.oddsAway;
                    
                    // Detect significant movements (handicap change or >10% odds change)
                    if (Math.abs(ahAwayChange) >= 0.25 || Math.abs(oddsAwayChange) >= 0.2) {
                        analysis.significantMovements.push({
                            matchId: match.matchId,
                            home: match.home,
                            away: match.away,
                            date: match.date,
                            timeGap: (curr.timestamp - prev.timestamp) / 1000 / 60, // minutes
                            handicapChange: ahAwayChange,
                            oddsChange: oddsAwayChange,
                            direction: ahAwayChange > 0 ? 'Favoring Home' : ahAwayChange < 0 ? 'Favoring Away' : 'Odds Only',
                            from: {
                                ahAway: prev.ahAway,
                                oddsAway: prev.oddsAway,
                                timestamp: prev.readableDate
                            },
                            to: {
                                ahAway: curr.ahAway,
                                oddsAway: curr.oddsAway,
                                timestamp: curr.readableDate
                            }
                        });
                    }

                    // Check for quarter handicap patterns
                    if (this.isQuarterHandicap(curr.ahAway) || this.isQuarterHandicap(prev.ahAway)) {
                        analysis.quarterHandicapPatterns.push({
                            matchId: match.matchId,
                            home: match.home,
                            away: match.away,
                            prevHandicap: prev.ahAway,
                            currHandicap: curr.ahAway,
                            prevOdds: prev.oddsAway,
                            currOdds: curr.oddsAway,
                            isStuckInQuarter: this.isQuarterHandicap(curr.ahAway) && this.isQuarterHandicap(prev.ahAway)
                        });
                    }

                    // Live vs pre-match analysis
                    if (curr.live && !prev.live) {
                        analysis.liveVsPreMatchDifferences.push({
                            matchId: match.matchId,
                            home: match.home,
                            away: match.away,
                            preMatchOdds: prev.oddsAway,
                            liveOdds: curr.oddsAway,
                            oddsDifference: curr.oddsAway - prev.oddsAway,
                            homeScore: curr.homeScore,
                            awayScore: curr.awayScore
                        });
                    }
                }
            }
        });

        this.insights.oddsMovementAnalysis = analysis;
        return analysis;
    }

    // Check if handicap is quarter (0.25, 0.75, 1.25, etc.)
    isQuarterHandicap(handicap) {
        if (handicap === null || handicap === undefined) return false;
        const decimal = Math.abs(handicap) % 1;
        return decimal === 0.25 || decimal === 0.75;
    }

    // Validate HKJC trapped theory with real odds data
    validateHKJCTrappedTheory() {
        console.log('🎯 Validating HKJC Trapped Theory with real odds data...');
        
        const validation = {
            quarterHandicapFrequency: 0,
            fullHandicapFrequency: 0,
            extremeOddsInQuarters: 0,
            extremeOddsInFull: 0,
            trappedScenarios: []
        };

        this.allOddsData.forEach(record => {
            if (record.ahAway !== null && record.ahAway !== undefined) {
                if (this.isQuarterHandicap(record.ahAway)) {
                    validation.quarterHandicapFrequency++;
                    
                    // Check for extreme odds (≤1.70 or ≥2.30)
                    if (record.oddsAway && (record.oddsAway <= 1.70 || record.oddsAway >= 2.30)) {
                        validation.extremeOddsInQuarters++;
                        
                        validation.trappedScenarios.push({
                            matchId: record.id,
                            home: record.home,
                            away: record.away,
                            handicap: record.ahAway,
                            odds: record.oddsAway,
                            date: record.date,
                            timestamp: record.readableDate,
                            extremeType: record.oddsAway <= 1.70 ? 'Heavy Favorite' : 'Heavy Underdog'
                        });
                    }
                } else {
                    validation.fullHandicapFrequency++;
                    
                    if (record.oddsAway && (record.oddsAway <= 1.70 || record.oddsAway >= 2.30)) {
                        validation.extremeOddsInFull++;
                    }
                }
            }
        });

        const totalHandicaps = validation.quarterHandicapFrequency + validation.fullHandicapFrequency;
        validation.quarterPercentage = totalHandicaps > 0 ? (validation.quarterHandicapFrequency / totalHandicaps * 100) : 0;
        validation.extremeOddsQuarterRate = validation.quarterHandicapFrequency > 0 ? 
            (validation.extremeOddsInQuarters / validation.quarterHandicapFrequency * 100) : 0;
        validation.extremeOddsFullRate = validation.fullHandicapFrequency > 0 ? 
            (validation.extremeOddsInFull / validation.fullHandicapFrequency * 100) : 0;

        this.insights.hkjcTrappedValidation = validation;
        return validation;
    }

    // Find potential arbitrage opportunities
    findArbitrageOpportunities() {
        console.log('💰 Scanning for arbitrage opportunities...');
        
        const opportunities = [];
        
        // Group by date to find simultaneous different odds for same match
        const matchesByDate = {};
        
        this.allOddsData.forEach(record => {
            const key = `${record.date}_${record.home}_${record.away}`;
            
            if (!matchesByDate[key]) {
                matchesByDate[key] = [];
            }
            matchesByDate[key].push(record);
        });

        Object.values(matchesByDate).forEach(matchRecords => {
            if (matchRecords.length > 1) {
                // Sort by timestamp to see odds progression
                matchRecords.sort((a, b) => a.ts - b.ts);
                
                const first = matchRecords[0];
                const last = matchRecords[matchRecords.length - 1];
                
                // Look for significant odds differences that might indicate opportunities
                if (first.oddsAway && last.oddsAway) {
                    const oddsDiff = Math.abs(last.oddsAway - first.oddsAway);
                    
                    if (oddsDiff >= 0.15) { // 15 cent difference might be significant
                        opportunities.push({
                            matchId: first.id,
                            home: first.home,
                            away: first.away,
                            date: first.date,
                            initialOdds: first.oddsAway,
                            finalOdds: last.oddsAway,
                            oddsDifference: oddsDiff,
                            timeSpan: (last.ts - first.ts) / 1000 / 60, // minutes
                            direction: last.oddsAway > first.oddsAway ? 'Lengthening' : 'Shortening',
                            handicapStable: first.ahAway === last.ahAway
                        });
                    }
                }
            }
        });

        this.insights.arbitrageOpportunities = opportunities;
        return opportunities;
    }

    // Generate comprehensive report
    generateReport() {
        console.log('📋 Generating comprehensive odds movement report...');
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalOddsRecords: this.allOddsData.length,
                totalMatches: Object.keys(this.matchTimelines).length,
                dataTimespan: {
                    earliest: this.timestampToDate(Math.min(...this.allOddsData.map(r => r.ts))),
                    latest: this.timestampToDate(Math.max(...this.allOddsData.map(r => r.ts)))
                }
            },
            insights: this.insights,
            topFindings: this.extractTopFindings()
        };

        // Save report
        const reportPath = path.join(__dirname, 'odds_movement_analysis_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`💾 Report saved to: ${reportPath}`);
        return report;
    }

    // Extract top findings for quick review
    extractTopFindings() {
        const findings = [];
        
        // HKJC trapped theory validation
        if (this.insights.hkjcTrappedValidation) {
            const validation = this.insights.hkjcTrappedValidation;
            findings.push({
                type: 'HKJC Trapped Theory',
                finding: `${validation.quarterPercentage.toFixed(1)}% of handicaps are quarter format`,
                significance: validation.quarterPercentage > 70 ? 'HIGH' : 'MEDIUM',
                detail: `${validation.extremeOddsInQuarters} extreme odds cases in quarter handicaps vs ${validation.extremeOddsInFull} in full handicaps`
            });
        }

        // Significant odds movements
        if (this.insights.oddsMovementAnalysis) {
            const analysis = this.insights.oddsMovementAnalysis;
            findings.push({
                type: 'Market Volatility',
                finding: `${analysis.significantMovements.length} significant odds movements detected`,
                significance: analysis.significantMovements.length > 10 ? 'HIGH' : 'LOW',
                detail: `Average time between significant moves: ${analysis.significantMovements.length > 0 ? 
                    (analysis.significantMovements.reduce((sum, m) => sum + m.timeGap, 0) / analysis.significantMovements.length).toFixed(1) : 'N/A'} minutes`
            });
        }

        // Arbitrage opportunities
        if (this.insights.arbitrageOpportunities) {
            const opportunities = this.insights.arbitrageOpportunities;
            findings.push({
                type: 'Arbitrage Potential',
                finding: `${opportunities.length} potential arbitrage opportunities identified`,
                significance: opportunities.length > 5 ? 'HIGH' : 'LOW',
                detail: `Largest odds swing: ${opportunities.length > 0 ? 
                    Math.max(...opportunities.map(o => o.oddsDifference)).toFixed(2) : 'N/A'} points`
            });
        }

        return findings;
    }

    // Main analysis function
    async runFullAnalysis() {
        console.log('🚀 ODDS MOVEMENT COMPREHENSIVE ANALYSIS');
        console.log('======================================');
        
        try {
            this.loadAllOddsData();
            this.createMatchTimelines();
            this.analyzeOddsMovement();
            this.validateHKJCTrappedTheory();
            this.findArbitrageOpportunities();
            
            const report = this.generateReport();
            
            // Display key findings
            console.log('\n🏆 TOP FINDINGS:');
            report.topFindings.forEach((finding, index) => {
                console.log(`${index + 1}. [${finding.significance}] ${finding.type}: ${finding.finding}`);
                console.log(`   ${finding.detail}\n`);
            });
            
            return report;
            
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            throw error;
        }
    }
}

// Run analysis if called directly
if (require.main === module) {
    const analyzer = new OddsMovementAnalyzer();
    analyzer.runFullAnalysis().catch(console.error);
}

module.exports = OddsMovementAnalyzer; 