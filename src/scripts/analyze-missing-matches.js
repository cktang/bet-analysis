const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class MissingMatchAnalyzer {
    constructor() {
        this.teamMapping = new Map();
        this.fbrefTeams = new Set();
        this.matchKeys = new Set();
        this.fbrefKeys = new Set();
    }

    // Load team mapping
    async loadTeamMapping() {
        return new Promise((resolve, reject) => {
            fs.createReadStream('data/raw/team-mapping.csv')
                .pipe(csv())
                .on('data', (row) => {
                    this.teamMapping.set(row.Original_Name, row.Normalized_Name);
                })
                .on('end', resolve)
                .on('error', reject);
        });
    }

    // Normalize team name using mapping
    normalizeTeamName(teamName) {
        if (!teamName) return '';
        const trimmed = teamName.trim();
        return this.teamMapping.get(trimmed) || trimmed;
    }

    // Load FBRef data and analyze team names
    async analyzeFBRefData() {
        console.log('Analyzing FBRef 2023-2024 data...');
        
        const fbrefFile = 'data/raw/fbref/2023-2024/fbref_2023_2024_data.csv';
        
        return new Promise((resolve, reject) => {
            const records = [];
            fs.createReadStream(fbrefFile)
                .pipe(csv())
                .on('data', (row) => {
                    records.push(row);
                    // Track all team names from FBRef
                    if (row.HomeTeam) this.fbrefTeams.add(row.HomeTeam.trim());
                    if (row.AwayTeam) this.fbrefTeams.add(row.AwayTeam.trim());
                })
                .on('end', () => {
                    console.log(`FBRef records: ${records.length}`);
                    console.log(`Unique FBRef team names: ${this.fbrefTeams.size}`);
                    
                    // Create FBRef keys
                    records.forEach(record => {
                        const homeNormalized = this.normalizeTeamName(record.HomeTeam);
                        const awayNormalized = this.normalizeTeamName(record.AwayTeam);
                        if (homeNormalized && awayNormalized) {
                            const key = `${homeNormalized} v ${awayNormalized}`;
                            this.fbrefKeys.add(key);
                        }
                    });
                    
                    resolve();
                })
                .on('error', reject);
        });
    }

    // Load the generated JSON and analyze missing matches
    analyzeGeneratedJson() {
        console.log('Analyzing generated 2023-2024 JSON...');
        
        const jsonData = JSON.parse(fs.readFileSync('data/processed/year-2023-2024.json', 'utf8'));
        
        const matchesWithoutFBRef = [];
        const matchesWithFBRef = [];
        
        Object.entries(jsonData.matches).forEach(([key, data]) => {
            this.matchKeys.add(key);
            
            if (data.fbref) {
                matchesWithFBRef.push({
                    key,
                    homeTeam: data.match.homeTeam,
                    awayTeam: data.match.awayTeam
                });
            } else {
                matchesWithoutFBRef.push({
                    key,
                    homeTeam: data.match.homeTeam,
                    awayTeam: data.match.awayTeam,
                    eventId: data.match.eventId
                });
            }
        });
        
        console.log(`\nMatches WITH FBRef: ${matchesWithFBRef.length}`);
        console.log(`Matches WITHOUT FBRef: ${matchesWithoutFBRef.length}`);
        
        console.log(`\n=== MATCHES WITHOUT FBREF DATA ===`);
        matchesWithoutFBRef.forEach(match => {
            console.log(`${match.key} (${match.eventId})`);
            console.log(`  Home: "${match.homeTeam}" -> "${this.normalizeTeamName(match.homeTeam)}"`);
            console.log(`  Away: "${match.awayTeam}" -> "${this.normalizeTeamName(match.awayTeam)}"`);
        });
        
        return matchesWithoutFBRef;
    }

    // Check what team names are in FBRef but not being matched
    analyzeTeamNameGaps() {
        console.log(`\n=== TEAM NAME ANALYSIS ===`);
        console.log(`FBRef teams: ${[...this.fbrefTeams].sort().join(', ')}`);
        
        // Check which FBRef team names are not in our mapping
        const unmappedFBRefTeams = [...this.fbrefTeams].filter(team => 
            !this.teamMapping.has(team) && team !== this.normalizeTeamName(team)
        );
        
        if (unmappedFBRefTeams.length > 0) {
            console.log(`\nUnmapped FBRef team names:`);
            unmappedFBRefTeams.forEach(team => {
                console.log(`  - "${team}" -> maps to "${this.normalizeTeamName(team)}"`);
            });
        } else {
            console.log(`\nAll FBRef team names are mapped.`);
        }
        
        // Check key mismatches
        console.log(`\n=== KEY ANALYSIS ===`);
        console.log(`Match keys: ${this.matchKeys.size}`);
        console.log(`FBRef keys: ${this.fbrefKeys.size}`);
        
        const unmatchedMatchKeys = [...this.matchKeys].filter(key => !this.fbrefKeys.has(key));
        const unmatchedFBRefKeys = [...this.fbrefKeys].filter(key => !this.matchKeys.has(key));
        
        console.log(`\nMatch keys without FBRef match:`);
        unmatchedMatchKeys.slice(0, 10).forEach(key => console.log(`  - ${key}`));
        if (unmatchedMatchKeys.length > 10) {
            console.log(`  ... and ${unmatchedMatchKeys.length - 10} more`);
        }
        
        console.log(`\nFBRef keys without match file:`);
        unmatchedFBRefKeys.slice(0, 10).forEach(key => console.log(`  - ${key}`));
        if (unmatchedFBRefKeys.length > 10) {
            console.log(`  ... and ${unmatchedFBRefKeys.length - 10} more`);
        }
    }

    async run() {
        await this.loadTeamMapping();
        await this.analyzeFBRefData();
        this.analyzeGeneratedJson();
        this.analyzeTeamNameGaps();
    }
}

async function main() {
    console.log('=== MISSING MATCH ANALYZER ===\n');
    
    const analyzer = new MissingMatchAnalyzer();
    await analyzer.run();
}

main(); 