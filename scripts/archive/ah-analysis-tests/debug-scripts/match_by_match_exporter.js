const fs = require('fs');
const path = require('path');

class MatchByMatchExporter {
    constructor() {
        this.cleanDataPath = path.join(__dirname, '../../data/odds-movement-clean');
        this.exportPath = path.join(__dirname, '../../data/matches-organized');
        this.matches = {};
        this.stats = {
            totalFiles: 0,
            totalRecords: 0,
            uniqueMatches: 0,
            exportedMatches: 0,
            averageRecordsPerMatch: 0
        };
    }

    // Load and group all clean data by match
    loadAndGroupMatches() {
        console.log('📂 Loading clean odds data and grouping by match...');
        
        // Ensure export directory exists
        if (!fs.existsSync(this.exportPath)) {
            fs.mkdirSync(this.exportPath, { recursive: true });
        }

        const files = fs.readdirSync(this.cleanDataPath)
            .filter(file => file.endsWith('.json') && file !== 'cleaning_report.json')
            .sort();

        this.stats.totalFiles = files.length;
        console.log(`📁 Found ${files.length} clean data files`);

        files.forEach(file => {
            const filePath = path.join(this.cleanDataPath, file);
            const timestamp = parseInt(file.replace('.json', ''));
            
            try {
                const records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                records.forEach(record => {
                    this.stats.totalRecords++;
                    
                    // Create unique match key
                    const matchKey = this.createMatchKey(record);
                    
                    if (!this.matches[matchKey]) {
                        this.matches[matchKey] = {
                            matchInfo: {
                                id: record.id,
                                home: record.home,
                                away: record.away,
                                date: record.date,
                                matchKey: matchKey
                            },
                            oddsMovements: []
                        };
                    }
                    
                    // Add odds movement record
                    this.matches[matchKey].oddsMovements.push({
                        timestamp: timestamp,
                        readableDate: new Date(timestamp).toISOString(),
                        ahHome: record.ahHome,
                        ahAway: record.ahAway,
                        oddsHome: record.oddsHome,
                        oddsAway: record.oddsAway,
                        originalRecord: record
                    });
                });
                
            } catch (error) {
                console.log(`⚠️  Error reading ${file}: ${error.message}`);
            }
        });

        // Sort odds movements by timestamp for each match
        Object.keys(this.matches).forEach(matchKey => {
            this.matches[matchKey].oddsMovements.sort((a, b) => a.timestamp - b.timestamp);
        });

        this.stats.uniqueMatches = Object.keys(this.matches).length;
        this.stats.averageRecordsPerMatch = this.stats.totalRecords / this.stats.uniqueMatches;

        console.log(`✅ Grouped ${this.stats.totalRecords} records into ${this.stats.uniqueMatches} unique matches`);
        console.log(`📊 Average ${this.stats.averageRecordsPerMatch.toFixed(1)} odds snapshots per match`);
        
        return this.matches;
    }

    // Create unique match key
    createMatchKey(record) {
        // Use ID and date to create unique key
        const cleanHome = this.cleanTeamName(record.home);
        const cleanAway = this.cleanTeamName(record.away);
        return `${record.id}_${record.date}_${cleanHome}_vs_${cleanAway}`;
    }

