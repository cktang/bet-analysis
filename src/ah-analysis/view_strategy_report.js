#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class StrategyReportViewer {
    constructor() {
        this.reportsPath = path.join(__dirname, 'strategy_reports');
    }

    listReports() {
        if (!fs.existsSync(this.reportsPath)) {
            console.log('❌ No reports directory found');
            return [];
        }

        const files = fs.readdirSync(this.reportsPath)
            .filter(file => file.endsWith('_summary.json'))
            .sort()
            .reverse(); // Most recent first

        console.log('📋 Available Strategy Reports:\n');
        files.forEach((file, index) => {
            const timestamp = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)?.[1];
            const date = timestamp ? new Date(timestamp.replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3')).toLocaleString() : 'Unknown';
            console.log(`${index + 1}. ${file}`);
            console.log(`   Generated: ${date}\n`);
        });

        return files;
    }

    viewLatestReport() {
        const reports = this.listReports();
        if (reports.length === 0) {
            console.log('❌ No reports found. Run single_strategy_tester.js first.');
            return;
        }

        const latestReport = reports[0];
        this.viewReport(latestReport);
    }

    viewReport(filename) {
        const reportPath = path.join(this.reportsPath, filename);
        
        if (!fs.existsSync(reportPath)) {
            console.log(`❌ Report not found: ${filename}`);
            return;
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        console.log('═══════════════════════════════════════');
        console.log('📊 STRATEGY REPORT VIEWER');
        console.log('═══════════════════════════════════════\n');
        
        this.displayStrategy(report);
        this.displayPerformance(report);
        this.displayAnalysis(report);
        this.displaySampleMatches(report);
        this.displayFiles(filename);
    }

    displayStrategy(report) {
        console.log('🎯 STRATEGY DETAILS:');
        console.log(`   Name: ${report.metadata.strategy.name}`);
        console.log(`   Factor: ${report.metadata.strategy.factor}`);
        console.log(`   Description: ${report.metadata.strategy.description}`);
        console.log(`   Hypothesis: ${report.metadata.strategy.hypothesis}`);
        console.log(`   Data Source: ${report.metadata.dataSource}`);
        console.log(`   Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}\n`);
    }

    displayPerformance(report) {
        const p = report.performance;
        
        console.log('💰 FINANCIAL PERFORMANCE:');
        console.log(`   Total Matches: ${p.totalMatches.toLocaleString()}`);
        console.log(`   Total Investment: $${p.totalInvestment.toLocaleString()}`);
        console.log(`   Total Return: $${p.totalReturn.toLocaleString()}`);
        console.log(`   Net Profit: $${p.netProfit.toLocaleString()}`);
        console.log(`   Profitability: ${p.profitability > 0 ? '+' : ''}${p.profitability.toFixed(2)}%`);
        console.log(`   Avg Profit/Bet: $${p.avgProfitPerBet.toFixed(2)}\n`);
        
        console.log('🎲 ACCURACY & BREAKDOWN:');
        console.log(`   Overall Accuracy: ${p.accuracy.toFixed(1)}%`);
        console.log(`   HOME: ${p.homeBets} bets, ${p.homeWins} wins (${p.homeAccuracy.toFixed(1)}%) → ${p.homeProfitability.toFixed(2)}% profit`);
        console.log(`   AWAY: ${p.awayBets} bets, ${p.awayWins} wins (${p.awayAccuracy.toFixed(1)}%) → ${p.awayProfitability.toFixed(2)}% profit\n`);
    }

    displayAnalysis(report) {
        console.log('📈 DETAILED ANALYSIS:\n');
        
        console.log('   Probability Distribution:');
        if (report.analysis?.thresholdDistribution) {
            Object.entries(report.analysis.thresholdDistribution).forEach(([range, data]) => {
                console.log(`     ${range}: ${data.count} matches (${data.percentage}%)`);
            });
        }
        console.log('');
        
        console.log('   Profit by Probability Range:');
        if (report.analysis?.profitByRange) {
            Object.entries(report.analysis.profitByRange).forEach(([range, data]) => {
                const profitSign = parseFloat(data.profitability) > 0 ? '+' : '';
                console.log(`     ${range}: ${data.matches} matches, ${profitSign}${data.profitability}% profit, ${data.winRate}% wins`);
            });
        }
        console.log('');
    }

    displaySampleMatches(report) {
        console.log('🔍 SAMPLE MATCHES (First 10):');
        console.log('');
        
        if (report.sampleMatches) {
            report.sampleMatches.forEach((match, index) => {
                const profitSign = match.profit > 0 ? '+' : '';
                const winIcon = match.betWin ? '✅' : '❌';
                
                console.log(`   ${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.date})`);
                console.log(`      Away Prob: ${(match.awayImpliedProb * 100).toFixed(1)}% | ${match.decisionLogic}`);
                console.log(`      Result: ${winIcon} ${profitSign}$${match.profit} | Score: ${match.homeScore}-${match.awayScore}`);
                console.log('');
            });
        }
    }

    displayFiles(filename) {
        const baseName = filename.replace('_summary.json', '');
        const csvFile = `${baseName}.csv`;
        
        console.log('📁 RELATED FILES:');
        console.log(`   📊 Detailed CSV: strategy_reports/${csvFile}`);
        console.log(`   📋 Summary JSON: strategy_reports/${filename}`);
        console.log('');
        console.log('💡 USAGE:');
        console.log('   • Open CSV in Excel/Google Sheets for detailed analysis');
        console.log('   • Use JSON for programmatic analysis');
        console.log('   • CSV contains every match decision and outcome');
        console.log('');
        console.log('═══════════════════════════════════════');
    }
}

// Command line interface
if (require.main === module) {
    const viewer = new StrategyReportViewer();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'list':
            viewer.listReports();
            break;
            
        case 'latest':
        case undefined:
            viewer.viewLatestReport();
            break;
            
        default:
            if (command.endsWith('.json')) {
                viewer.viewReport(command);
            } else {
                console.log('📖 Strategy Report Viewer Usage:');
                console.log('  node view_strategy_report.js           - View latest report');
                console.log('  node view_strategy_report.js latest    - View latest report');
                console.log('  node view_strategy_report.js list      - List all reports');
                console.log('  node view_strategy_report.js file.json - View specific report');
            }
    }
}

module.exports = StrategyReportViewer;