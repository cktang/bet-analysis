const fs = require('fs');
const path = require('path');

/**
 * Final CSV Fix - Replace \n with actual line breaks
 */
function fixCSVFile() {
    const inputFile = path.join(__dirname, 'betting-records/relegation_strategy_week25plus.csv');
    const outputFile = path.join(__dirname, 'betting-records/relegation_strategy_week25plus_fixed.csv');
    
    try {
        // Read the file
        const content = fs.readFileSync(inputFile, 'utf8');
        console.log(`📖 Read file: ${content.length} characters`);
        
        // Replace \n with actual line breaks
        const fixedContent = content.replace(/\\n/g, '\n');
        
        // Write the fixed file
        fs.writeFileSync(outputFile, fixedContent, 'utf8');
        
        // Verify the fix
        const stats = fs.statSync(outputFile);
        console.log(`✅ Fixed CSV saved to: ${outputFile}`);
        console.log(`📏 Size: ${stats.size} bytes`);
        
        // Count lines
        const lines = fixedContent.split('\n');
        console.log(`📊 Total lines: ${lines.length}`);
        
        // Show first few lines
        console.log('\n📋 First 5 lines:');
        lines.slice(0, 5).forEach((line, index) => {
            console.log(`${index + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        });
        
        // Also create a backup of the original file data in readable format
        const readableFile = path.join(__dirname, 'betting-records/relegation_strategy_readable.txt');
        const readableContent = `RELEGATION STRATEGY BETTING RECORDS\n` +
                               `===============================\n\n` +
                               `Total Bets: ${lines.length - 1}\n` +
                               `Generated: ${new Date().toISOString()}\n\n` +
                               `Sample Bets:\n` +
                               `${lines.slice(1, 11).map((line, i) => `${i+1}. ${line}`).join('\n')}\n\n` +
                               `Full CSV Data:\n` +
                               `${fixedContent}`;
        
        fs.writeFileSync(readableFile, readableContent, 'utf8');
        console.log(`📄 Readable backup saved to: ${readableFile}`);
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

fixCSVFile();