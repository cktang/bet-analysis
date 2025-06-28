#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const _ = require('lodash');

class DeterminismVerifier {
    constructor() {
        this.resultsDir = path.join(__dirname, '..', 'results');
        this.backupDir = path.join(__dirname, '..', 'results_backup_verification');
        this.testerScript = path.join(__dirname, 'ah_combination_tester.js');
        this.summaryPath = path.join(this.resultsDir, 'summary.json');
    }

    async runVerification(iterations = 3) {
        console.log('🔍 Starting Determinism Verification');
        console.log(`Running ah-combination-tester ${iterations} times to verify identical results`);
        console.log('=' * 70);

        // Step 1: Backup existing results
        await this.backupExistingResults();

        const results = [];
        
        try {
            // Step 2: Run the tester multiple times
            for (let i = 1; i <= iterations; i++) {
                console.log(`\n🔄 Run ${i}/${iterations}`);
                console.log('-' * 30);
                
                const runResult = await this.runTesterAndCapture(i);
                results.push(runResult);
                
                console.log(`✅ Run ${i} completed`);
                console.log(`   Strategies analyzed: ${runResult.summary?.strategies?.length || 'N/A'}`);
                console.log(`   Best ROI: ${runResult.bestROI || 'N/A'}`);
            }

            // Step 3: Compare all results
            const comparison = this.compareResults(results);
            
            // Step 4: Generate report
            this.generateReport(comparison, results);
            
        } catch (error) {
            console.error('❌ Error during verification:', error.message);
        } finally {
            // Step 5: Restore original results
            await this.restoreOriginalResults();
        }
    }

    async backupExistingResults() {
        console.log('💾 Backing up existing results...');
        
        if (fs.existsSync(this.resultsDir)) {
            if (fs.existsSync(this.backupDir)) {
                // Remove old backup
                execSync(`rm -rf "${this.backupDir}"`);
            }
            
            // Create backup
            execSync(`cp -r "${this.resultsDir}" "${this.backupDir}"`);
            console.log(`✅ Backup created at: ${this.backupDir}`);
        }
    }

    async restoreOriginalResults() {
        console.log('\n🔄 Restoring original results...');
        
        if (fs.existsSync(this.backupDir)) {
            // Remove current results
            if (fs.existsSync(this.resultsDir)) {
                execSync(`rm -rf "${this.resultsDir}"`);
            }
            
            // Restore backup
            execSync(`mv "${this.backupDir}" "${this.resultsDir}"`);
            console.log('✅ Original results restored');
        }
    }

    async runTesterAndCapture(runNumber) {
        try {
            // Run the combination tester
            console.log('   Running ah_combination_tester.js...');
            const output = execSync(`node "${this.testerScript}"`, { 
                encoding: 'utf8',
                cwd: path.dirname(this.testerScript),
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });
            
            // Read the generated summary
            if (fs.existsSync(this.summaryPath)) {
                const summaryData = JSON.parse(fs.readFileSync(this.summaryPath, 'utf8'));
                
                // Read a few sample betting records for detailed comparison
                const sampleRecords = this.readSampleBettingRecords();
                
                return {
                    runNumber,
                    summary: summaryData,
                    sampleRecords,
                    bestROI: summaryData.metadata?.bestROI,
                    totalStrategies: summaryData.metadata?.totalStrategies,
                    output: output.substring(0, 500) // First 500 chars of output
                };
            } else {
                throw new Error('Summary file not generated');
            }
            
        } catch (error) {
            console.error(`   ❌ Error in run ${runNumber}:`, error.message);
            throw error;
        }
    }

