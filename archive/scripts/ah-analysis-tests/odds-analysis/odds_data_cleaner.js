const fs = require('fs');
const path = require('path');

class OddsDataCleaner {
    constructor() {
        this.inputPath = path.join(__dirname, '../../data/odds-movement');
        this.outputPath = path.join(__dirname, '../../data/odds-movement-clean');
        this.stats = {
            totalFiles: 0,
            processedFiles: 0,
            corruptedFiles: 0,
            totalRecords: 0,
            validRecords: 0,
            removedPostMatch: 0,
            removedCorrupted: 0,
            removedEmpty: 0
        };
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }

    // Parse match date and time to determine start time
    parseMatchDateTime(dateString) {
        try {
            // Handle different date formats
            if (dateString.includes('T')) {
                return new Date(dateString);
            } else {
                // Assume format like "2024-12-29" and add typical match start time
                return new Date(`${dateString}T15:00:00.000Z`); // 3 PM UTC typical start
            }
        } catch (error) {
            return null;
        }
    }

    // Check if record is valid
    isValidRecord(record) {
        // Must have basic required fields
        if (!record.id || !record.home || !record.away || !record.date) {
            return false;
        }

        // Must have either handicap or odds data
        if (!record.ahAway && !record.ahHome && !record.oddsAway && !record.oddsHome) {
            return false;
        }

        // Check for obviously corrupted data
        if (record.home === record.away) {
            return false; // Same team playing itself
        }

        // Check for invalid odds values
        if (record.oddsAway && (record.oddsAway < 1.01 || record.oddsAway > 100)) {
            return false;
        }
        if (record.oddsHome && (record.oddsHome < 1.01 || record.oddsHome > 100)) {
            return false;
        }

        // Check for invalid handicap values
        if (record.ahAway && Math.abs(record.ahAway) > 10) {
            return false; // Handicaps shouldn't be this extreme
        }
        if (record.ahHome && Math.abs(record.ahHome) > 10) {
            return false;
        }

        return true;
    }

    // Check if odds timestamp is before match start
    isPreMatchOdds(record, oddsTimestamp) {
        const matchDateTime = this.parseMatchDateTime(record.date);
        
        if (!matchDateTime) {
            return false; // Can't determine match time, exclude for safety
        }

        const oddsDateTime = new Date(oddsTimestamp);
        
        // Odds should be at least 5 minutes before match start to be considered pre-match
        const bufferMinutes = 5;
        const cutoffTime = new Date(matchDateTime.getTime() - (bufferMinutes * 60 * 1000));
        
        return oddsDateTime < cutoffTime;
    }

