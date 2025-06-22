#!/usr/bin/env node

/**
 * Master script to scrape all data sources for a given date range
 * Usage: node scrape-all-data.js --start-year=2025 --start-month=04 --end-year=2025 --end-month=06 --season=2024-2025
 * 
 * Note: 
 * - HKJC scraper can target specific months within a season
 * - OddsPortal and FBref scrapers work by full seasons (e.g., 2024-2025)
 * - For 2025 data, use season=2024-2025 since that covers Jan-May 2025
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const params = {};
    
    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            params[key.replace('-', '_').toUpperCase()] = value;
        }
    });
    
    // Set defaults
    params.START_YEAR = params.START_YEAR || '2025';
    params.START_MONTH = params.START_MONTH || '04';
    params.END_YEAR = params.END_YEAR || '2025';
    params.END_MONTH = params.END_MONTH || '06';
    params.TARGET_SEASON = params.SEASON || '2024-2025';
    
    return params;
}

// Run a command with environment variables
function runCommand(command, args, env = {}) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Running: ${command} ${args.join(' ')}`);
        console.log(`📅 Date range: ${env.START_YEAR}-${env.START_MONTH} to ${env.END_YEAR}-${env.END_MONTH}\n`);
        
        const childEnv = { ...process.env, ...env };
        const child = spawn(command, args, { 
            stdio: 'inherit', 
            env: childEnv,
            cwd: path.resolve(__dirname, '../..')
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${command} completed successfully\n`);
                resolve();
            } else {
                console.error(`❌ ${command} failed with exit code ${code}\n`);
                reject(new Error(`Command failed: ${command}`));
            }
        });
    });
}

async function main() {
    const params = parseArgs();
    
    console.log('🎯 Starting data scraping with parameters:');
    console.log(`   HKJC Date Range: ${params.START_YEAR}-${params.START_MONTH} to ${params.END_YEAR}-${params.END_MONTH}`);
    console.log(`   Season (OddsPortal/FBref): ${params.TARGET_SEASON}`);
    console.log('');
    
    try {
        // 1. Run HKJC scraper
        console.log('📊 Step 1: Scraping HKJC results...');
        await runCommand('npx', ['playwright', 'test', 'scrap-hkjc-result.spec.ts'], params);
        
        // 2. Run OddsPortal scraper  
        console.log('📊 Step 2: Scraping OddsPortal results...');
        await runCommand('npx', ['playwright', 'test', 'scrap-oddsportal-result.spec.ts'], { TARGET_SEASON: params.TARGET_SEASON });
        
        // 3. Run FBref scraper
        console.log('📊 Step 3: Scraping FBref schedule...');
        await runCommand('node', ['src/parsers/scrap-fbref-schedule.js', params.TARGET_SEASON]);
        
        console.log('🎉 All scraping completed successfully!');
        console.log('\n📁 Raw data has been collected in:');
        console.log('   - data/raw/Eng Premier/ (HKJC results)');
        console.log('   - data/raw/Eng Premier/odds/ (OddsPortal data)');
        console.log('   - stdout (FBref data - redirect to file if needed)');
        console.log('\n💡 Next steps:');
        console.log('   1. Run parsers to process the raw data');
        console.log('   2. Run data-joiner to merge processed data');
        console.log('   3. Run analysis scripts to update insights');
        
    } catch (error) {
        console.error('💥 Scraping failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runCommand, parseArgs };