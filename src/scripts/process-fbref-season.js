#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parseMatchIncidents } = require('./parse-fbref-match-incidents');

/**
 * Process FBRef season data and save directly to raw data directory
 */
async function processFBRefSeason(year, options = {}) {
    const {
        delay = 5000,
        maxRetries = 3,
        outputDir = 'data/raw/fbref',
        logLevel = 'info',
        testMode = false,
        maxMatches = testMode ? 3 : Infinity
    } = options;

    console.log(`🚀 Starting FBRef processing for ${year}...`);
    
    // Setup directories - season-based structure
    const seasonDir = `${year}-${parseInt(year) + 1}`;
    const yearOutputDir = path.join(outputDir, seasonDir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(yearOutputDir)) {
        fs.mkdirSync(yearOutputDir, { recursive: true });
        console.log(`📁 Created directory: ${yearOutputDir}`);
    }

    // Find FBRef CSV file
    const fbrefPath = path.join('data', 'raw', 'fbref', seasonDir, `fbref_${year}_${parseInt(year) + 1}_data.csv`);
    
    if (!fs.existsSync(fbrefPath)) {
        throw new Error(`FBRef CSV file not found: ${fbrefPath}`);
    }

    console.log(`📊 Reading FBRef data from: ${fbrefPath}`);

    // Read and process matches
    const matches = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(fbrefPath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.Match_Report_URL && row.Match_Report_URL.trim()) {
                    matches.push({
                        url: row.Match_Report_URL.trim(),
                        homeTeam: row.Home_Team || 'Unknown',
                        awayTeam: row.Away_Team || 'Unknown',
                        date: row.Date || 'Unknown',
                        matchweek: row.Matchweek || 'Unknown',
                        homeScore: row.Home_Score || 0,
                        awayScore: row.Away_Score || 0
                    });
                }
            })
            .on('end', async () => {
                // Limit matches for testing
                if (testMode && matches.length > maxMatches) {
                    matches.splice(maxMatches);
                    console.log(`🧪 Test mode: Limited to ${maxMatches} matches`);
                }
                
                console.log(`📋 Found ${matches.length} matches to process`);
                
                const results = {
                    total: matches.length,
                    processed: 0,
                    successful: 0,
                    failed: 0,
                    summary: {
                        successfulMatches: [],
                        failedMatches: []
                    }
                };

                // Process matches with rate limiting
                for (let i = 0; i < matches.length; i++) {
                    const match = matches[i];
                    const progress = `${i + 1}/${matches.length}`;
                    
                    console.log(`\n🔄 [${progress}] Processing: ${match.homeTeam} vs ${match.awayTeam}`);
                    
                    try {
                        const incidentData = await processMatchWithRetry(match, maxRetries);
                        
                        // Generate filename
                        const filename = generateFilename(match, incidentData);
                        const outputPath = path.join(yearOutputDir, filename);
                        
                        // Save incident data
                        fs.writeFileSync(outputPath, JSON.stringify(incidentData, null, 2));
                        
                        console.log(`✅ Saved: ${filename}`);
                        results.processed++;
                        results.successful++;
                        
                        results.summary.successfulMatches.push({
                            filename,
                            teams: `${incidentData.homeTeam} vs ${incidentData.awayTeam}`,
                            score: incidentData.score,
                            date: incidentData.matchDate
                        });
                        
                    } catch (error) {
                        console.error(`❌ Failed to process match: ${error.message}`);
                        
                        results.failed++;
                        results.summary.failedMatches.push({
                            teams: `${match.homeTeam} vs ${match.awayTeam}`,
                            error: error.message
                        });
                    }
                    
                    // Rate limiting - be respectful to FBRef
                    if (i < matches.length - 1) {
                        console.log(`⏳ Waiting ${delay}ms before next request...`);
                        await sleep(delay);
                    }
                }
                
                // Save processing summary
                const summaryPath = path.join(yearOutputDir, 'processing-summary.json');
                fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
                
                console.log(`\n🎉 Processing complete!`);
                console.log(`📊 Results: ${results.processed} processed, ${results.successful} successful, ${results.failed} failed`);
                console.log(`📁 Output saved to: ${yearOutputDir}`);
                
                resolve(results);
            })
            .on('error', reject);
    });
}

/**
 * Process a single match with retry logic
 */
async function processMatchWithRetry(match, maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await parseMatchIncidents(match.url);
        } catch (error) {
            lastError = error;
            console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                let retryDelay = attempt * 2000;
                
                if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    retryDelay = attempt * 10000;
                    console.log(`🚫 Rate limit hit, using longer delay...`);
                }
                
                console.log(`🔄 Retrying in ${retryDelay}ms...`);
                await sleep(retryDelay);
            }
        }
    }
    
    throw lastError;
}

/**
 * Generate clean filename from match data
 */
function generateFilename(match, incidentData) {
    const homeTeam = (incidentData.homeTeam || match.homeTeam).replace(/[^a-zA-Z0-9]/g, '_');
    const awayTeam = (incidentData.awayTeam || match.awayTeam).replace(/[^a-zA-Z0-9]/g, '_');
    const score = incidentData.score || `${match.homeScore}-${match.awayScore}`;
    const date = (incidentData.matchDate || match.date).replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${homeTeam}_vs_${awayTeam}_${score}_${date}.json`;
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to handle CLI arguments
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Usage: node src/scripts/process-fbref-season.js <year> [options]

Arguments:
  <year>        Year to process (e.g., 2024)

Options:
  --delay       Delay between requests in ms (default: 5000)
  --retries     Max retries per match (default: 3)
  --output      Output directory (default: data/raw/fbref)
  --test        Test mode - process only first 3 matches

Examples:
  node src/scripts/process-fbref-season.js 2024
  node src/scripts/process-fbref-season.js 2023 --delay 3000 --retries 5
        `);
        process.exit(1);
    }
    
    const year = args[0];
    const options = {};
    
    // Parse options
    for (let i = 1; i < args.length; i += 2) {
        const option = args[i];
        const value = args[i + 1];
        
        switch (option) {
            case '--delay':
                options.delay = parseInt(value);
                break;
            case '--retries':
                options.maxRetries = parseInt(value);
                break;
            case '--output':
                options.outputDir = value;
                break;
            case '--test':
                options.testMode = true;
                i--; // No value for this flag
                break;
        }
    }
    
    try {
        await processFBRefSeason(year, options);
        console.log('✨ Processing completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('💥 Processing failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { processFBRefSeason }; 