    readSampleBettingRecords() {
        const records = {};
        const resultsFiles = fs.readdirSync(this.resultsDir)
            .filter(file => file.endsWith('_betting_records.json'))
            .slice(0, 3); // Sample first 3 files
        
        resultsFiles.forEach(file => {
            try {
                const filePath = path.join(this.resultsDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Store key metrics, excluding timestamps
                records[file] = {
                    totalBets: data.summary?.totalBets,
                    totalProfit: data.summary?.totalProfit,
                    winRate: data.summary?.winRate,
                    firstBetSample: data.bettingRecords?.[0] ? {
                        bet: data.bettingRecords[0].bet,
                        outcome: data.bettingRecords[0].outcome,
                        profit: data.bettingRecords[0].profit
                    } : null
                };
            } catch (error) {
                console.log(`   Warning: Could not read ${file}`);
            }
        });
        
        return records;
    }

    compareResults(results) {
        console.log('\n🔍 Comparing results across runs...');
        
        if (results.length < 2) {
            return { identical: false, error: 'Need at least 2 runs to compare' };
        }

        const comparison = {
            identical: true,
            differences: [],
            summary: {
                strategiesMatch: true,
                roiMatch: true,
                recordsMatch: true
            }
        };

        const baseline = results[0];
        
        for (let i = 1; i < results.length; i++) {
            const current = results[i];
            
            // Compare total strategies
            if (baseline.totalStrategies !== current.totalStrategies) {
                comparison.identical = false;
                comparison.summary.strategiesMatch = false;
                comparison.differences.push({
                    type: 'totalStrategies',
                    baseline: baseline.totalStrategies,
                    run: i + 1,
                    current: current.totalStrategies
                });
            }
            
            // Compare best ROI
            if (Math.abs((baseline.bestROI || 0) - (current.bestROI || 0)) > 0.0001) {
                comparison.identical = false;
                comparison.summary.roiMatch = false;
                comparison.differences.push({
                    type: 'bestROI',
                    baseline: baseline.bestROI,
                    run: i + 1,
                    current: current.bestROI
                });
            }
            
            // Compare strategies (excluding timestamps)
            const baselineStrategies = this.excludeTimestamps(baseline.summary?.strategies || []);
            const currentStrategies = this.excludeTimestamps(current.summary?.strategies || []);
            
            if (!_.isEqual(baselineStrategies, currentStrategies)) {
                comparison.identical = false;
                comparison.summary.strategiesMatch = false;
                comparison.differences.push({
                    type: 'strategiesList',
                    run: i + 1,
                    message: 'Strategy data differs between runs'
                });
            }
            
            // Compare sample betting records
            if (!_.isEqual(baseline.sampleRecords, current.sampleRecords)) {
                comparison.identical = false;
                comparison.summary.recordsMatch = false;
                comparison.differences.push({
                    type: 'bettingRecords',
                    run: i + 1,
                    message: 'Sample betting records differ between runs'
                });
            }
        }
        
        return comparison;
    }

    excludeTimestamps(data) {
        return JSON.parse(JSON.stringify(data, (key, value) => {
            // Exclude timestamp-related fields
            if (key === 'generatedAt' || key === 'timestamp' || key.includes('Time')) {
                return undefined;
            }
            return value;
        }));
    }

    generateReport(comparison, results) {
        console.log('\n📊 DETERMINISM VERIFICATION REPORT');
        console.log('=' * 50);
        
        if (comparison.identical) {
            console.log('✅ SUCCESS: All runs produced identical results!');
            console.log('');
            console.log('🎯 Verified Consistency:');
            console.log(`   📈 Total Strategies: ${results[0].totalStrategies}`);
            console.log(`   💰 Best ROI: ${results[0].bestROI}%`);
            console.log(`   📊 Strategy Rankings: Identical across all runs`);
            console.log(`   🎲 Betting Records: Identical across all runs`);
            console.log('');
            console.log('✨ The ah-combination-tester is fully deterministic!');
            console.log('   You can run it multiple times and always get the same results.');
            
        } else {
            console.log('❌ ISSUE: Results differ between runs!');
            console.log('');
            console.log('🔍 Differences found:');
            
            comparison.differences.forEach((diff, index) => {
                console.log(`   ${index + 1}. ${diff.type}:`);
                if (diff.baseline !== undefined) {
                    console.log(`      Baseline: ${diff.baseline}`);
                    console.log(`      Run ${diff.run}: ${diff.current}`);
                } else {
                    console.log(`      ${diff.message}`);
                }
            });
            
            console.log('');
            console.log('⚠️  This indicates non-deterministic behavior that should be investigated.');
        }
        
        console.log('\n📋 Run Summary:');
        results.forEach((result, index) => {
            console.log(`   Run ${index + 1}: ${result.totalStrategies} strategies, ${result.bestROI}% best ROI`);
        });
        
        // Save detailed report
        const reportPath = path.join(this.resultsDir, 'determinism_verification_report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            testRuns: results.length,
            deterministic: comparison.identical,
            differences: comparison.differences,
            runResults: results.map(r => ({
                runNumber: r.runNumber,
                totalStrategies: r.totalStrategies,
                bestROI: r.bestROI
            }))
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }
}

// Command line interface
if (require.main === module) {
    const iterations = process.argv[2] ? parseInt(process.argv[2]) : 3;
    
    if (iterations < 2 || iterations > 10) {
        console.log('Usage: node verify_determinism.js [iterations]');
        console.log('Iterations must be between 2 and 10 (default: 3)');
        process.exit(1);
    }
    
    const verifier = new DeterminismVerifier();
    verifier.runVerification(iterations).catch(console.error);
}

module.exports = DeterminismVerifier; 