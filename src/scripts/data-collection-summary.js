#!/usr/bin/env node

/**
 * Summary script to show what data has been collected
 */

const fs = require('fs');
const path = require('path');

function countFiles(directory, pattern) {
    try {
        if (!fs.existsSync(directory)) {
            return 0;
        }
        const files = fs.readdirSync(directory);
        if (pattern) {
            return files.filter(file => file.match(pattern)).length;
        }
        return files.length;
    } catch (error) {
        return 0;
    }
}

function getFileSize(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return 0;
        }
        const stats = fs.statSync(filePath);
        return (stats.size / 1024).toFixed(1); // KB
    } catch (error) {
        return 0;
    }
}

function main() {
    console.log('🎯 Data Collection Summary\n');
    
    // HKJC Data
    const hkjcDir = '/Users/kin/Code/bet-analysis/data/raw/Eng Premier/2024-2025';
    const april2025 = countFiles(hkjcDir, /^202504/);
    const may2025 = countFiles(hkjcDir, /^202505/);
    const june2025 = countFiles(hkjcDir, /^202506/);
    const totalHkjc = april2025 + may2025 + june2025;
    
    console.log('📊 HKJC Results (April-June 2025):');
    console.log(`   April 2025: ${april2025} files`);
    console.log(`   May 2025: ${may2025} files`);
    console.log(`   June 2025: ${june2025} files`);
    console.log(`   Total: ${totalHkjc} files\n`);
    
    // OddsPortal Data
    const oddsFile = '/Users/kin/Code/bet-analysis/data/raw/Eng Premier/odds/oddsportal-result.txt';
    const oddsSize = getFileSize(oddsFile);
    console.log('📊 OddsPortal Results (2024-2025 season):');
    console.log(`   File size: ${oddsSize} KB`);
    console.log(`   Status: ${fs.existsSync(oddsFile) ? '✅ Collected' : '❌ Missing'}\n`);
    
    // FBref Data  
    const fbrefFile = '/Users/kin/Code/bet-analysis/data/raw/fbref/fbref_2024_2025_data.csv';
    const fbrefSize = getFileSize(fbrefFile);
    console.log('📊 FBref Schedule (2024-2025 season):');
    console.log(`   File size: ${fbrefSize} KB`);
    console.log(`   Status: ${fs.existsSync(fbrefFile) ? '✅ Collected' : '❌ Missing'}\n`);
    
    // Summary
    console.log('📁 Raw Data Locations:');
    console.log(`   HKJC: ${hkjcDir}`);
    console.log(`   OddsPortal: ${path.dirname(oddsFile)}`);
    console.log(`   FBref: ${path.dirname(fbrefFile)}\n`);
    
    console.log('🎉 Data collection completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run parsers to process the raw data');
    console.log('   2. Run data-joiner to merge processed data');
    console.log('   3. Run analysis scripts to update insights');
}

if (require.main === module) {
    main();
}

module.exports = { countFiles, getFileSize };