    // Clean team names for file naming
    cleanTeamName(teamName) {
        if (!teamName) return 'Unknown';
        
        return teamName
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, '_')     // Replace spaces with underscores
            .trim();
    }

    // Analyze individual match patterns
    analyzeMatchPattern(match) {
        const movements = match.oddsMovements;
        if (movements.length < 2) return null;

        const analysis = {
            totalSnapshots: movements.length,
            timeSpan: {
                start: movements[0].readableDate,
                end: movements[movements.length - 1].readableDate,
                durationMinutes: (movements[movements.length - 1].timestamp - movements[0].timestamp) / 1000 / 60
            },
            handicapMovements: [],
            oddsMovements: [],
            patterns: {
                handicapStability: true,
                oddsVolatility: 'LOW',
                trappedInQuarter: false,
                significantSwings: []
            }
        };

        // Analyze movements
        for (let i = 1; i < movements.length; i++) {
            const prev = movements[i - 1];
            const curr = movements[i];

            // Track handicap changes
            if (prev.ahAway !== curr.ahAway) {
                analysis.patterns.handicapStability = false;
                analysis.handicapMovements.push({
                    from: prev.ahAway,
                    to: curr.ahAway,
                    change: curr.ahAway - prev.ahAway,
                    time: curr.readableDate
                });
            }

            // Track odds changes
            if (prev.oddsAway && curr.oddsAway && Math.abs(prev.oddsAway - curr.oddsAway) >= 0.05) {
                const oddsChange = curr.oddsAway - prev.oddsAway;
                analysis.oddsMovements.push({
                    from: prev.oddsAway,
                    to: curr.oddsAway,
                    change: oddsChange,
                    changePercent: ((oddsChange / prev.oddsAway) * 100).toFixed(2),
                    time: curr.readableDate
                });

                // Detect significant swings
                if (Math.abs(oddsChange) >= 0.15) {
                    analysis.patterns.significantSwings.push({
                        type: oddsChange > 0 ? 'LENGTHENING' : 'SHORTENING',
                        magnitude: Math.abs(oddsChange),
                        from: prev.oddsAway,
                        to: curr.oddsAway,
                        time: curr.readableDate
                    });
                }
            }
        }

        // Determine odds volatility
        if (analysis.patterns.significantSwings.length > 2) {
            analysis.patterns.oddsVolatility = 'HIGH';
        } else if (analysis.patterns.significantSwings.length > 0) {
            analysis.patterns.oddsVolatility = 'MEDIUM';
        }

        // Check if trapped in quarter handicap
        const quarterCount = movements.filter(m => this.isQuarterHandicap(m.ahAway)).length;
        analysis.patterns.trappedInQuarter = quarterCount / movements.length > 0.8;

        return analysis;
    }

    // Check if handicap is quarter format
    isQuarterHandicap(handicap) {
        if (!handicap) return false;
        
        if (typeof handicap === 'string') {
            return handicap.includes('/') || handicap.includes('0.25') || handicap.includes('0.75');
        }
        
        const decimal = Math.abs(handicap) % 1;
        return decimal === 0.25 || decimal === 0.75;
    }

    // Export individual match files
    exportMatches() {
        console.log('📤 Exporting individual match files...');
        
        const exportSummary = {
            exportDate: new Date().toISOString(),
            totalMatches: this.stats.uniqueMatches,
            exportedMatches: 0,
            interestingPatterns: [],
            statistics: {
                highVolatilityMatches: 0,
                trappedQuarterMatches: 0,
                stableHandicapMatches: 0,
                significantSwingMatches: 0
            }
        };

        Object.keys(this.matches).forEach(matchKey => {
            const match = this.matches[matchKey];
            const analysis = this.analyzeMatchPattern(match);
            
            // Create enhanced match data
            const exportData = {
                matchInfo: match.matchInfo,
                analysis: analysis,
                oddsTimeline: match.oddsMovements,
                exportMetadata: {
                    exportedAt: new Date().toISOString(),
                    totalSnapshots: match.oddsMovements.length,
                    dataQuality: 'CLEAN_PRE_MATCH_ONLY'
                }
            };

            // Generate filename
            const fileName = `${matchKey}.json`;
            const filePath = path.join(this.exportPath, fileName);
            
            // Save match file
            fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
            
            exportSummary.exportedMatches++;
            this.stats.exportedMatches++;

            // Track interesting patterns
            if (analysis) {
                if (analysis.patterns.oddsVolatility === 'HIGH') {
                    exportSummary.statistics.highVolatilityMatches++;
                    exportSummary.interestingPatterns.push({
                        match: `${match.matchInfo.home} vs ${match.matchInfo.away}`,
                        pattern: 'HIGH_VOLATILITY',
                        swings: analysis.patterns.significantSwings.length,
                        file: fileName
                    });
                }

                if (analysis.patterns.trappedInQuarter) {
                    exportSummary.statistics.trappedQuarterMatches++;
                    exportSummary.interestingPatterns.push({
                        match: `${match.matchInfo.home} vs ${match.matchInfo.away}`,
                        pattern: 'TRAPPED_IN_QUARTER',
                        snapshots: analysis.totalSnapshots,
                        file: fileName
                    });
                }

                if (analysis.patterns.handicapStability) {
                    exportSummary.statistics.stableHandicapMatches++;
                }

                if (analysis.patterns.significantSwings.length > 0) {
                    exportSummary.statistics.significantSwingMatches++;
                }
            }
        });

        // Save export summary
        const summaryPath = path.join(this.exportPath, '_EXPORT_SUMMARY.json');
        fs.writeFileSync(summaryPath, JSON.stringify(exportSummary, null, 2));

        return exportSummary;
    }

    // Generate sample analysis report
    generateSampleReport(exportSummary) {
        console.log('\n📋 MATCH-BY-MATCH EXPORT SUMMARY');
        console.log('=================================');
        
        console.log(`📁 Export Location: ${this.exportPath}`);
        console.log(`📊 Total Matches Exported: ${exportSummary.exportedMatches}`);
        console.log(`📈 Average Snapshots per Match: ${this.stats.averageRecordsPerMatch.toFixed(1)}`);
        
        console.log('\n🎯 PATTERN ANALYSIS:');
        console.log(`   • High Volatility Matches: ${exportSummary.statistics.highVolatilityMatches}`);
        console.log(`   • Trapped in Quarter: ${exportSummary.statistics.trappedQuarterMatches}`);
        console.log(`   • Stable Handicap: ${exportSummary.statistics.stableHandicapMatches}`);
        console.log(`   • Significant Swings: ${exportSummary.statistics.significantSwingMatches}`);

        if (exportSummary.interestingPatterns.length > 0) {
            console.log('\n💎 INTERESTING PATTERNS (Sample):');
            exportSummary.interestingPatterns.slice(0, 5).forEach((pattern, index) => {
                console.log(`\n${index + 1}. ${pattern.match} (${pattern.file})`);
                console.log(`   Pattern: ${pattern.pattern}`);
                if (pattern.swings) console.log(`   Swings: ${pattern.swings}`);
                if (pattern.snapshots) console.log(`   Snapshots: ${pattern.snapshots}`);
            });
        }

        console.log('\n📁 FILE STRUCTURE:');
        console.log('   Each match file contains:');
        console.log('   • Match information (teams, date, ID)');
        console.log('   • Complete odds timeline (chronological)');
        console.log('   • Movement analysis (handicaps, odds changes)');
        console.log('   • Pattern detection (volatility, quarter trapping)');
        console.log('   • Clean pre-match data only');

        return exportSummary;
    }

    // Main export function
    async exportAllMatches() {
        console.log('🚀 MATCH-BY-MATCH EXPORT PROCESS');
        console.log('=================================');
        console.log('Organizing clean odds data by individual matches\n');

        try {
            this.loadAndGroupMatches();
            const exportSummary = this.exportMatches();
            this.generateSampleReport(exportSummary);

            console.log('\n✅ EXPORT COMPLETED SUCCESSFULLY!');
            console.log(`📂 Check ${this.exportPath} for individual match files`);
            console.log('🔍 Each file contains complete odds movement history for analysis');
            
            return exportSummary;

        } catch (error) {
            console.error('❌ Export failed:', error.message);
            throw error;
        }
    }
}

// Run export if called directly
if (require.main === module) {
    const exporter = new MatchByMatchExporter();
    exporter.exportAllMatches().catch(console.error);
}

module.exports = MatchByMatchExporter; 