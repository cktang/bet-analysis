const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

class FootballDataMerger {
    constructor() {
        this.teamNameMap = new Map();
        this.fbrefData = [];
        this.matchData = [];
        this.mergedData = [];
        this.unmatched = { fbref: [], matches: [] };
        
        // Initialize common team name mappings
        this.initializeTeamMappings();
    }

    initializeTeamMappings() {
        // Common team name variations between sources
        const mappings = {
            // FBRef name -> Match file variations
            'Manchester Utd': ['Manchester Utd', 'Man Utd', 'Manchester United', 'Manchester'],
            'Manchester City': ['Manchester City', 'Man City', 'Manchester'],
            'Newcastle Utd': ['Newcastle', 'Newcastle United', 'Newcastle Utd'],
            'Tottenham': ['Tottenham', 'Spurs'],
            'Brighton': ['Brighton', 'Brighton & Hove Albion', 'Brighton and Hove Albion'],
            'West Ham': ['West Ham', 'West Ham United', 'West'],
            'Nott\'ham Forest': ['Nottingham Forest', 'Nott\'ham Forest', 'Forest', 'Nottingham'],
            'Wolves': ['Wolverhampton', 'Wolves', 'Wolverhampton Wanderers'],
            'Leicester City': ['Leicester', 'Leicester City'],
            'Crystal Palace': ['Crystal Palace', 'Palace', 'Crystal'],
            'Aston Villa': ['Aston Villa', 'Villa', 'Aston'],
            'Southampton': ['Southampton'],
            'Liverpool': ['Liverpool'],
            'Arsenal': ['Arsenal'],
            'Chelsea': ['Chelsea'],
            'Everton': ['Everton'],
            'Fulham': ['Fulham'],
            'Brentford': ['Brentford'],
            'Bournemouth': ['Bournemouth'],
            'Ipswich Town': ['Ipswich Town', 'Ipswich'],
        };

        // Create bidirectional mappings
        for (const [canonical, variations] of Object.entries(mappings)) {
            variations.forEach(variant => {
                this.teamNameMap.set(variant, canonical);
                this.teamNameMap.set(canonical, canonical);
            });
        }
        
        // Handle special cases where Manchester appears for both teams
        this.specialCases = {
            'Manchester': ['Manchester Utd', 'Manchester City']
        };
    }

    isValidTeamName(name) {
        if (!name || name.length < 2) return false;
        if (name === 'vs' || name === 'Home' || name === 'Away') return false;
        if (/^\d+$/.test(name)) return false; // Pure numbers
        if (name.includes(':')) return false; // Likely a score
        return true;
    }

    normalizeTeamName(teamName, context = null) {
        if (!teamName) return '';
        if (!this.isValidTeamName(teamName)) return '';
        
        const trimmed = teamName.trim();
        
        // Handle special ambiguous cases
        if (this.specialCases && this.specialCases[trimmed]) {
            // For now, we'll need more context to resolve these
            // Return the first option, but this could be improved with context
            console.warn(`Ambiguous team name: ${trimmed}, using ${this.specialCases[trimmed][0]}`);
            return this.specialCases[trimmed][0];
        }
        
        // Check if we have a direct mapping
        if (this.teamNameMap.has(trimmed)) {
            return this.teamNameMap.get(trimmed);
        }

        // Try some common transformations
        const normalized = trimmed
            .replace(/\s+/g, ' ')
            .replace(/&/g, 'and')
            .trim();

        // Check again after normalization
        if (this.teamNameMap.has(normalized)) {
            return this.teamNameMap.get(normalized);
        }

        // If no mapping found, add it to our map for future reference
        this.teamNameMap.set(trimmed, trimmed);
        return trimmed;
    }

    parseDate(dateStr, format = 'fbref') {
        if (!dateStr) return null;
        
        try {
            if (format === 'fbref') {
                // FBRef format: "2024-08-16"
                return new Date(dateStr);
            } else if (format === 'match') {
                // Match file format: "17/08/2024" or "12/08/2023"
                const [day, month, year] = dateStr.split('/');
                return new Date(year, month - 1, day);
            }
        } catch (error) {
            console.warn(`Error parsing date: ${dateStr}`, error);
            return null;
        }
        return null;
    }

