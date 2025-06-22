const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class TeamMappingUpdater {
    constructor() {
        this.existingMappings = new Map();
        this.discoveredTeams = {
            match: new Set(),
            fbref: new Set()
        };
        this.newMappings = [];
    }

    // Load existing team mappings
    async loadExistingMappings() {
        console.log('Loading existing team mapping from data/raw/team-mapping.csv');
        
        return new Promise((resolve, reject) => {
            const mappings = [];
            fs.createReadStream('data/raw/team-mapping.csv')
                .pipe(csv())
                .on('data', (row) => {
                    mappings.push(row);
                })
                .on('end', () => {
                    // Build mapping of original names to normalized names
                    mappings.forEach(row => {
                        this.existingMappings.set(row.Original_Name, row.Normalized_Name);
                    });
                    console.log(`Loaded ${this.existingMappings.size} existing team mappings`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    // Helper function to validate team names
    isValidTeamName(name) {
        if (!name || name.length < 2) return false;
        if (name === 'vs' || name === 'Home' || name === 'Away') return false;
        if (/^\d+$/.test(name)) return false;
        if (name.includes(':')) return false;
        if (name.includes('/')) return false; // Date format
        if (name.includes('[') || name.includes(']')) return false; // Odds format
        return true;
    }

    // Parse team names from match file
    parseMatchFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);
            
            if (lines.length < 10) return [];
            
            const teams = [];
            
            // Find team names around "vs"
            const vsIndex = lines.findIndex(line => line.toLowerCase() === 'vs');
            
            if (vsIndex > 1) {
                // Extract home team from lines before "vs"
                const homeLines = [];
                for (let i = 2; i < vsIndex; i++) {
                    if (lines[i] && this.isValidTeamName(lines[i])) {
                        homeLines.push(lines[i]);
                    }
                }
                if (homeLines.length > 0) {
                    const homeTeam = homeLines.join(' ');
                    teams.push(homeTeam);
                }
                
                // Extract away team from lines after "vs"
                const awayLines = [];
                for (let i = vsIndex + 1; i < Math.min(vsIndex + 4, lines.length); i++) {
                    if (lines[i] && this.isValidTeamName(lines[i]) && !lines[i].includes(':')) {
                        awayLines.push(lines[i]);
                    }
                }
                if (awayLines.length > 0) {
                    const awayTeam = awayLines.join(' ');
                    teams.push(awayTeam);
                }
            }
            
            return teams;
        } catch (error) {
            console.warn(`Error parsing match file ${filePath}:`, error.message);
            return [];
        }
    }

    // Scan all match files in all seasons
    async scanMatchFiles() {
        console.log('Scanning match files for team names...');
        
        const matchesDir = 'data/raw/matches';
        const seasons = fs.readdirSync(matchesDir).filter(item => 
            fs.statSync(path.join(matchesDir, item)).isDirectory()
        );
        
        let totalFiles = 0;
        for (const season of seasons) {
            console.log(`  Scanning season: ${season}`);
            const seasonDir = path.join(matchesDir, season);
            const files = fs.readdirSync(seasonDir).filter(file => file.endsWith('.txt'));
            
            for (const file of files) {
                const filePath = path.join(seasonDir, file);
                const teams = this.parseMatchFile(filePath);
                teams.forEach(team => this.discoveredTeams.match.add(team));
                totalFiles++;
            }
        }
        
        console.log(`  Found ${this.discoveredTeams.match.size} unique team names from ${totalFiles} match files`);
    }

    // Scan all FBRef files
    async scanFBRefFiles() {
        console.log('Scanning FBRef files for team names...');
        
        const fbrefDir = 'data/raw/fbref';
        const seasons = fs.readdirSync(fbrefDir).filter(item => 
            fs.statSync(path.join(fbrefDir, item)).isDirectory()
        );
        
        for (const season of seasons) {
            console.log(`  Scanning FBRef season: ${season}`);
            const csvFile = path.join(fbrefDir, season, `fbref_${season.replace('-', '_')}_data.csv`);
            
            if (fs.existsSync(csvFile)) {
                await this.scanFBRefFile(csvFile);
            } else {
                console.warn(`    FBRef file not found: ${csvFile}`);
            }
        }
        
        console.log(`  Found ${this.discoveredTeams.fbref.size} unique team names from FBRef files`);
    }

    // Scan individual FBRef file
    async scanFBRefFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.HomeTeam && this.isValidTeamName(row.HomeTeam)) {
                        this.discoveredTeams.fbref.add(row.HomeTeam.trim());
                    }
                    if (row.AwayTeam && this.isValidTeamName(row.AwayTeam)) {
                        this.discoveredTeams.fbref.add(row.AwayTeam.trim());
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });
    }

    // Find potential mappings using fuzzy matching
    findPotentialMappings() {
        console.log('Analyzing team name variations...');
        
        const allTeams = new Set([
            ...this.discoveredTeams.match,
            ...this.discoveredTeams.fbref
        ]);
        
        const unmappedTeams = [...allTeams].filter(team => 
            !this.existingMappings.has(team)
        );
        
        console.log(`Found ${unmappedTeams.length} unmapped team names`);
        
        // Group similar team names
        const potentialGroups = new Map();
        
        unmappedTeams.forEach(team => {
            // Simple heuristics for grouping
            const keywords = this.extractKeywords(team);
            const keywordKey = keywords.join(' ').toLowerCase();
            
            if (!potentialGroups.has(keywordKey)) {
                potentialGroups.set(keywordKey, []);
            }
            potentialGroups.get(keywordKey).push(team);
        });
        
        // Suggest mappings
        potentialGroups.forEach((teams, keywordKey) => {
            if (teams.length > 1) {
                console.log(`\nPotential group (${keywordKey}):`);
                teams.forEach(team => console.log(`  - ${team}`));
                
                // Use the longest/most complete name as canonical
                const canonical = teams.reduce((longest, current) => 
                    current.length > longest.length ? current : longest
                );
                
                teams.forEach(team => {
                    if (team !== canonical) {
                        this.newMappings.push({
                            Original_Name: team,
                            Normalized_Name: canonical
                        });
                    }
                });
            } else {
                // Single team, map to itself
                this.newMappings.push({
                    Original_Name: teams[0],
                    Normalized_Name: teams[0]
                });
            }
        });
    }

    // Extract keywords from team name for grouping
    extractKeywords(teamName) {
        return teamName
            .toLowerCase()
            .replace(/['']/g, '') // Remove apostrophes
            .replace(/&/g, 'and')
            .split(/\s+/)
            .filter(word => 
                word.length > 2 && 
                !['the', 'and', 'utd', 'united', 'city', 'town', 'fc'].includes(word)
            )
            .sort();
    }

    // Update the team-mapping.csv file
    async updateMappingFile() {
        console.log(`\nUpdating team-mapping.csv with ${this.newMappings.length} new mappings...`);
        
        if (this.newMappings.length === 0) {
            console.log('No new mappings to add.');
            return;
        }
        
        // Read existing file content
        const existingContent = fs.readFileSync('data/raw/team-mapping.csv', 'utf8');
        
        // Create backup
        const backupFile = `data/raw/team-mapping.csv.backup.${Date.now()}`;
        fs.writeFileSync(backupFile, existingContent);
        console.log(`Created backup: ${backupFile}`);
        
        // Append new mappings
        const newLines = this.newMappings.map(mapping => 
            `${mapping.Original_Name},${mapping.Normalized_Name}`
        ).join('\n');
        
        const updatedContent = existingContent.trim() + '\n' + newLines;
        fs.writeFileSync('data/raw/team-mapping.csv', updatedContent);
        
        console.log('team-mapping.csv updated successfully!');
        
        // Show what was added
        console.log('\nNew mappings added:');
        this.newMappings.forEach(mapping => {
            console.log(`  ${mapping.Original_Name} -> ${mapping.Normalized_Name}`);
        });
    }

    // Generate report
    generateReport() {
        console.log('\n=== TEAM NAME DISCOVERY REPORT ===');
        console.log(`Match files: ${this.discoveredTeams.match.size} unique team names`);
        console.log(`FBRef files: ${this.discoveredTeams.fbref.size} unique team names`);
        console.log(`Existing mappings: ${this.existingMappings.size}`);
        console.log(`New mappings added: ${this.newMappings.length}`);
        
        // Show some examples
        console.log('\nSample team names from match files:');
        [...this.discoveredTeams.match].slice(0, 10).forEach(team => 
            console.log(`  - ${team}`)
        );
        
        console.log('\nSample team names from FBRef files:');
        [...this.discoveredTeams.fbref].slice(0, 10).forEach(team => 
            console.log(`  - ${team}`)
        );
    }

    // Main process
    async run() {
        try {
            await this.loadExistingMappings();
            await this.scanMatchFiles();
            await this.scanFBRefFiles();
            this.findPotentialMappings();
            await this.updateMappingFile();
            this.generateReport();
        } catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    console.log('=== TEAM MAPPING UPDATER ===\n');
    
    const updater = new TeamMappingUpdater();
    await updater.run();
}

main(); 