    // Detect and fix corrupted team names
    cleanTeamName(teamName) {
        if (!teamName || typeof teamName !== 'string') {
            return null;
        }

        // Remove obvious corruption patterns
        teamName = teamName.trim();
        
        // Check if it's a numeric code (like "621", "622") - these might be valid
        if (/^\d{3,4}$/.test(teamName)) {
            return teamName; // Keep numeric codes for now
        }

        // Remove non-standard characters but keep common football team name characters
        teamName = teamName.replace(/[^\w\s\-&'.]/g, '');
        
        // Must have at least 2 characters
        if (teamName.length < 2) {
            return null;
        }

        return teamName;
    }

    // Clean individual record
    cleanRecord(record, fileTimestamp) {
        const cleaned = {
            id: record.id,
            home: this.cleanTeamName(record.home),
            away: this.cleanTeamName(record.away),
            date: record.date,
            ahHome: record.ahHome,
            ahAway: record.ahAway,
            oddsHome: record.oddsHome,
            oddsAway: record.oddsAway,
            ts: record.ts || fileTimestamp
        };

        // Only include additional fields if they exist and are valid
        if (record.homeScore && record.awayScore) {
            cleaned.homeScore = record.homeScore;
            cleaned.awayScore = record.awayScore;
        }

        if (record.totalCorner) {
            cleaned.totalCorner = record.totalCorner;
        }

        if (record.live) {
            cleaned.live = record.live;
        }

        return cleaned;
    }

    // Process single file
    processFile(filename) {
        const inputFile = path.join(this.inputPath, filename);
        const outputFile = path.join(this.outputPath, filename);
        
        try {
            const rawData = fs.readFileSync(inputFile, 'utf8');
            
            // Try to parse JSON
            let records;
            try {
                records = JSON.parse(rawData);
            } catch (parseError) {
                console.log(`❌ Corrupted JSON in ${filename}: ${parseError.message}`);
                this.stats.corruptedFiles++;
                return;
            }

            if (!Array.isArray(records)) {
                console.log(`❌ Invalid format in ${filename}: Not an array`);
                this.stats.corruptedFiles++;
                return;
            }

            const fileTimestamp = parseInt(filename.replace('.json', ''));
            const cleanedRecords = [];

            records.forEach(record => {
                this.stats.totalRecords++;

                // Check if record is empty or invalid
                if (!record || Object.keys(record).length === 0) {
                    this.stats.removedEmpty++;
                    return;
                }

                // Basic validation
                if (!this.isValidRecord(record)) {
                    this.stats.removedCorrupted++;
                    return;
                }

                // Check if this is pre-match odds
                if (!this.isPreMatchOdds(record, fileTimestamp)) {
                    this.stats.removedPostMatch++;
                    return;
                }

                // Clean the record
                const cleanedRecord = this.cleanRecord(record, fileTimestamp);
                
                // Final validation after cleaning
                if (cleanedRecord.home && cleanedRecord.away && cleanedRecord.home !== cleanedRecord.away) {
                    cleanedRecords.push(cleanedRecord);
                    this.stats.validRecords++;
                } else {
                    this.stats.removedCorrupted++;
                }
            });

            // Only save file if it has valid records
            if (cleanedRecords.length > 0) {
                fs.writeFileSync(outputFile, JSON.stringify(cleanedRecords, null, 2));
                console.log(`✅ Cleaned ${filename}: ${records.length} → ${cleanedRecords.length} records`);
            } else {
                console.log(`🗑️  Skipped ${filename}: No valid records`);
            }

            this.stats.processedFiles++;

        } catch (error) {
            console.log(`❌ Error processing ${filename}: ${error.message}`);
            this.stats.corruptedFiles++;
        }
    }

    // Clean all files
    cleanAllFiles() {
        console.log('🧹 ODDS DATA CLEANING PROCESS');
        console.log('==============================');
        console.log(`Input: ${this.inputPath}`);
        console.log(`Output: ${this.outputPath}\n`);

        const files = fs.readdirSync(this.inputPath)
            .filter(file => file.endsWith('.json'))
            .sort();

        this.stats.totalFiles = files.length;
        console.log(`📁 Found ${files.length} odds files to process\n`);

        files.forEach((file, index) => {
            if (index % 50 === 0) {
                console.log(`🔄 Processing files ${index + 1}-${Math.min(index + 50, files.length)}...`);
            }
            this.processFile(file);
        });

        this.generateReport();
    }

    // Generate cleaning report
    generateReport() {
        console.log('\n📊 CLEANING REPORT');
        console.log('==================');
        
        const report = {
            generatedAt: new Date().toISOString(),
            inputPath: this.inputPath,
            outputPath: this.outputPath,
            statistics: {
                files: {
                    total: this.stats.totalFiles,
                    processed: this.stats.processedFiles,
                    corrupted: this.stats.corruptedFiles,
                    successRate: `${((this.stats.processedFiles / this.stats.totalFiles) * 100).toFixed(1)}%`
                },
                records: {
                    total: this.stats.totalRecords,
                    valid: this.stats.validRecords,
                    removedPostMatch: this.stats.removedPostMatch,
                    removedCorrupted: this.stats.removedCorrupted,
                    removedEmpty: this.stats.removedEmpty,
                    cleanRate: `${((this.stats.validRecords / this.stats.totalRecords) * 100).toFixed(1)}%`
                }
            },
            cleaningCriteria: {
                preMatchOnly: "Removed odds captured after match start time (5min buffer)",
                validationRules: [
                    "Must have id, home, away, date",
                    "Must have handicap or odds data", 
                    "Odds between 1.01-100",
                    "Handicaps between -10 to +10",
                    "Different home and away teams",
                    "Non-empty records only"
                ]
            }
        };

        // Display summary
        console.log(`📁 Files: ${report.statistics.files.processed}/${report.statistics.files.total} processed (${report.statistics.files.successRate})`);
        console.log(`📊 Records: ${report.statistics.records.valid}/${report.statistics.records.total} clean (${report.statistics.records.cleanRate})`);
        console.log(`\n🗑️  Removed:`);
        console.log(`   • ${this.stats.removedPostMatch} post-match odds`);
        console.log(`   • ${this.stats.removedCorrupted} corrupted records`);
        console.log(`   • ${this.stats.removedEmpty} empty records`);
        console.log(`   • ${this.stats.corruptedFiles} corrupted files`);

        // Save report
        const reportPath = path.join(this.outputPath, 'cleaning_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n💾 Cleaning report saved: ${reportPath}`);
        console.log(`✅ Clean data ready for analysis in: ${this.outputPath}`);

        return report;
    }

    // Quick validation of cleaned data
    validateCleanedData() {
        console.log('\n🔍 VALIDATING CLEANED DATA');
        console.log('===========================');

        const files = fs.readdirSync(this.outputPath)
            .filter(file => file.endsWith('.json') && file !== 'cleaning_report.json')
            .slice(0, 5); // Check first 5 files

        files.forEach(file => {
            const filePath = path.join(this.outputPath, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            console.log(`📄 ${file}: ${data.length} records`);
            
            if (data.length > 0) {
                const sample = data[0];
                console.log(`   Sample: ${sample.home} vs ${sample.away} (${sample.date})`);
                console.log(`   Handicap: ${sample.ahAway} | Odds: ${sample.oddsAway}`);
                console.log(`   Timestamp: ${new Date(sample.ts).toISOString()}`);
            }
        });
    }
}

// Main execution
if (require.main === module) {
    const cleaner = new OddsDataCleaner();
    
    console.log('Starting odds data cleaning process...\n');
    
    cleaner.cleanAllFiles();
    cleaner.validateCleanedData();
    
    console.log('\n🎉 Data cleaning completed!');
    console.log('You can now use the clean data for accurate pre-match analysis.');
}

module.exports = OddsDataCleaner; 