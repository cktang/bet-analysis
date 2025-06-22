const fs = require('fs');
const path = require('path');

/**
 * Universal CSV Fix - Creates CSV with Windows line endings
 */
function createUniversalCSV() {
    const sourceFile = path.join(__dirname, 'betting-records/relegation_strategy_week25plus.csv');
    const outputFile = path.join(__dirname, 'betting-records/relegation_strategy_universal.csv');
    
    try {
        // Read original file content
        const content = fs.readFileSync(sourceFile, 'utf8');
        console.log(`📖 Reading source file: ${content.length} characters`);
        
        // Replace literal \n with actual Windows line endings \r\n
        const windowsContent = content.replace(/\\n/g, '\r\n');
        
        // Write with Windows line endings
        fs.writeFileSync(outputFile, windowsContent, 'utf8');
        
        // Verify the file
        const stats = fs.statSync(outputFile);
        console.log(`✅ Universal CSV created: ${outputFile}`);
        console.log(`📏 Size: ${stats.size} bytes`);
        
        // Count lines
        const lines = windowsContent.split('\r\n');
        console.log(`📊 Total lines: ${lines.length}`);
        
        // Show first few lines
        console.log('\n📋 First 3 lines:');
        lines.slice(0, 3).forEach((line, index) => {
            console.log(`${index + 1}: ${line.substring(0, 80)}...`);
        });
        
        // Also create a Mac/Unix version with just \n
        const unixContent = content.replace(/\\n/g, '\n');
        const unixFile = path.join(__dirname, 'betting-records/relegation_strategy_unix.csv');
        fs.writeFileSync(unixFile, unixContent, 'utf8');
        console.log(`✅ Unix CSV created: ${unixFile}`);
        
        console.log('\n🎯 CSV files created with different line endings:');
        console.log(`   Windows (\\r\\n): ${outputFile}`);
        console.log(`   Unix/Mac (\\n): ${unixFile}`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

createUniversalCSV();