    async loadFBRefData(filePath) {
        console.log(`Loading FBRef data from: ${filePath}`);
        
        return new Promise((resolve, reject) => {
            const results = [];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    const parsed = {
                        ...data,
                        Date: this.parseDate(data.Date, 'fbref'),
                        HomeTeam: this.normalizeTeamName(data.HomeTeam),
                        AwayTeam: this.normalizeTeamName(data.AwayTeam),
                        FTHG: parseInt(data.FTHG) || 0,
                        FTAG: parseInt(data.FTAG) || 0,
                        source: 'fbref'
                    };
                    results.push(parsed);
                })
                .on('end', () => {
                    this.fbrefData = results;
                    console.log(`Loaded ${results.length} FBRef records`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    parseMatchFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 10) return null;
        
        try {
            const date = this.parseDate(lines[0], 'match');
            const eventId = lines[1];
            
            // More robust team name parsing
            let homeTeam = '', awayTeam = '';
            
            // Find "vs" line to determine team positions
            const vsIndex = lines.findIndex(line => line.toLowerCase() === 'vs');
            
            if (vsIndex > 1) {
                // Construct home team from lines before "vs"
                const homeLines = [];
                for (let i = 2; i < vsIndex; i++) {
                    if (lines[i] && this.isValidTeamName(lines[i])) {
                        homeLines.push(lines[i]);
                    }
                }
                homeTeam = this.normalizeTeamName(homeLines.join(' '));
                
                // Construct away team from lines after "vs"
                const awayLines = [];
                for (let i = vsIndex + 1; i < Math.min(vsIndex + 4, lines.length); i++) {
                    if (lines[i] && this.isValidTeamName(lines[i]) && !lines[i].includes(':')) {
                        awayLines.push(lines[i]);
                    }
                }
                awayTeam = this.normalizeTeamName(awayLines.join(' '));
            }
            
            // Fallback to original parsing if vs method fails
            if (!homeTeam) {
                homeTeam = this.normalizeTeamName(lines[2]);
            }
            if (!awayTeam && lines.length > 4) {
                awayTeam = this.normalizeTeamName(lines[4]);
            }
            
            // Parse scores - looking for the pattern like "1 : 0"
            let homeScore = null, awayScore = null;
            for (let i = 5; i < Math.min(15, lines.length); i++) {
                if (lines[i] === ':' && i > 5 && i < lines.length - 1) {
                    const prevLine = lines[i - 1];
                    const nextLine = lines[i + 1];
                    if (!isNaN(prevLine) && !isNaN(nextLine)) {
                        homeScore = parseInt(prevLine);
                        awayScore = parseInt(nextLine);
                        break;
                    }
                }
            }

            // Extract odds information
            const odds = this.extractOdds(lines);

            return {
                Date: date,
                EventId: eventId,
                HomeTeam: homeTeam,
                AwayTeam: awayTeam,
                HomeScore: homeScore,
                AwayScore: awayScore,
                ...odds,
                source: 'match',
                filePath
            };
        } catch (error) {
            console.warn(`Error parsing match file ${filePath}:`, error);
            return null;
        }
    }

    extractOdds(lines) {
        const odds = {};
        
        // Look for Home/Away/Draw odds
        const hadIndex = lines.findIndex(line => line === 'Home/Away/Draw');
        if (hadIndex > -1 && hadIndex + 4 < lines.length) {
            try {
                odds.HomeWinOdds = parseFloat(lines[hadIndex + 4]);
                odds.DrawOdds = parseFloat(lines[hadIndex + 5]);
                odds.AwayWinOdds = parseFloat(lines[hadIndex + 6]);
            } catch (e) {
                // Odds parsing failed, continue without odds
            }
        }

        // Look for Over/Under 2.5 goals
        const hiloIndex = lines.findIndex(line => line === 'HiLo');
        if (hiloIndex > -1) {
            for (let i = hiloIndex; i < Math.min(hiloIndex + 20, lines.length); i++) {
                if (lines[i] === '[2.5]' && i + 2 < lines.length) {
                    try {
                        odds.Over2_5Odds = parseFloat(lines[i + 1]);
                        odds.Under2_5Odds = parseFloat(lines[i + 2]);
                    } catch (e) {
                        // Odds parsing failed
                    }
                    break;
                }
            }
        }

        return odds;
    }

    async loadMatchData(matchDir) {
        console.log(`Loading match data from: ${matchDir}`);
        
        if (!fs.existsSync(matchDir)) {
            console.warn(`Match directory does not exist: ${matchDir}`);
            return;
        }

        const files = fs.readdirSync(matchDir)
            .filter(file => file.endsWith('.txt'))
            .sort();

        const results = [];
        for (const file of files) {
            const filePath = path.join(matchDir, file);
            const matchData = this.parseMatchFile(filePath);
            if (matchData) {
                results.push(matchData);
            }
        }

        this.matchData = results;
        console.log(`Loaded ${results.length} match records`);
    }

    createMatchKey(homeTeam, awayTeam, date) {
        if (!homeTeam || !awayTeam) return null;
        return `${homeTeam}|${awayTeam}`;
    }
    
    createFlexibleMatchKeys(homeTeam, awayTeam, date) {
        const keys = [];
        if (!homeTeam || !awayTeam) return keys;
        
        const baseKey = `${homeTeam}|${awayTeam}`;
        keys.push(baseKey);
        
        // Add date-specific key if date is available
        if (date) {
            const dateStr = date.toISOString().split('T')[0];
            keys.push(`${baseKey}|${dateStr}`);
            
            // Add keys for date +/- 1 day to handle timezone/date discrepancies
            const prevDay = new Date(date);
            prevDay.setDate(prevDay.getDate() - 1);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            keys.push(`${baseKey}|${prevDay.toISOString().split('T')[0]}`);
            keys.push(`${baseKey}|${nextDay.toISOString().split('T')[0]}`);
        }
        
        return keys;
    }

    mergeData() {
        console.log('Merging data with flexible matching...');
        
        // Create lookup maps for better matching
        const fbrefMap = new Map();
        const matchMap = new Map();
        
        // Index FBRef data with multiple keys
        this.fbrefData.forEach(record => {
            const normalizedHome = this.normalizeTeamName(record.HomeTeam, 'fbref');
            const normalizedAway = this.normalizeTeamName(record.AwayTeam, 'fbref');
            
            if (normalizedHome && normalizedAway) {
                const keys = this.createFlexibleMatchKeys(normalizedHome, normalizedAway, record.Date);
                const normalizedRecord = { ...record, HomeTeam: normalizedHome, AwayTeam: normalizedAway };
                
                keys.forEach(key => {
                    if (!fbrefMap.has(key)) { // Avoid overwriting with first match
                        fbrefMap.set(key, normalizedRecord);
                    }
                });
            }
        });
        
        // Index match data with multiple keys
        this.matchData.forEach(record => {
            const normalizedHome = this.normalizeTeamName(record.HomeTeam, 'match');
            const normalizedAway = this.normalizeTeamName(record.AwayTeam, 'match');
            
            if (normalizedHome && normalizedAway) {
                const keys = this.createFlexibleMatchKeys(normalizedHome, normalizedAway, record.Date);
                const normalizedRecord = { ...record, HomeTeam: normalizedHome, AwayTeam: normalizedAway };
                
                keys.forEach(key => {
                    if (!matchMap.has(key)) { // Avoid overwriting with first match
                        matchMap.set(key, normalizedRecord);
                    }
                });
            }
        });

        // Merge data - prioritize matches and avoid duplicates
        const merged = [];
        const processedFBRef = new Set();
        const processedMatch = new Set();
        
        // First pass: find perfect matches
        this.fbrefData.forEach(fbrefRecord => {
            const normalizedHome = this.normalizeTeamName(fbrefRecord.HomeTeam, 'fbref');
            const normalizedAway = this.normalizeTeamName(fbrefRecord.AwayTeam, 'fbref');
            
            if (normalizedHome && normalizedAway) {
                const keys = this.createFlexibleMatchKeys(normalizedHome, normalizedAway, fbrefRecord.Date);
                
                for (const key of keys) {
                    const matchRecord = matchMap.get(key);
                    
                    if (matchRecord && !processedFBRef.has(fbrefRecord) && !processedMatch.has(matchRecord)) {
                        // Perfect match found - combine both records
                        const mergedRecord = {
                            // FBRef data
                            Date: fbrefRecord.Date,
                            HomeTeam: normalizedHome,
                            AwayTeam: normalizedAway,
                            FTHG: fbrefRecord.FTHG,
                            FTAG: fbrefRecord.FTAG,
                            Home_xG: fbrefRecord.Home_xG,
                            Away_xG: fbrefRecord.Away_xG,
                            Referee: fbrefRecord.Referee,
                            Venue: fbrefRecord.Venue,
                            Attendance: fbrefRecord.Attendance,
                            Wk: fbrefRecord.Wk,
                            Day: fbrefRecord.Day,
                            Time: fbrefRecord.Time,
                            
                            // Match data
                            EventId: matchRecord.EventId,
                            HomeScore: matchRecord.HomeScore,
                            AwayScore: matchRecord.AwayScore,
                            HomeWinOdds: matchRecord.HomeWinOdds,
                            DrawOdds: matchRecord.DrawOdds,
                            AwayWinOdds: matchRecord.AwayWinOdds,
                            Over2_5Odds: matchRecord.Over2_5Odds,
                            Under2_5Odds: matchRecord.Under2_5Odds,
                            
                            MatchStatus: 'merged'
                        };
                        
                        merged.push(mergedRecord);
                        processedFBRef.add(fbrefRecord);
                        processedMatch.add(matchRecord);
                        break; // Stop after first match
                    }
                }
            }
        });
        
        // Track unmatched records
        this.fbrefData.forEach(record => {
            if (!processedFBRef.has(record)) {
                this.unmatched.fbref.push(record);
            }
        });
        
        this.matchData.forEach(record => {
            if (!processedMatch.has(record)) {
                this.unmatched.matches.push(record);
            }
        });

        this.mergedData = merged.sort((a, b) => {
            if (!a.Date || !b.Date) return 0;
            return a.Date - b.Date;
        });

        console.log(`Successfully merged ${merged.length} records with flexible matching`);
        console.log(`- Unmatched FBRef records: ${this.unmatched.fbref.length}`);
        console.log(`- Unmatched Match records: ${this.unmatched.matches.length}`);
    }

    async saveResults(outputPath, teamMappingPath) {
        console.log(`Saving merged data to: ${outputPath}`);
        
        // Prepare CSV headers
        const headers = [
            { id: 'Date', title: 'Date' },
            { id: 'HomeTeam', title: 'HomeTeam' },
            { id: 'AwayTeam', title: 'AwayTeam' },
            { id: 'FTHG', title: 'FTHG' },
            { id: 'FTAG', title: 'FTAG' },
            { id: 'HomeScore', title: 'HomeScore' },
            { id: 'AwayScore', title: 'AwayScore' },
            { id: 'EventId', title: 'EventId' },
            { id: 'HomeWinOdds', title: 'HomeWinOdds' },
            { id: 'DrawOdds', title: 'DrawOdds' },
            { id: 'AwayWinOdds', title: 'AwayWinOdds' },
            { id: 'Over2_5Odds', title: 'Over2_5Odds' },
            { id: 'Under2_5Odds', title: 'Under2_5Odds' },
            { id: 'MatchStatus', title: 'MatchStatus' },
            { id: 'Wk', title: 'Week' },
            { id: 'Day', title: 'Day' },
            { id: 'Time', title: 'Time' },
            { id: 'Home_xG', title: 'Home_xG' },
            { id: 'Away_xG', title: 'Away_xG' },
            { id: 'Referee', title: 'Referee' },
            { id: 'Venue', title: 'Venue' },
            { id: 'Attendance', title: 'Attendance' }
        ];

        const csvWriter = createObjectCsvWriter({
            path: outputPath,
            header: headers
        });

        // Format data for CSV
        const csvData = this.mergedData.map(record => ({
            ...record,
            Date: record.Date ? record.Date.toISOString().split('T')[0] : ''
        }));

        await csvWriter.writeRecords(csvData);
        
        // Save team name mappings
        const mappingData = Array.from(this.teamNameMap.entries()).map(([key, value]) => ({
            original: key,
            normalized: value
        }));
        
        const mappingCsvWriter = createObjectCsvWriter({
            path: teamMappingPath,
            header: [
                { id: 'original', title: 'Original_Name' },
                { id: 'normalized', title: 'Normalized_Name' }
            ]
        });
        
        await mappingCsvWriter.writeRecords(mappingData);
        
        console.log(`Saved team mappings to: ${teamMappingPath}`);
        
        // Save unmatched records for review
        if (this.unmatched.fbref.length > 0 || this.unmatched.matches.length > 0) {
            const unmatchedPath = outputPath.replace('.csv', '_unmatched.json');
            fs.writeFileSync(unmatchedPath, JSON.stringify(this.unmatched, null, 2));
            console.log(`Saved unmatched records to: ${unmatchedPath}`);
        }
    }

    async mergeYearData(year) {
        const season = this.getSeasonString(year);
        const seasonWithHyphens = season.replace('_', '-');
        console.log(`\n=== Merging data for ${season} season ===`);
        
        // Determine file paths
        const fbrefFile = path.join('data', 'raw', 'fbref', `fbref_${season}_data.csv`);
        const matchDir = path.join('data', 'raw', 'matches', seasonWithHyphens);
        const outputFile = path.join('data', 'processed', `merged_${season}_data.csv`);
        const mappingFile = path.join('data', 'processed', `team_mappings_${season}.csv`);
        
        // Check if input files exist
        if (!fs.existsSync(fbrefFile)) {
            throw new Error(`FBRef file not found: ${fbrefFile}`);
        }
        
        if (!fs.existsSync(matchDir)) {
            throw new Error(`Match directory not found: ${matchDir}`);
        }
        
        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Load and merge data
        await this.loadFBRefData(fbrefFile);
        await this.loadMatchData(matchDir);
        this.mergeData();
        await this.saveResults(outputFile, mappingFile);
        
        console.log(`\n=== Merge completed for ${season} ===`);
        console.log(`Output file: ${outputFile}`);
        console.log(`Team mappings: ${mappingFile}`);
        
        return {
            outputFile,
            mappingFile,
            stats: {
                totalRecords: this.mergedData.length,
                perfectMatches: this.mergedData.filter(r => r.MatchStatus === 'merged').length,
                fbrefOnly: this.mergedData.filter(r => r.MatchStatus === 'fbref-only').length,
                matchOnly: this.mergedData.filter(r => r.MatchStatus === 'match-only').length
            }
        };
    }

    getSeasonString(year) {
        // Convert year to season format (e.g., 2024 -> "2024_2025")
        if (year >= 2021 && year <= 2025) {
            return `${year}_${year + 1}`;
        }
        throw new Error(`Unsupported year: ${year}. Available years: 2021-2025`);
    }
}

// Main execution function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node merge-football-data.js <year>');
        console.log('Example: node merge-football-data.js 2024');
        console.log('Available years: 2021, 2022, 2023, 2024');
        process.exit(1);
    }
    
    const year = parseInt(args[0]);
    if (isNaN(year)) {
        console.error('Error: Year must be a number');
        process.exit(1);
    }
    
    try {
        const merger = new FootballDataMerger();
        const result = await merger.mergeYearData(year);
        
        console.log('\n=== Summary ===');
        console.log(`Total records: ${result.stats.totalRecords}`);
        console.log(`Perfect matches: ${result.stats.perfectMatches}`);
        console.log(`FBRef only: ${result.stats.fbrefOnly}`);
        console.log(`Match files only: ${result.stats.matchOnly}`);
        console.log(`\nFiles created:`);
        console.log(`- ${result.outputFile}`);
        console.log(`- ${result.mappingFile}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { FootballDataMerger };

// Run if called directly
if (require.main === module) {
    main();
} 