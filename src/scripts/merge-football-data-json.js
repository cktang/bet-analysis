const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class FootballDataJsonMerger {
    constructor() {
        this.teamMapping = new Map();
        this.resultData = {};
    }

    // Load team mapping from CSV
    async loadTeamMapping() {
        console.log('Loading team mapping from data/raw/team-mapping.csv');
        
        return new Promise((resolve, reject) => {
            const mappings = [];
            fs.createReadStream('data/raw/team-mapping.csv')
                .pipe(csv())
                .on('data', (row) => {
                    mappings.push(row);
                })
                .on('end', () => {
                    // Build mapping
                    mappings.forEach(row => {
                        this.teamMapping.set(row.Original_Name, row.Normalized_Name);
                    });
                    console.log(`Loaded ${this.teamMapping.size} team mappings`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    // Normalize team name using mapping
    normalizeTeamName(teamName) {
        if (!teamName) return '';
        const trimmed = teamName.trim();
        return this.teamMapping.get(trimmed) || trimmed;
    }

    // Create match key: "Home v Away"
    createMatchKey(homeTeam, awayTeam) {
        const normalizedHome = this.normalizeTeamName(homeTeam);
        const normalizedAway = this.normalizeTeamName(awayTeam);
        
        if (!normalizedHome || !normalizedAway) return null;
        return `${normalizedHome} v ${normalizedAway}`;
    }

    // Parse date from different formats
    parseDate(dateStr, format = 'match') {
        if (!dateStr) return null;
        
        try {
            if (format === 'match') {
                // Format: "17/08/2024"
                const [day, month, year] = dateStr.split('/');
                return new Date(year, month - 1, day);
            } else {
                // FBRef format: "2024-08-17"
                return new Date(dateStr);
            }
        } catch (error) {
            console.warn(`Failed to parse date: ${dateStr}`);
            return null;
        }
    }

    // Parse match file
    parseMatchFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 10) return null;
        
        try {
            const date = this.parseDate(lines[0], 'match');
            const eventId = lines[1];
            
            // Parse team names around "vs"
            let homeTeam = '', awayTeam = '';
            const vsIndex = lines.findIndex(line => line.toLowerCase() === 'vs');
            
            if (vsIndex > 1) {
                // Construct home team from lines before "vs"
                const homeLines = [];
                for (let i = 2; i < vsIndex; i++) {
                    if (lines[i] && this.isValidTeamName(lines[i])) {
                        homeLines.push(lines[i]);
                    }
                }
                homeTeam = homeLines.join(' ');
                
                // Construct away team from lines after "vs"
                const awayLines = [];
                for (let i = vsIndex + 1; i < Math.min(vsIndex + 4, lines.length); i++) {
                    if (lines[i] && this.isValidTeamName(lines[i]) && !lines[i].includes(':')) {
                        awayLines.push(lines[i]);
                    }
                }
                awayTeam = awayLines.join(' ');
            }

            // Parse scores - take the SECOND occurrence (full-time score)
            let homeScore = null, awayScore = null;
            let colonCount = 0;
            for (let i = 5; i < Math.min(15, lines.length); i++) {
                if (lines[i] === ':' && i > 5 && i < lines.length - 1) {
                    const prevLine = lines[i - 1];
                    const nextLine = lines[i + 1];
                    if (!isNaN(prevLine) && !isNaN(nextLine)) {
                        colonCount++;
                        if (colonCount === 2) {
                            // This is the second colon - full-time score
                            homeScore = parseInt(prevLine);
                            awayScore = parseInt(nextLine);
                            break;
                        }
                    }
                }
            }

            // Extract odds
            const odds = this.extractOdds(lines);
            
            // Extract Asian handicap odds
            const asianHandicapOdds = this.extractAsianHandicapOdds(lines);

            return {
                eventId,
                date,
                homeTeam,
                awayTeam,
                homeScore,
                awayScore,
                asianHandicapOdds,
                ...odds,
                filePath
            };
        } catch (error) {
            console.warn(`Error parsing match file ${filePath}:`, error);
            return null;
        }
    }

    // Helper function to validate team names
    isValidTeamName(name) {
        if (!name || name.length < 2) return false;
        if (name === 'vs' || name === 'Home' || name === 'Away') return false;
        if (/^\d+$/.test(name)) return false;
        if (name.includes(':')) return false;
        return true;
    }

    // Extract odds from match file lines
    extractOdds(lines) {
        const odds = {};
        
        // Look for Home/Away/Draw odds
        const hadIndex = lines.findIndex(line => line === 'Home/Away/Draw');
        if (hadIndex > -1 && hadIndex + 4 < lines.length) {
            try {
                odds.homeWinOdds = parseFloat(lines[hadIndex + 4]);
                odds.drawOdds = parseFloat(lines[hadIndex + 5]);
                odds.awayWinOdds = parseFloat(lines[hadIndex + 6]);
            } catch (e) {
                // Odds parsing failed
            }
        }

        // Look for Over/Under 2.5 goals
        const hiloIndex = lines.findIndex(line => line === 'HiLo');
        if (hiloIndex > -1) {
            for (let i = hiloIndex; i < Math.min(hiloIndex + 20, lines.length); i++) {
                if (lines[i] === '[2.5]' && i + 2 < lines.length) {
                    try {
                        odds.over2_5Odds = parseFloat(lines[i + 1]);
                        odds.under2_5Odds = parseFloat(lines[i + 2]);
                    } catch (e) {
                        // Odds parsing failed
                    }
                    break;
                }
            }
        }

        return odds;
    }

    // Load match data from directory
    async loadMatchData(matchDir) {
        console.log(`Loading match data from: ${matchDir}`);
        
        if (!fs.existsSync(matchDir)) {
            console.warn(`Match directory does not exist: ${matchDir}`);
            return;
        }

        const files = fs.readdirSync(matchDir)
            .filter(file => file.endsWith('.txt'))
            .sort();

        let processedCount = 0;
        for (const file of files) {
            const filePath = path.join(matchDir, file);
            const matchData = this.parseMatchFile(filePath);
            
            if (matchData && matchData.homeTeam && matchData.awayTeam) {
                const matchKey = this.createMatchKey(matchData.homeTeam, matchData.awayTeam);
                
                if (matchKey) {
                    // Initialize if doesn't exist
                    if (!this.resultData[matchKey]) {
                        this.resultData[matchKey] = {};
                    }
                    
                    // Set match as primary data
                    this.resultData[matchKey].match = matchData;
                    processedCount++;
                }
            }
        }

        console.log(`Processed ${processedCount} match files`);
    }

    // Load FBRef data
    async loadFBRefData(fbrefFile) {
        console.log(`Loading FBRef data from: ${fbrefFile}`);
        
        if (!fs.existsSync(fbrefFile)) {
            console.warn(`FBRef file does not exist: ${fbrefFile}`);
            return;
        }

        return new Promise((resolve, reject) => {
            const records = [];
            fs.createReadStream(fbrefFile)
                .pipe(csv())
                .on('data', (row) => {
                    records.push(row);
                })
                .on('end', () => {
                    let joinedCount = 0;
                    
                    records.forEach(record => {
                        const matchKey = this.createMatchKey(record.HomeTeam, record.AwayTeam);
                        
                        if (matchKey && this.resultData[matchKey]) {
                            // Add FBRef data as reference
                            this.resultData[matchKey].fbref = {
                                date: record.Date,
                                week: record.Wk,
                                day: record.Day,
                                time: record.Time,
                                homeGoals: parseInt(record.FTHG) || null,
                                awayGoals: parseInt(record.FTAG) || null,
                                homeXG: parseFloat(record.Home_xG) || null,
                                awayXG: parseFloat(record.Away_xG) || null,
                                referee: record.Referee,
                                venue: record.Venue,
                                attendance: parseInt(record.Attendance) || null
                            };
                            joinedCount++;
                        }
                    });
                    
                    console.log(`Joined ${joinedCount} FBRef records`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    // Process data for a specific year
    async processYear(year) {
        console.log(`\n=== Processing ${year} season ===`);
        
        // Determine season string and paths
        const seasonStr = year === 2024 ? '2024_2025' : 
                         year === 2023 ? '2023_2024' : 
                         year === 2022 ? '2022_2023' : null;
        
        if (!seasonStr) {
            throw new Error(`Unsupported year: ${year}`);
        }
        
        const seasonDirStr = seasonStr.replace('_', '-');
        const matchDir = path.join('data', 'raw', 'matches', seasonDirStr);
        const fbrefFile = path.join('data', 'raw', 'fbref', seasonDirStr, `fbref_${seasonStr}_data.csv`);
        const outputFile = path.join('data', 'processed', `year-${seasonDirStr}.json`);

        // Load team mapping
        await this.loadTeamMapping();
        
        // Load match data (primary)
        await this.loadMatchData(matchDir);
        
        // Load and join FBRef data (reference)
        await this.loadFBRefData(fbrefFile);
        
        // Save results
        await this.saveResults(outputFile);
        
        console.log(`\n=== Completed processing for ${year} ===`);
    }

    // Helper function to calculate Asian handicap
    calculateAsianHandicap(match, fbref) {
        if (!match || !fbref || match.homeScore === undefined || match.awayScore === undefined) {
            return {};
        }

        const actualHomeGoals = match.homeScore;
        const actualAwayGoals = match.awayScore;
        const goalDiff = actualHomeGoals - actualAwayGoals;
        
        // Common Asian handicap lines
        const lines = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
        const results = {};
        
        lines.forEach(line => {
            const adjustedHomeDiff = goalDiff + line;
            
            let result;
            if (adjustedHomeDiff > 0) {
                result = 'home_win';
            } else if (adjustedHomeDiff < 0) {
                result = 'away_win';
            } else if (adjustedHomeDiff === 0) {
                // Half lines can't be draws
                if (line % 1 === 0.5) {
                    result = goalDiff > 0 ? 'home_win' : 'away_win';
                } else {
                    result = 'draw';
                }
            }
            
            results[`line_${line.toString().replace('-', 'minus_').replace('.', '_')}`] = result;
        });
        
        return results;
    }

    // Calculate market efficiency indicators
    calculateMarketEfficiency(match) {
        if (!match.homeWinOdds || !match.drawOdds || !match.awayWinOdds) {
            return {};
        }

        const homeImplied = 1 / match.homeWinOdds;
        const drawImplied = 1 / match.drawOdds;
        const awayImplied = 1 / match.awayWinOdds;
        const totalImplied = homeImplied + drawImplied + awayImplied;
        
        const cutPercentage = ((totalImplied - 1) * 100);
        
        return {
            homeImpliedProb: homeImplied,
            drawImpliedProb: drawImplied,
            awayImpliedProb: awayImplied,
            totalImpliedProb: totalImplied,
            cutPercentage: cutPercentage,
            fairHomeOdds: 1 / (homeImplied / (totalImplied - cutPercentage / 100)),
            fairDrawOdds: 1 / (drawImplied / (totalImplied - cutPercentage / 100)),
            fairAwayOdds: 1 / (awayImplied / (totalImplied - cutPercentage / 100))
        };
    }

    // Calculate performance metrics using xG
    calculatePerformanceMetrics(match, fbref) {
        if (!fbref || !fbref.homeXG || !fbref.awayXG) {
            return {};
        }

        const homeXG = fbref.homeXG;
        const awayXG = fbref.awayXG;
        const homeGoals = match.homeScore;
        const awayGoals = match.awayScore;
        
        const homeOverperformance = homeGoals - homeXG;
        const awayOverperformance = awayGoals - awayXG;
        
        const homeEfficiency = homeXG > 0 ? homeGoals / homeXG : 0;
        const awayEfficiency = awayXG > 0 ? awayGoals / awayXG : 0;
        
        return {
            homeXGDiff: homeOverperformance,
            awayXGDiff: awayOverperformance,
            homeEfficiency: homeEfficiency,
            awayEfficiency: awayEfficiency,
            totalXG: homeXG + awayXG,
            totalGoals: homeGoals + awayGoals,
            xgAccuracy: Math.abs((homeXG + awayXG) - (homeGoals + awayGoals))
        };
    }

    // Extract Asian Handicap odds from match file
    extractAsianHandicapOdds(lines) {
        const handicapIndex = lines.findIndex(line => line === 'Handicap');
        if (handicapIndex === -1) return {};

        const odds = {};
        
        // Look for handicap data after "Handicap" line
        for (let i = handicapIndex + 1; i < Math.min(handicapIndex + 20, lines.length); i++) {
            const line = lines[i];
            
            // Skip team names and "Last Odds" sections
            if (line.includes('Last Odds') || line === 'Same Game All Up') break;
            if (line.includes('(Home)') || line.includes('(Away)')) continue;
            
            // Look for handicap lines like [-1/-1.5], [+1/+1.5], [0/+0.5], [0/-0.5]
            if (line.startsWith('[') && line.endsWith(']') && i + 1 < lines.length) {
                const handicapLine = line.replace(/[\[\]]/g, '');
                const oddsValue = parseFloat(lines[i + 1]);
                
                if (!isNaN(oddsValue)) {
                    // Assign first handicap to home team, second to away team
                    if (!odds.homeHandicap) {
                        odds.homeHandicap = handicapLine;
                        odds.homeOdds = oddsValue;
                    } else if (!odds.awayHandicap) {
                        odds.awayHandicap = handicapLine;
                        odds.awayOdds = oddsValue;
                    }
                }
            }
        }
        
        return odds;
    }

    // Parse handicap line to get numeric value
    parseHandicapLine(handicapStr) {
        if (!handicapStr) return 0;
        
        // Handle formats like "-1/-1.5" or "+1/+1.5"
        const cleanHandicap = handicapStr.replace(/[\[\]]/g, '');
        
        if (cleanHandicap.includes('/')) {
            // Split handicap (quarter line)
            const parts = cleanHandicap.split('/').map(p => parseFloat(p));
            return parts.reduce((a, b) => a + b, 0) / parts.length; // Average
        } else {
            return parseFloat(cleanHandicap) || 0;
        }
    }

    // Calculate Asian handicap betting results for $100 bets
    calculateAsianHandicapBetting(match, fbref, asianHandicapOdds) {
        if (!match || !fbref || !asianHandicapOdds.homeHandicap || !asianHandicapOdds.awayHandicap) {
            return {};
        }

        const actualHomeGoals = match.homeScore;
        const actualAwayGoals = match.awayScore;
        const goalDiff = actualHomeGoals - actualAwayGoals;
        
        const homeHandicap = this.parseHandicapLine(asianHandicapOdds.homeHandicap);
        const awayHandicap = this.parseHandicapLine(asianHandicapOdds.awayHandicap);
        const homeOdds = asianHandicapOdds.homeOdds;
        const awayOdds = asianHandicapOdds.awayOdds;
        
        // Calculate adjusted results
        const homeAdjustedDiff = goalDiff + homeHandicap;
        const awayAdjustedDiff = -goalDiff + awayHandicap;
        
        // Determine results for home bet
        let homeResult, awayResult;
        
        if (Math.abs(homeAdjustedDiff) === 0.25) {
            // Quarter line - half win/loss
            homeResult = homeAdjustedDiff > 0 ? 'half-win' : 'half-loss';
        } else if (homeAdjustedDiff > 0) {
            homeResult = 'win';
        } else if (homeAdjustedDiff < 0) {
            homeResult = 'loss';
        } else {
            homeResult = 'push';
        }
        
        if (Math.abs(awayAdjustedDiff) === 0.25) {
            // Quarter line - half win/loss  
            awayResult = awayAdjustedDiff > 0 ? 'half-win' : 'half-loss';
        } else if (awayAdjustedDiff > 0) {
            awayResult = 'win';
        } else if (awayAdjustedDiff < 0) {
            awayResult = 'loss';
        } else {
            awayResult = 'push';
        }
        
        // Calculate $100 bet returns
        const calculateReturn = (result, odds) => {
            const base = 100;
            switch (result) {
                case 'win':
                    return base * odds;
                case 'half-win':
                    return base / 2 + (base / 2) * odds;
                case 'half-loss':
                    return base / 2;
                case 'loss':
                    return 0;
                case 'push':
                default:
                    return base;
            }
        };
        
        return {
            homeHandicap: asianHandicapOdds.homeHandicap,
            awayHandicap: asianHandicapOdds.awayHandicap,
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            homeResult: homeResult,
            awayResult: awayResult,
            homeBet100Return: calculateReturn(homeResult, homeOdds),
            awayBet100Return: calculateReturn(awayResult, awayOdds),
            homeProfit: calculateReturn(homeResult, homeOdds) - 100,
            awayProfit: calculateReturn(awayResult, awayOdds) - 100,
            cutPercentage: ((1/homeOdds + 1/awayOdds - 1) * 100).toFixed(2)
        };
    }

    // Add enhanced data to match (restructured with proper categorization)
    enhanceMatchData(matchData) {
        if (!matchData.match || !matchData.fbref) {
            return matchData;
        }

        const asianHandicapBetting = this.calculateAsianHandicapBetting(
            matchData.match, 
            matchData.fbref, 
            matchData.match.asianHandicapOdds || {}
        );

        // PRE-MATCH: Predictive analysis (available before match)
        const preMatch = {
            marketEfficiency: this.calculateMarketEfficiency(matchData.match),
            asianHandicapOdds: matchData.match.asianHandicapOdds || {},
            venue: {
                name: matchData.fbref.venue,
                attendance: matchData.fbref.attendance,
                homeAdvantage: this.calculateHomeAdvantage(matchData.fbref.venue)
            },
            referee: {
                name: matchData.fbref.referee,
                impact: this.calculateRefereeImpact(matchData.fbref.referee)
            },
            xgExpected: {
                homeXG: matchData.fbref.homeXG,
                awayXG: matchData.fbref.awayXG,
                totalXG: (matchData.fbref.homeXG || 0) + (matchData.fbref.awayXG || 0),
                xgLine: (matchData.fbref.homeXG || 0) - (matchData.fbref.awayXG || 0)
            }
        };

        // POST-MATCH: Result-dependent analysis (only after match completion)
        const postMatch = {
            asianHandicapResults: this.calculateAsianHandicap(matchData.match, matchData.fbref),
            bettingOutcomes: {
                ...asianHandicapBetting,
                hadResult: this.calculateHADResult(matchData.match),
                ouResult: this.calculateOUResult(matchData.match)
            },
            performance: this.calculatePerformanceMetrics(matchData.match, matchData.fbref),
            actualResults: {
                homeGoals: matchData.match.homeScore,
                awayGoals: matchData.match.awayScore,
                totalGoals: matchData.match.homeScore + matchData.match.awayScore,
                goalDifference: matchData.match.homeScore - matchData.match.awayScore,
                result: matchData.match.homeScore > matchData.match.awayScore ? 'home' : 
                       matchData.match.homeScore < matchData.match.awayScore ? 'away' : 'draw'
            }
        };

        // METADATA: Technical info
        const metadata = {
            hasXGData: !!(matchData.fbref.homeXG && matchData.fbref.awayXG),
            hasOddsData: !!(matchData.match.homeWinOdds && matchData.match.drawOdds && matchData.match.awayWinOdds),
            hasAsianHandicapOdds: !!(matchData.match.asianHandicapOdds && matchData.match.asianHandicapOdds.homeOdds),
            matchWeek: matchData.fbref.week,
            matchDay: matchData.fbref.day
        };

        return {
            ...matchData,
            enhanced: {
                preMatch,
                postMatch,
                metadata
            }
        };
    }

    // Calculate HAD (Home/Away/Draw) result
    calculateHADResult(match) {
        if (match.homeScore > match.awayScore) return 'home';
        if (match.homeScore < match.awayScore) return 'away';
        return 'draw';
    }

    // Calculate Over/Under result
    calculateOUResult(match) {
        const totalGoals = match.homeScore + match.awayScore;
        return {
            over2_5: totalGoals > 2.5 ? 'over' : 'under',
            over3_5: totalGoals > 3.5 ? 'over' : 'under',
            totalGoals: totalGoals
        };
    }

    // Calculate home advantage based on venue
    calculateHomeAdvantage(venue) {
        // Simple venue-based home advantage calculation
        const venueAdvantage = {
            'Old Trafford': 0.15,
            'Anfield': 0.18,
            'Emirates Stadium': 0.12,
            'Stamford Bridge': 0.14,
            'Etihad Stadium': 0.13,
            'Tottenham Hotspur Stadium': 0.11
        };
        return venueAdvantage[venue] || 0.10; // Default 10% home advantage
    }

    // Calculate referee impact
    calculateRefereeImpact(referee) {
        // Simple referee impact calculation (could be enhanced with historical data)
        const refereeImpact = {
            'Michael Oliver': 0.05,
            'Anthony Taylor': 0.03,
            'Martin Atkinson': 0.02,
            'Craig Pawson': 0.04
        };
        return refereeImpact[referee] || 0.03; // Default 3% impact
    }

    // Calculate time-series and streak analysis
    calculateTimeSeriesAnalysis(allMatches) {
        const teamStats = {};
        
        // Sort matches by date
        const sortedMatches = Object.entries(allMatches)
            .map(([key, match]) => ({ key, ...match }))
            .sort((a, b) => new Date(a.match.date) - new Date(b.match.date));

        sortedMatches.forEach((matchData, index) => {
            const homeTeam = matchData.match.homeTeam;
            const awayTeam = matchData.match.awayTeam;
            const matchKey = matchData.key;
            
            // Initialize team stats if not exists
            if (!teamStats[homeTeam]) teamStats[homeTeam] = this.initializeTeamStats();
            if (!teamStats[awayTeam]) teamStats[awayTeam] = this.initializeTeamStats();
            
            // Calculate league positions before this match
            const leaguePositions = this.calculateLeaguePositions(teamStats);
            
            // Calculate pre-match analytics (available before this match)
            const homePreMatch = this.calculatePreMatchAnalytics(teamStats[homeTeam], 'home', leaguePositions[homeTeam]);
            const awayPreMatch = this.calculatePreMatchAnalytics(teamStats[awayTeam], 'away', leaguePositions[awayTeam]);
            
            // Store pre-match analytics directly in the allMatches object
            allMatches[matchKey].timeSeries = {
                home: homePreMatch,
                away: awayPreMatch
            };
            
            // Update streaks and patterns (after calculating pre-match data)
            this.updateTeamStreaks(teamStats[homeTeam], matchData, 'home');
            this.updateTeamStreaks(teamStats[awayTeam], matchData, 'away');
        });

        return teamStats;
    }

    // Initialize team statistics structure
    initializeTeamStats() {
        return {
            matches: [],
            streaks: {
                // Overall streaks
                current: { type: null, count: 0 },
                longest: { win: 0, loss: 0, draw: 0 },
                form: [], // Last 5 matches
                
                // Home/Away specific streaks
                home: {
                    current: { type: null, count: 0 },
                    longest: { win: 0, loss: 0, draw: 0 },
                    form: []
                },
                away: {
                    current: { type: null, count: 0 },
                    longest: { win: 0, loss: 0, draw: 0 },
                    form: []
                },
                
                // Market-specific streaks
                asianHandicap: {
                    current: { type: null, count: 0 },
                    longest: { win: 0, loss: 0 },
                    form: []
                },
                overUnder: {
                    current: { type: null, count: 0 },
                    longest: { over: 0, under: 0 },
                    form: []
                }
            },
            cumulative: {
                // Running totals (available before each match)
                xGFor: 0,
                xGAgainst: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                
                // League position tracking
                points: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                
                // Market performance
                asianHandicapWins: 0,
                asianHandicapLosses: 0,
                overWins: 0,
                underWins: 0,
                
                // Venue specific
                homeGoalsFor: 0,
                homeGoalsAgainst: 0,
                awayGoalsFor: 0,
                awayGoalsAgainst: 0,
                
                homeXGFor: 0,
                homeXGAgainst: 0,
                awayXGFor: 0,
                awayXGAgainst: 0
            },
            patterns: {
                homeWinRate: 0,
                awayWinRate: 0,
                overUnderTrend: [],
                asianHandicapSuccess: 0,
                
                // Advanced patterns
                firstHalfTrend: [],
                scoringPatterns: {
                    earlyGoals: 0, // Goals in first 15 mins
                    lateGoals: 0   // Goals after 75 mins
                },
                venuePerformance: {
                    homeXGDiff: 0,
                    awayXGDiff: 0
                }
            },
            performance: {
                avgXG: 0,
                avgXGAgainst: 0,
                avgGoals: 0,
                avgGoalsAgainst: 0,
                
                // Rolling averages (last 5 games)
                recent: {
                    avgXG: 0,
                    avgXGAgainst: 0,
                    avgGoals: 0,
                    avgGoalsAgainst: 0
                }
            }
        };
    }

    // Update team streaks and patterns
    updateTeamStreaks(teamStats, matchData, venue) {
        const isHome = venue === 'home';
        const teamGoals = isHome ? matchData.match.homeScore : matchData.match.awayScore;
        const opponentGoals = isHome ? matchData.match.awayScore : matchData.match.homeScore;
        
        let result;
        if (teamGoals > opponentGoals) result = 'win';
        else if (teamGoals < opponentGoals) result = 'loss';
        else result = 'draw';
        
        // Update current streak
        if (teamStats.streaks.current.type === result) {
            teamStats.streaks.current.count++;
        } else {
            teamStats.streaks.current = { type: result, count: 1 };
        }
        
        // Update longest streaks
        if (teamStats.streaks.current.count > teamStats.streaks.longest[result]) {
            teamStats.streaks.longest[result] = teamStats.streaks.current.count;
        }
        
        // Update form (last 5 matches)
        teamStats.streaks.form.push(result);
        if (teamStats.streaks.form.length > 5) {
            teamStats.streaks.form.shift();
        }
        
        // Update venue-specific streaks
        const venueStreaks = teamStats.streaks[venue];
        if (venueStreaks.current.type === result) {
            venueStreaks.current.count++;
        } else {
            venueStreaks.current = { type: result, count: 1 };
        }
        
        if (venueStreaks.current.count > venueStreaks.longest[result]) {
            venueStreaks.longest[result] = venueStreaks.current.count;
        }
        
        venueStreaks.form.push(result);
        if (venueStreaks.form.length > 5) {
            venueStreaks.form.shift();
        }
        
        // Update Asian Handicap streaks (if data available)
        if (matchData.enhanced && matchData.enhanced.asianHandicapBetting) {
            const ahResult = matchData.enhanced.asianHandicapBetting.homeResult === 'win' ? 'win' : 'loss';
            const ahStreaks = teamStats.streaks.asianHandicap;
            
            if (ahStreaks.current.type === ahResult) {
                ahStreaks.current.count++;
            } else {
                ahStreaks.current = { type: ahResult, count: 1 };
            }
            
            if (ahStreaks.current.count > ahStreaks.longest[ahResult]) {
                ahStreaks.longest[ahResult] = ahStreaks.current.count;
            }
            
            ahStreaks.form.push(ahResult);
            if (ahStreaks.form.length > 5) {
                ahStreaks.form.shift();
            }
            
            // Update cumulative AH performance
            if (ahResult === 'win') {
                teamStats.cumulative.asianHandicapWins++;
            } else {
                teamStats.cumulative.asianHandicapLosses++;
            }
        }
        
        // Update Over/Under streaks
        const totalGoals = teamGoals + opponentGoals;
        const ouResult = totalGoals > 2.5 ? 'over' : 'under';
        const ouStreaks = teamStats.streaks.overUnder;
        
        if (ouStreaks.current.type === ouResult) {
            ouStreaks.current.count++;
        } else {
            ouStreaks.current = { type: ouResult, count: 1 };
        }
        
        if (ouStreaks.current.count > ouStreaks.longest[ouResult]) {
            ouStreaks.longest[ouResult] = ouStreaks.current.count;
        }
        
        ouStreaks.form.push(ouResult);
        if (ouStreaks.form.length > 5) {
            ouStreaks.form.shift();
        }
        
        // Update cumulative O/U performance
        if (ouResult === 'over') {
            teamStats.cumulative.overWins++;
        } else {
            teamStats.cumulative.underWins++;
        }
        
        // Update cumulative statistics
        const teamXG = isHome ? (matchData.fbref?.homeXG || 0) : (matchData.fbref?.awayXG || 0);
        const opponentXG = isHome ? (matchData.fbref?.awayXG || 0) : (matchData.fbref?.homeXG || 0);
        
        teamStats.cumulative.xGFor += teamXG;
        teamStats.cumulative.xGAgainst += opponentXG;
        teamStats.cumulative.goalsFor += teamGoals;
        teamStats.cumulative.goalsAgainst += opponentGoals;
        
        // Update league points and record
        if (result === 'win') {
            teamStats.cumulative.points += 3;
            teamStats.cumulative.wins += 1;
        } else if (result === 'draw') {
            teamStats.cumulative.points += 1;
            teamStats.cumulative.draws += 1;
        } else {
            teamStats.cumulative.losses += 1;
        }
        
        // Update venue-specific cumulative stats
        if (venue === 'home') {
            teamStats.cumulative.homeXGFor += teamXG;
            teamStats.cumulative.homeXGAgainst += opponentXG;
            teamStats.cumulative.homeGoalsFor += teamGoals;
            teamStats.cumulative.homeGoalsAgainst += opponentGoals;
        } else {
            teamStats.cumulative.awayXGFor += teamXG;
            teamStats.cumulative.awayXGAgainst += opponentXG;
            teamStats.cumulative.awayGoalsFor += teamGoals;
            teamStats.cumulative.awayGoalsAgainst += opponentGoals;
        }
        
        // Add match to history
        teamStats.matches.push({
            date: matchData.match.date,
            opponent: isHome ? matchData.match.awayTeam : matchData.match.homeTeam,
            venue: venue,
            result: result,
            goals: teamGoals,
            goalsAgainst: opponentGoals,
            xG: teamXG,
            xGAgainst: opponentXG
        });
    }

    // Calculate league positions based on current points
    calculateLeaguePositions(teamStats) {
        // Get all teams with their points, goal difference, and goals for
        const teamsWithPoints = Object.entries(teamStats).map(([teamName, stats]) => ({
            team: teamName,
            points: stats.cumulative.points,
            goalDifference: stats.cumulative.goalsFor - stats.cumulative.goalsAgainst,
            goalsFor: stats.cumulative.goalsFor,
            matchesPlayed: stats.matches.length
        }));
        
        // Sort by points (desc), then goal difference (desc), then goals for (desc)
        teamsWithPoints.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
        
        // Assign positions (teams with same points get same position)
        const positions = {};
        let currentPosition = 1;
        let teamsAtPosition = 0;
        let lastPoints = null;
        let lastGD = null;
        let lastGF = null;
        
        teamsWithPoints.forEach((teamData, index) => {
            // If points, GD, and GF are all the same as previous team, same position
            if (lastPoints === teamData.points && 
                lastGD === teamData.goalDifference && 
                lastGF === teamData.goalsFor) {
                positions[teamData.team] = currentPosition;
                teamsAtPosition++;
            } else {
                // New position = previous position + number of teams at that position
                currentPosition += teamsAtPosition;
                positions[teamData.team] = currentPosition;
                teamsAtPosition = 1;
            }
            
            lastPoints = teamData.points;
            lastGD = teamData.goalDifference;
            lastGF = teamData.goalsFor;
        });
        
        return positions;
    }

    // Calculate pre-match analytics (available before the match starts)
    calculatePreMatchAnalytics(teamStats, venue, leaguePosition = null) {
        const matches = teamStats.matches;
        const totalMatches = matches.length;
        
        if (totalMatches === 0) {
            return {
                matchesPlayed: 0,
                venueMatches: 0,
                leaguePosition: null, // First match of season
                streaks: { 
                    overall: { current: null, longest: {}, form: [] },
                    venue: null,
                    asianHandicap: { current: null, longest: {}, form: [] },
                    overUnder: { current: null, longest: {}, form: [] }
                },
                cumulative: { 
                    overall: { 
                        xGFor: 0, xGAgainst: 0, goalsFor: 0, goalsAgainst: 0, 
                        goalDifference: 0, xGDifference: 0,
                        points: 0, wins: 0, draws: 0, losses: 0, matchesPlayed: 0
                    },
                    venue: null,
                    markets: { 
                        asianHandicapWins: 0, asianHandicapLosses: 0, asianHandicapWinRate: 0,
                        overWins: 0, underWins: 0, overRate: 0
                    }
                },
                averages: { 
                    overall: { xGFor: 0, xGAgainst: 0, goalsFor: 0, goalsAgainst: 0 },
                    venue: null,
                    recent: { xGFor: 0, xGAgainst: 0, goalsFor: 0, goalsAgainst: 0 },
                    recentVenue: { xGFor: 0, xGAgainst: 0, goalsFor: 0, goalsAgainst: 0 }
                },
                patterns: { 
                    winRate: 0, venueWinRate: 0,
                    cleanSheets: 0, cleanSheetRate: 0,
                    failedToScore: 0, failedToScoreRate: 0,
                    xGEfficiency: 0, xGDefensiveEfficiency: 0,
                    asianHandicapSuccess: 0, overRate: 0
                }
            };
        }
        
        // Get venue-specific matches
        const venueMatches = venue === 'all' ? matches : matches.filter(m => m.venue === venue);
        const venueMatchCount = venueMatches.length;
        
        // Recent form (last 5 matches)
        const recentMatches = matches.slice(-5);
        const recentVenueMatches = venueMatches.slice(-5);
        
        return {
            matchesPlayed: totalMatches,
            venueMatches: venueMatchCount,
            
            // League position (before this match)
            leaguePosition: leaguePosition || (totalMatches === 0 ? null : 'unranked'),
            
            // Current streaks (overall and venue-specific)
            streaks: {
                overall: {
                    current: { ...teamStats.streaks.current },
                    longest: { ...teamStats.streaks.longest },
                    form: [...teamStats.streaks.form]
                },
                venue: venue !== 'all' ? {
                    current: { ...teamStats.streaks[venue].current },
                    longest: { ...teamStats.streaks[venue].longest },
                    form: [...teamStats.streaks[venue].form]
                } : null,
                asianHandicap: {
                    current: { ...teamStats.streaks.asianHandicap.current },
                    longest: { ...teamStats.streaks.asianHandicap.longest },
                    form: [...teamStats.streaks.asianHandicap.form]
                },
                overUnder: {
                    current: { ...teamStats.streaks.overUnder.current },
                    longest: { ...teamStats.streaks.overUnder.longest },
                    form: [...teamStats.streaks.overUnder.form]
                }
            },
            
            // Cumulative statistics (running totals before this match)
            cumulative: {
                overall: {
                    xGFor: teamStats.cumulative.xGFor,
                    xGAgainst: teamStats.cumulative.xGAgainst,
                    goalsFor: teamStats.cumulative.goalsFor,
                    goalsAgainst: teamStats.cumulative.goalsAgainst,
                    goalDifference: teamStats.cumulative.goalsFor - teamStats.cumulative.goalsAgainst,
                    xGDifference: teamStats.cumulative.xGFor - teamStats.cumulative.xGAgainst,
                    
                    // League record
                    points: teamStats.cumulative.points,
                    wins: teamStats.cumulative.wins,
                    draws: teamStats.cumulative.draws,
                    losses: teamStats.cumulative.losses,
                    matchesPlayed: teamStats.cumulative.wins + teamStats.cumulative.draws + teamStats.cumulative.losses
                },
                venue: venue !== 'all' ? {
                    xGFor: venue === 'home' ? teamStats.cumulative.homeXGFor : teamStats.cumulative.awayXGFor,
                    xGAgainst: venue === 'home' ? teamStats.cumulative.homeXGAgainst : teamStats.cumulative.awayXGAgainst,
                    goalsFor: venue === 'home' ? teamStats.cumulative.homeGoalsFor : teamStats.cumulative.awayGoalsFor,
                    goalsAgainst: venue === 'home' ? teamStats.cumulative.homeGoalsAgainst : teamStats.cumulative.awayGoalsAgainst
                } : null,
                markets: {
                    asianHandicapWins: teamStats.cumulative.asianHandicapWins,
                    asianHandicapLosses: teamStats.cumulative.asianHandicapLosses,
                    asianHandicapWinRate: teamStats.cumulative.asianHandicapWins + teamStats.cumulative.asianHandicapLosses > 0 ? 
                        teamStats.cumulative.asianHandicapWins / (teamStats.cumulative.asianHandicapWins + teamStats.cumulative.asianHandicapLosses) : 0,
                    overWins: teamStats.cumulative.overWins,
                    underWins: teamStats.cumulative.underWins,
                    overRate: teamStats.cumulative.overWins + teamStats.cumulative.underWins > 0 ?
                        teamStats.cumulative.overWins / (teamStats.cumulative.overWins + teamStats.cumulative.underWins) : 0
                }
            },
            
            // Averages per game (before this match)
            averages: {
                overall: {
                    xGFor: totalMatches > 0 ? teamStats.cumulative.xGFor / totalMatches : 0,
                    xGAgainst: totalMatches > 0 ? teamStats.cumulative.xGAgainst / totalMatches : 0,
                    goalsFor: totalMatches > 0 ? teamStats.cumulative.goalsFor / totalMatches : 0,
                    goalsAgainst: totalMatches > 0 ? teamStats.cumulative.goalsAgainst / totalMatches : 0
                },
                venue: venue !== 'all' && venueMatchCount > 0 ? {
                    xGFor: venue === 'home' ? teamStats.cumulative.homeXGFor / venueMatchCount : teamStats.cumulative.awayXGFor / venueMatchCount,
                    xGAgainst: venue === 'home' ? teamStats.cumulative.homeXGAgainst / venueMatchCount : teamStats.cumulative.awayXGAgainst / venueMatchCount,
                    goalsFor: venue === 'home' ? teamStats.cumulative.homeGoalsFor / venueMatchCount : teamStats.cumulative.awayGoalsFor / venueMatchCount,
                    goalsAgainst: venue === 'home' ? teamStats.cumulative.homeGoalsAgainst / venueMatchCount : teamStats.cumulative.awayGoalsAgainst / venueMatchCount
                } : null,
                recent: this.calculateRecentAverages(recentMatches),
                recentVenue: this.calculateRecentAverages(recentVenueMatches)
            },
            
            // Performance patterns
            patterns: {
                winRate: totalMatches > 0 ? matches.filter(m => m.result === 'win').length / totalMatches : 0,
                venueWinRate: venueMatchCount > 0 ? venueMatches.filter(m => m.result === 'win').length / venueMatchCount : 0,
                
                // Scoring patterns
                cleanSheets: matches.filter(m => m.goalsAgainst === 0).length,
                cleanSheetRate: totalMatches > 0 ? matches.filter(m => m.goalsAgainst === 0).length / totalMatches : 0,
                
                failedToScore: matches.filter(m => m.goals === 0).length,
                failedToScoreRate: totalMatches > 0 ? matches.filter(m => m.goals === 0).length / totalMatches : 0,
                
                // xG efficiency
                xGEfficiency: teamStats.cumulative.xGFor > 0 ? teamStats.cumulative.goalsFor / teamStats.cumulative.xGFor : 0,
                xGDefensiveEfficiency: teamStats.cumulative.xGAgainst > 0 ? 1 - (teamStats.cumulative.goalsAgainst / teamStats.cumulative.xGAgainst) : 0,
                
                // Market success rates
                asianHandicapSuccess: teamStats.cumulative.asianHandicapWins + teamStats.cumulative.asianHandicapLosses > 0 ?
                    teamStats.cumulative.asianHandicapWins / (teamStats.cumulative.asianHandicapWins + teamStats.cumulative.asianHandicapLosses) : 0,
                
                overRate: teamStats.cumulative.overWins + teamStats.cumulative.underWins > 0 ?
                    teamStats.cumulative.overWins / (teamStats.cumulative.overWins + teamStats.cumulative.underWins) : 0
            }
        };
    }

    // Calculate recent averages for a set of matches
    calculateRecentAverages(matches) {
        if (matches.length === 0) {
            return { xGFor: 0, xGAgainst: 0, goalsFor: 0, goalsAgainst: 0 };
        }
        
        const totals = matches.reduce((acc, match) => ({
            xGFor: acc.xGFor + (match.xG || 0),
            xGAgainst: acc.xGAgainst + (match.xGAgainst || 0),
            goalsFor: acc.goalsFor + match.goals,
            goalsAgainst: acc.goalsAgainst + match.goalsAgainst
        }), { xGFor: 0, xGAgainst: 0, goalsFor: 0, goalsAgainst: 0 });
        
        const count = matches.length;
        return {
            xGFor: totals.xGFor / count,
            xGAgainst: totals.xGAgainst / count,
            goalsFor: totals.goalsFor / count,
            goalsAgainst: totals.goalsAgainst / count
        };
    }

    // Save results to JSON (updated to include time-series analysis)
    async saveResults(outputPath) {
        console.log(`Saving enhanced results to: ${outputPath}`);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // First enhance all match data
        const enhancedMatches = {};
        Object.keys(this.resultData).forEach(key => {
            enhancedMatches[key] = this.enhanceMatchData(this.resultData[key]);
        });
        
        // Calculate time-series analysis (this adds timeSeries to each match)
        const timeSeriesAnalysis = this.calculateTimeSeriesAnalysis(enhancedMatches);
        
        // The enhancedMatches now have timeSeries data embedded in each match
        
        // Calculate statistics
        const totalMatches = Object.keys(enhancedMatches).length;
        const matchesWithFBRef = Object.values(enhancedMatches).filter(match => match.fbref).length;
        const matchesWithEnhancements = Object.values(enhancedMatches).filter(match => match.enhanced).length;
        
        const output = {
            metadata: {
                totalMatches,
                matchesWithFBRef,
                matchesWithoutFBRef: totalMatches - matchesWithFBRef,
                matchesWithEnhancements,
                generatedAt: new Date().toISOString(),
                structure: {
                    preMatch: "Predictive analysis available before match",
                    postMatch: "Result-dependent analysis only after match completion",
                    timeSeries: "Team streaks, patterns, and historical performance"
                }
            },
            matches: enhancedMatches,
            timeSeries: timeSeriesAnalysis
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        
        console.log(`Enhanced results saved successfully!`);
        console.log(`- Total matches: ${totalMatches}`);
        console.log(`- With FBRef data: ${matchesWithFBRef}`);
        console.log(`- With enhancements: ${matchesWithEnhancements}`);
        console.log(`- Teams with time-series data: ${Object.keys(timeSeriesAnalysis).length}`);
        console.log(`- Without FBRef data: ${totalMatches - matchesWithFBRef}`);
    }
}

// Main execution
async function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node merge-football-data-json.js <year>');
        console.log('Example: node merge-football-data-json.js 2024');
        process.exit(1);
    }

    const year = parseInt(process.argv[2]);
    const merger = new FootballDataJsonMerger();
    
    try {
        await merger.processYear(year);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main(); 