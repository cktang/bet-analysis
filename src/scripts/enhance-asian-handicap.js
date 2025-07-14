const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class AsianHandicapEnhancer {
    constructor() {
        this.enhancedData = {};
        this.fbrefIncidentData = {};
    }

    // Load FBRef incident data for all seasons
    loadFBRefIncidentData() {
        console.log('Loading FBRef incident data...');
        
        const fbrefDir = 'data/raw/fbref';
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        
        seasons.forEach(season => {
            const seasonDir = path.join(fbrefDir, season);
            if (!fs.existsSync(seasonDir)) {
                console.log(`Warning: FBRef directory not found: ${seasonDir}`);
                return;
            }
            
            const files = fs.readdirSync(seasonDir).filter(f => f.endsWith('.json'));
            console.log(`Loading ${files.length} FBRef incident files for ${season}`);
            
            files.forEach(file => {
                try {
                    const filePath = path.join(seasonDir, file);
                    const incidentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    // Create a key to match with processed data
                    const matchKey = this.createMatchKey(incidentData.homeTeam, incidentData.awayTeam);
                    
                    if (!this.fbrefIncidentData[season]) {
                        this.fbrefIncidentData[season] = {};
                    }
                    
                    this.fbrefIncidentData[season][matchKey] = incidentData;
                } catch (error) {
                    console.warn(`Error loading ${file}:`, error.message);
                }
            });
        });
        
        const totalLoaded = Object.values(this.fbrefIncidentData)
            .reduce((sum, season) => sum + Object.keys(season).length, 0);
        console.log(`Loaded ${totalLoaded} FBRef incident files total`);
    }

    // Create match key for linking data
    createMatchKey(homeTeam, awayTeam) {
        // Normalize team names to match the format used in processed data
        const normalize = (team) => {
            return team
                .replace(/\s+/g, ' ')
                .replace('Manchester United', 'Manchester Utd')
                .replace('Newcastle United', 'Newcastle Utd')
                .replace('Wolverhampton Wanderers', 'Wolverhampton')
                .replace('Brighton & Hove Albion', 'Brighton')
                .replace('Brighton & Hove Albion', 'Brighton')
                .trim();
        };
        
        return `${normalize(homeTeam)} v ${normalize(awayTeam)}`;
    }

    // Convert handicap string to numerical value (from HKJC parser)
    handicapConverter(handicap) {
        if (!handicap) return null;
        handicap = handicap.split(/(?=\[)/g)[1] || handicap;
        handicap = handicap.replace(/[\[\]]/g, '');
        handicap = handicap.split('/');
        handicap = handicap.map(h => Number(h));
        return _(handicap).mean();
    }

    // Calculate cut percentage for odds (how much bookmaker is taking)
    findCut(values) {
        const sum = _(values).map((n) => 1 / Number(n)).sum();
        return _.round(100 * (sum - 1), 2);
    }

    // Enhanced match analysis functions
    createEnhancedCalculators() {
        return {
            // Basic match metrics
            line: (match) => match.fbref.homeGoals - match.fbref.awayGoals,
            
            hiLo: (match) => match.fbref.homeGoals + match.fbref.awayGoals,

            // Home/Away/Draw cut percentage
            hadCut: (match) => {
                const odds = [match.match.homeWinOdds, match.match.drawOdds, match.match.awayWinOdds];
                return this.findCut(odds.filter(o => o && o > 0));
            },

            // Over/Under cut percentage  
            ouCut: (match) => {
                const odds = [match.match.over2_5Odds, match.match.under2_5Odds];
                return this.findCut(odds.filter(o => o && o > 0));
            },

            // Match result classification
            result: (match) => {
                const line = match.fbref.homeGoals - match.fbref.awayGoals;
                if (line > 0) return "home";
                if (line < 0) return "away";
                return "draw";
            },

            // Odd/Even result
            oe: (match) => {
                return (match.fbref.homeGoals + match.fbref.awayGoals) % 2 === 0 ? "even" : "odd";
            },

            // xG-based analysis
            xgLine: (match) => {
                if (match.fbref.homeXG && match.fbref.awayXG) {
                    return match.fbref.homeXG - match.fbref.awayXG;
                }
                return null;
            },

            xgTotal: (match) => {
                if (match.fbref.homeXG && match.fbref.awayXG) {
                    return match.fbref.homeXG + match.fbref.awayXG;
                }
                return null;
            },

            // Implied probabilities from odds
            homeImpliedProb: (match) => {
                return match.match.homeWinOdds ? _.round(100 / match.match.homeWinOdds, 2) : null;
            },

            drawImpliedProb: (match) => {
                return match.match.drawOdds ? _.round(100 / match.match.drawOdds, 2) : null;
            },

            awayImpliedProb: (match) => {
                return match.match.awayWinOdds ? _.round(100 / match.match.awayWinOdds, 2) : null;
            },

            // Over/Under 2.5 analysis
            over2_5Result: (match) => {
                const total = match.fbref.homeGoals + match.fbref.awayGoals;
                return total > 2.5 ? "over" : "under";
            },

            over2_5ImpliedProb: (match) => {
                return match.match.over2_5Odds ? _.round(100 / match.match.over2_5Odds, 2) : null;
            },

            under2_5ImpliedProb: (match) => {
                return match.match.under2_5Odds ? _.round(100 / match.match.under2_5Odds, 2) : null;
            },

            // Value betting indicators
            homeValueBet: (match) => {
                // Simple Kelly criterion approach (without xG dependency)
                const impliedProb = match.enhanced.homeImpliedProb;
                const odds = match.match.homeWinOdds;
                if (!impliedProb || !odds) return null;
                
                // Use market efficiency as a simple edge indicator
                // If market is inefficient (high cut), there might be value
                const marketCut = match.enhanced.hadCut || 0;
                const estimatedEdge = marketCut > 10 ? 0.02 : marketCut > 5 ? 0.01 : 0;
                
                const edge = (1 / odds) + estimatedEdge - (impliedProb / 100);
                return _.round(edge, 3);
            },

            // Asian handicap simulation (simplified version)
            simulatedAH: (match) => {
                const line = match.fbref.homeGoals - match.fbref.awayGoals;
                const commonHandicaps = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
                
                const results = {};
                commonHandicaps.forEach(handicap => {
                    const adjustedLine = line + handicap;
                    let result;
                    
                    if (adjustedLine > 0) result = "home";
                    else if (adjustedLine < 0) result = "away";
                    else result = "draw";
                    
                    // Handle half-ball handicaps
                    if (Math.abs(adjustedLine) === 0.5) {
                        result = adjustedLine > 0 ? "home" : "away";
                    }
                    
                    results[`ah_${handicap}`] = result;
                });
                
                return results;
            },

            // Performance metrics
            homePerformanceRating: (match) => {
                // Combine actual result with xG performance
                const actualGoals = match.fbref.homeGoals;
                const expectedGoals = match.fbref.homeXG;
                
                if (!actualGoals || !expectedGoals) return null;
                
                const efficiency = actualGoals / expectedGoals;
                const resultBonus = match.enhanced.result === 'home' ? 1.2 : 
                                   match.enhanced.result === 'draw' ? 1.0 : 0.8;
                
                return _.round(efficiency * resultBonus, 2);
            },

            awayPerformanceRating: (match) => {
                const actualGoals = match.fbref.awayGoals;
                const expectedGoals = match.fbref.awayXG;
                
                if (!actualGoals || !expectedGoals) return null;
                
                const efficiency = actualGoals / expectedGoals;
                const resultBonus = match.enhanced.result === 'away' ? 1.2 : 
                                   match.enhanced.result === 'draw' ? 1.0 : 0.8;
                
                return _.round(efficiency * resultBonus, 2);
            },

            // Market efficiency indicators
            marketEfficiency: (match) => {
                const totalImpliedProb = 
                    (match.enhanced.homeImpliedProb || 0) +
                    (match.enhanced.drawImpliedProb || 0) +
                    (match.enhanced.awayImpliedProb || 0);
                
                return totalImpliedProb ? _.round(100 - totalImpliedProb, 2) : null;
            },

            // Attendance impact (if available)
            attendanceImpact: (match) => {
                if (!match.fbref.attendance) return null;
                
                // Normalize attendance (assuming 50k is "high")
                const normalizedAttendance = Math.min(match.fbref.attendance / 50000, 1);
                const homeAdvantage = match.enhanced.result === 'home' ? 1 : 0;
                
                return _.round(normalizedAttendance * homeAdvantage, 3);
            },

            // Referee impact analysis
            refereeImpact: (match) => {
                if (!match.fbref.referee) return null;
                
                // Simplified referee strictness indicator
                const totalGoals = match.fbref.homeGoals + match.fbref.awayGoals;
                const expectedGoals = (match.fbref.homeXG || 0) + (match.fbref.awayXG || 0);
                
                if (!expectedGoals) return null;
                
                const goalVariance = totalGoals - expectedGoals;
                return _.round(goalVariance, 2);
            },

            // NEW: FBRef incident-based metrics
            matchCleanliness: (match) => {
                if (!match.fbrefIncidents) return null;
                return match.fbrefIncidents.cleanliness.score;
            },

            cleanlinessCategory: (match) => {
                if (!match.fbrefIncidents) return null;
                return match.fbrefIncidents.cleanliness.category;
            },

            totalCards: (match) => {
                if (!match.fbrefIncidents) return null;
                return match.fbrefIncidents.summary.yellowCards + match.fbrefIncidents.summary.redCards;
            },

            cardDiscipline: (match) => {
                if (!match.fbrefIncidents) return null;
                const incidents = match.fbrefIncidents.incidents;
                const homeCards = incidents.yellowCards.filter(c => c.team === match.match.homeTeam).length +
                                incidents.redCards.filter(c => c.team === match.match.homeTeam).length;
                const awayCards = incidents.yellowCards.filter(c => c.team === match.match.awayTeam).length +
                                incidents.redCards.filter(c => c.team === match.match.awayTeam).length;
                
                return { home: homeCards, away: awayCards, total: homeCards + awayCards };
            },

            penaltyImpact: (match) => {
                if (!match.fbrefIncidents) return null;
                const penalties = match.fbrefIncidents.incidents.penalties;
                const penaltyGoals = match.fbrefIncidents.summary.penaltyGoals;
                
                return {
                    totalPenalties: penalties.length,
                    penaltyGoals,
                    conversionRate: penalties.length > 0 ? _.round(penaltyGoals / penalties.length, 2) : null
                };
            },

            goalTiming: (match) => {
                if (!match.fbrefIncidents) return null;
                const goals = match.fbrefIncidents.incidents.goals;
                
                if (goals.length === 0) return null;
                
                const timings = {
                    firstHalf: goals.filter(g => g.minute <= 45).length,
                    secondHalf: goals.filter(g => g.minute > 45).length,
                    early: goals.filter(g => g.minute <= 15).length,
                    late: goals.filter(g => g.minute >= 75).length,
                    averageMinute: _.round(_.mean(goals.map(g => g.minute)), 1)
                };
                
                return timings;
            },

            substitutionPattern: (match) => {
                if (!match.fbrefIncidents) return null;
                const subs = match.fbrefIncidents.incidents.substitutions;
                
                const homeSubs = subs.filter(s => s.team === match.match.homeTeam && s.type === 'in').length;
                const awaySubs = subs.filter(s => s.team === match.match.awayTeam && s.type === 'in').length;
                
                return {
                    home: homeSubs,
                    away: awaySubs,
                    total: homeSubs + awaySubs,
                    averageMinute: subs.length > 0 ? _.round(_.mean(subs.map(s => s.minute)), 1) : null
                };
            },

            incidentDensity: (match) => {
                if (!match.fbrefIncidents) return null;
                const summary = match.fbrefIncidents.summary;
                
                const totalIncidents = summary.totalGoals + summary.yellowCards + 
                                     summary.redCards + summary.penalties + summary.substitutions;
                
                return _.round(totalIncidents / 90, 3); // Incidents per minute
            },

            matchIntensity: (match) => {
                if (!match.fbrefIncidents) return null;
                
                // Combine cards, goals, and xG to create intensity score
                const cards = match.fbrefIncidents.summary.yellowCards + (match.fbrefIncidents.summary.redCards * 2);
                const goals = match.fbrefIncidents.summary.totalGoals;
                const xgTotal = (match.fbref.homeXG || 0) + (match.fbref.awayXG || 0);
                
                const intensity = (cards * 0.3) + (goals * 0.4) + (xgTotal * 0.3);
                return _.round(intensity, 2);
            }
        };
    }

    // Define which stats are result-dependent (for data integrity)
    getResultDependentStats() {
        return {
            // Stats that use actual match results - move to postMatch
            postMatch: [
                'line', 'hiLo', 'result', 'oe', 'over2_5Result',
                'simulatedAH', 'homePerformanceRating', 'awayPerformanceRating',
                'attendanceImpact', 'refereeImpact', 'teamMetrics',
                'matchCleanliness', 'cleanlinessCategory', 'totalCards',
                'cardDiscipline', 'penaltyImpact', 'goalTiming',
                'substitutionPattern', 'incidentDensity', 'matchIntensity',
                // xG data - calculated post-match from actual shots
                'xgLine', 'xgTotal'
            ],
            
            // Stats available before match - keep in preMatch
            preMatch: [
                'hadCut', 'ouCut',
                'homeImpliedProb', 'drawImpliedProb', 'awayImpliedProb',
                'over2_5ImpliedProb', 'under2_5ImpliedProb',
                'homeValueBet', 'marketEfficiency'
            ]
        };
    }

    // Enhance a single match with proper data separation
    enhanceMatch(matchKey, matchData, season) {
        if (!matchData.fbref || !matchData.match) {
            return matchData; // Skip if missing essential data
        }

        // SKIP matches without Asian Handicap odds (HKJC didn't offer AH betting)
        if (!matchData.match.asianHandicapOdds || 
            !matchData.match.asianHandicapOdds.homeHandicap || 
            matchData.match.asianHandicapOdds.homeHandicap === '') {
            console.log(`Skipping ${matchKey}: No Asian Handicap odds available`);
            return null; // Don't include in enhanced data
        }

        // Try to find matching FBRef incident data
        let fbrefIncidents = null;
        if (this.fbrefIncidentData[season]) {
            // Try exact match first
            fbrefIncidents = this.fbrefIncidentData[season][matchKey];
            
            // If not found, try alternative formats
            if (!fbrefIncidents) {
                const altKey1 = matchKey.replace(' v ', ' vs ');
                const altKey2 = matchKey.replace(' v ', '_vs_');
                fbrefIncidents = this.fbrefIncidentData[season][altKey1] || 
                               this.fbrefIncidentData[season][altKey2];
            }
            
            // Try partial matching as last resort
            if (!fbrefIncidents) {
                const homeTeam = matchData.match.homeTeam;
                const awayTeam = matchData.match.awayTeam;
                
                for (const [key, data] of Object.entries(this.fbrefIncidentData[season])) {
                    if (key.includes(homeTeam) && key.includes(awayTeam)) {
                        fbrefIncidents = data;
                        break;
                    }
                }
            }
        }

        const calculators = this.createEnhancedCalculators();
        const allEnhanced = {};

        // Add FBRef incidents to match data for calculations
        const enrichedMatch = { 
            ...matchData, 
            enhanced: allEnhanced,
            fbrefIncidents 
        };

        // Calculate all enhancement metrics
        Object.entries(calculators).forEach(([key, calculator]) => {
            try {
                allEnhanced[key] = calculator(enrichedMatch);
            } catch (error) {
                console.warn(`Error calculating ${key} for ${matchKey}:`, error.message);
                allEnhanced[key] = null;
            }
        });

        // Add team-specific metrics to all enhanced stats for calculation
        allEnhanced.teamMetrics = {
            [matchData.match.homeTeam]: {
                goals: matchData.fbref.homeGoals,
                xG: matchData.fbref.homeXG,
                performance: allEnhanced.homePerformanceRating,
                venue: 'home'
            },
            [matchData.match.awayTeam]: {
                goals: matchData.fbref.awayGoals,
                xG: matchData.fbref.awayXG,
                performance: allEnhanced.awayPerformanceRating,
                venue: 'away'
            }
        };

        // Separate stats into preMatch and postMatch for data integrity
        const statCategories = this.getResultDependentStats();
        
        const result = {
            // preMatch: Data available before match starts (SAFE for prediction)
            preMatch: {
                match: { 
                    ...matchData.match,
                    // Convert handicap format from string (+0.5/+1) to decimal (0.75) to align with odds-data.json
                    asianHandicapOdds: matchData.match.asianHandicapOdds ? {
                        ...matchData.match.asianHandicapOdds,
                        homeHandicap: this.handicapConverter(matchData.match.asianHandicapOdds.homeHandicap),
                        awayHandicap: this.handicapConverter(matchData.match.asianHandicapOdds.awayHandicap)
                    } : null
                },
                fbref: {
                    // Pre-match context (known before kickoff)
                    date: matchData.fbref.date,
                    week: typeof matchData.fbref.week === 'string' ? parseInt(matchData.fbref.week) || null : matchData.fbref.week,
                    day: matchData.fbref.day,
                    time: matchData.fbref.time,
                    referee: matchData.fbref.referee,
                    venue: matchData.fbref.venue,
                    attendance: matchData.fbref.attendance
                },
                enhanced: {},
                marketEfficiency: {}
            },
            
            // postMatch: Result-dependent data (for filtering/analysis only)
            postMatch: {
                actualResults: {
                    homeGoals: matchData.fbref.homeGoals,
                    awayGoals: matchData.fbref.awayGoals
                },
                xgData: {
                    // xG calculated post-match from actual shots
                    homeXG: matchData.fbref.homeXG,
                    awayXG: matchData.fbref.awayXG
                },
                performance: {},
                incidents: {},
                asianHandicapResults: {}
            },
            
            // timeSeries: Keep as-is (team patterns/streaks)
            timeSeries: matchData.timeSeries || null
        };

        // Distribute enhanced stats to appropriate sections
        Object.entries(allEnhanced).forEach(([key, value]) => {
            if (statCategories.postMatch.includes(key)) {
                // Categorize result-dependent stats
                if (['line', 'hiLo', 'result', 'oe', 'over2_5Result'].includes(key)) {
                    result.postMatch.actualResults[key] = value;
                } else if (['xgLine', 'xgTotal'].includes(key)) {
                    result.postMatch.xgData[key] = value;
                } else if (['homePerformanceRating', 'awayPerformanceRating', 'attendanceImpact', 'refereeImpact', 'teamMetrics'].includes(key)) {
                    result.postMatch.performance[key] = value;
                } else if (['matchCleanliness', 'cleanlinessCategory', 'totalCards', 'cardDiscipline', 'penaltyImpact', 'goalTiming', 'substitutionPattern', 'incidentDensity', 'matchIntensity'].includes(key)) {
                    result.postMatch.incidents[key] = value;
                } else if (key === 'simulatedAH') {
                    result.postMatch.asianHandicapResults = value;
                } else {
                    result.postMatch.performance[key] = value;
                }
            } else {
                // Keep in preMatch (safe for prediction)
                result.preMatch.enhanced[key] = value;
            }
        });

        // Add market efficiency summary to preMatch for easy access
        result.preMatch.marketEfficiency = {
            hadCut: result.preMatch.enhanced.hadCut,
            ouCut: result.preMatch.enhanced.ouCut,
            marketEfficiency: result.preMatch.enhanced.marketEfficiency,
            totalImpliedProb: (result.preMatch.enhanced.homeImpliedProb || 0) +
                             (result.preMatch.enhanced.drawImpliedProb || 0) +
                             (result.preMatch.enhanced.awayImpliedProb || 0)
        };

        // Preserve FBRef incidents if they exist
        if (fbrefIncidents) {
            result.postMatch.fbrefIncidents = fbrefIncidents;
        }

        return result;
    }

    // Process a JSON file and enhance all matches
    enhanceJsonFile(inputPath, outputPath) {
        console.log(`Enhancing: ${inputPath}`);
        
        const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        const enhancedMatches = {};
        
        // Determine season from file path
        const season = inputPath.includes('2022') ? '2022-2023' :
                      inputPath.includes('2023') ? '2023-2024' :
                      inputPath.includes('2024') ? '2024-2025' : null;
        
        let processedCount = 0;
        let enhancedCount = 0;
        let incidentDataFound = 0;
        
        let skippedCount = 0;
        
        Object.entries(data.matches).forEach(([matchKey, matchData]) => {
            processedCount++;
            
            const enhanced = this.enhanceMatch(matchKey, matchData, season);
            
            // Skip matches that don't have Asian Handicap odds
            if (enhanced === null) {
                skippedCount++;
                return; // Don't add to enhancedMatches
            }
            
            if (enhanced.preMatch && enhanced.preMatch.enhanced) {
                enhancedCount++;
            }
            if (enhanced.postMatch && enhanced.postMatch.fbrefIncidents) {
                incidentDataFound++;
            }
            
            enhancedMatches[matchKey] = enhanced;
        });

        // Update metadata
        const enhancedData = {
            metadata: {
                ...data.metadata,
                enhancedMatches: enhancedCount,
                matchesWithIncidentData: incidentDataFound,
                enhancementVersion: "3.0",
                enhancedAt: new Date().toISOString(),
                structure: {
                    preMatch: "Predictive analysis available before match - USE FOR TRAINING",
                    postMatch: "Result-dependent analysis only after match completion - USE FOR FILTERING ONLY",
                    timeSeries: "Team streaks, patterns, and historical performance - USE FOR TRAINING"
                },
                dataIntegrity: {
                    preventedDataLeakage: true,
                    resultDependentStatsIsolated: true,
                    safeForPredictiveModeling: true,
                    xgMovedToPostMatch: "xG data moved to postMatch as it's calculated from actual shots",
                    asianHandicapFilteringEnabled: true,
                    filteredOutMatches: skippedCount,
                    filterReason: "Matches without Asian Handicap odds excluded (HKJC didn't offer AH betting)"
                },
                enhancements: [
                    "Data leakage prevention (preMatch/postMatch separation)",
                    "Asian handicap filtering (excludes matches without AH odds)",
                    "Asian handicap simulation (postMatch)",
                    "Market efficiency analysis (preMatch)", 
                    "xG-based performance metrics (mixed)",
                    "Value betting indicators (preMatch)",
                    "Referee and attendance impact (mixed)",
                    "FBRef incident analysis (postMatch)",
                    "Match cleanliness metrics (postMatch)",
                    "Card discipline tracking (postMatch)",
                    "Goal timing analysis (postMatch)",
                    "Substitution patterns (postMatch)",
                    "Match intensity scoring (postMatch)"
                ]
            },
            matches: enhancedMatches
        };

        // Write enhanced data
        fs.writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2));
        
        console.log(`Enhanced ${enhancedCount}/${processedCount} matches`);
        console.log(`Skipped ${skippedCount}/${processedCount} matches (no Asian Handicap odds)`);
        console.log(`Found FBRef incident data for ${incidentDataFound}/${enhancedCount} matches`);
        console.log(`Output: ${outputPath}`);
        
        return { processedCount, enhancedCount, incidentDataFound, skippedCount };
    }

    // Process all JSON files in processed directory
    enhanceAllSeasons() {
        // Load FBRef incident data first
        this.loadFBRefIncidentData();
        
        const processedDir = 'data/processed';
        const enhancedDir = 'data/enhanced';
        
        // Create enhanced directory
        if (!fs.existsSync(enhancedDir)) {
            fs.mkdirSync(enhancedDir, { recursive: true });
        }

        const jsonFiles = fs.readdirSync(processedDir)
            .filter(file => file.startsWith('year-') && file.endsWith('.json'));

        console.log(`Found ${jsonFiles.length} season files to enhance`);

        const results = [];
        
        jsonFiles.forEach(file => {
            const inputPath = path.join(processedDir, file);
            const outputPath = path.join(enhancedDir, file.replace('.json', '-enhanced.json'));
            
            const result = this.enhanceJsonFile(inputPath, outputPath);
            results.push({ file, ...result });
        });

        // Summary report
        console.log('\n=== ENHANCEMENT SUMMARY ===');
        results.forEach(result => {
            const successRate = Math.round((result.enhancedCount / result.processedCount) * 100);
            const skipRate = Math.round((result.skippedCount / result.processedCount) * 100);
            const incidentRate = result.enhancedCount > 0 ? Math.round((result.incidentDataFound / result.enhancedCount) * 100) : 0;
            console.log(`${result.file}: ${result.enhancedCount}/${result.processedCount} enhanced (${successRate}%), ${result.skippedCount} skipped (${skipRate}%), ${result.incidentDataFound} with incidents (${incidentRate}%)`);
        });

        const totalProcessed = results.reduce((sum, r) => sum + r.processedCount, 0);
        const totalEnhanced = results.reduce((sum, r) => sum + r.enhancedCount, 0);
        const totalSkipped = results.reduce((sum, r) => sum + r.skippedCount, 0);
        const totalIncidents = results.reduce((sum, r) => sum + r.incidentDataFound, 0);
        const overallRate = Math.round((totalEnhanced / totalProcessed) * 100);
        const skipRate = Math.round((totalSkipped / totalProcessed) * 100);
        const incidentRate = totalEnhanced > 0 ? Math.round((totalIncidents / totalEnhanced) * 100) : 0;
        
        console.log(`\nOverall: ${totalEnhanced}/${totalProcessed} matches enhanced (${overallRate}%)`);
        console.log(`Skipped: ${totalSkipped}/${totalProcessed} matches (${skipRate}%) - no Asian Handicap odds`);
        console.log(`FBRef incidents: ${totalIncidents}/${totalEnhanced} enhanced matches (${incidentRate}%)`);
        console.log(`Enhanced files saved to: ${enhancedDir}/`);
    }
}

// CLI interface
async function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node enhance-asian-handicap.js [all|FILE_PATH]');
        console.log('');
        console.log('Examples:');
        console.log('  node enhance-asian-handicap.js all                              # Enhance all seasons');
        console.log('  node enhance-asian-handicap.js data/processed/year-2024-2025.json   # Enhance specific file');
        process.exit(1);
    }

    const enhancer = new AsianHandicapEnhancer();
    const target = process.argv[2];

    if (target === 'all') {
        enhancer.enhanceAllSeasons();
    } else {
        // Single file processing
        const inputPath = target;
        const outputPath = target.replace('.json', '-enhanced.json').replace('/processed/', '/enhanced/');
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Load FBRef data for single file processing
        enhancer.loadFBRefIncidentData();
        enhancer.enhanceJsonFile(inputPath, outputPath);
    }
}

main(); 