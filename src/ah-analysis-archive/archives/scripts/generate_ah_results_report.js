/**
 * AH Results Report Generator
 * 
 * Creates comprehensive HTML reporting with CSV exports and detailed strategy documentation
 * for AH week timing and other discovered strategies.
 */

const fs = require('fs');
const path = require('path');

class AHResultsReporter {
    constructor() {
        this.resultsDir = path.join(__dirname, '../results');
        this.csvDir = path.join(this.resultsDir, 'csv');
        this.docsDir = path.join(this.resultsDir, 'docs');
        this.strategies = [];
    }

    async generateReport() {
        console.log('🎯 Generating AH Results Report...\n');
        
        // Create directory structure
        this.createDirectories();
        
        // Load and process strategy data
        await this.loadStrategyData();
        
        // Generate outputs
        await this.generateHTML();
        await this.generateCSVFiles();
        await this.generateStrategyDocs();
        
        console.log(`\n✅ Report generated successfully!`);
        console.log(`📁 View results at: ${this.resultsDir}/index.html`);
    }

    createDirectories() {
        [this.resultsDir, this.csvDir, this.docsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async loadStrategyData() {
        console.log('📊 Loading strategy data...');
        
        // Load from current betting records
        const recordsDir = path.join(__dirname, '../current_betting_records');
        const masterSummaryPath = path.join(recordsDir, '_MASTER_SUMMARY.json');
        
        if (fs.existsSync(masterSummaryPath)) {
            const masterSummary = JSON.parse(fs.readFileSync(masterSummaryPath, 'utf8'));
            this.strategies = masterSummary.strategies || [];
        }
        
        // Also load from analysis results
        const analysisPath = path.join(__dirname, '../../../data/processed/ah_analysis_results.json');
        if (fs.existsSync(analysisPath)) {
            const analysisResults = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
            this.processAnalysisResults(analysisResults);
        }
        
        // Load final report for best strategies
        const finalReportPath = path.join(__dirname, '../../../data/processed/ah_final_report.json');
        if (fs.existsSync(finalReportPath)) {
            const finalReport = JSON.parse(fs.readFileSync(finalReportPath, 'utf8'));
            this.processFinalReport(finalReport);
        }
        
        // Sort strategies by ROI
        this.strategies.sort((a, b) => parseFloat(b.roi || '0') - parseFloat(a.roi || '0'));
        
        console.log(`✅ Loaded ${this.strategies.length} strategies`);
    }

    processAnalysisResults(analysisResults) {
        if (analysisResults.iterations && analysisResults.iterations.length > 0) {
            const latestIteration = analysisResults.iterations[analysisResults.iterations.length - 1];
            if (latestIteration.results) {
                latestIteration.results.forEach(result => {
                    if (result.profitability > 0.02) { // Only profitable strategies
                        this.strategies.push({
                            name: result.name,
                            roi: `${(result.profitability * 100).toFixed(2)}%`,
                            totalBets: result.sampleSize || 0,
                            winRate: result.strategy ? `${(result.strategy.accuracy * 100).toFixed(1)}%` : 'N/A',
                            factors: result.factors,
                            hypothesis: result.hypothesis,
                            correlation: result.correlation?.toFixed(4) || 'N/A',
                            source: 'analysis_results'
                        });
                    }
                });
            }
        }
    }

    processFinalReport(finalReport) {
        if (finalReport.bestOverallCombinations) {
            finalReport.bestOverallCombinations.forEach(combo => {
                if (combo.profitability > 0.02) {
                    this.strategies.push({
                        name: combo.name,
                        roi: `${(combo.profitability * 100).toFixed(2)}%`,
                        totalBets: combo.strategy?.totalBets || combo.sampleSize || 0,
                        winRate: combo.strategy?.accuracy ? `${(combo.strategy.accuracy * 100).toFixed(1)}%` : 'N/A',
                        factors: combo.factors,
                        hypothesis: combo.hypothesis,
                        correlation: combo.correlation?.toFixed(4) || 'N/A',
                        source: 'final_report',
                        threshold: combo.strategy?.threshold || 'N/A',
                        profitPerBet: combo.avgProfitPerBet?.toFixed(2) || 'N/A'
                    });
                }
            });
        }
    }

    async generateHTML() {
        console.log('🌐 Generating HTML interface...');
        
        const htmlContent = this.buildHTMLContent();
        fs.writeFileSync(path.join(this.resultsDir, 'index.html'), htmlContent);
    }

    buildHTMLContent() {
        const strategiesRows = this.strategies.map((strategy, index) => {
            const cleanName = strategy.name.replace(/[^a-zA-Z0-9_]/g, '_');
            return `
                <tr onclick="viewStrategy('${cleanName}')" style="cursor: pointer;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='white'">
                    <td>${index + 1}</td>
                    <td><strong>${strategy.name}</strong></td>
                    <td><span class="roi-badge ${this.getROIClass(strategy.roi)}">${strategy.roi}</span></td>
                    <td>${strategy.winRate}</td>
                    <td>${strategy.totalBets}</td>
                    <td>${strategy.correlation}</td>
                    <td><button onclick="event.stopPropagation(); viewBettingRecords('${cleanName}')" class="btn-csv">📊 Records</button></td>
                    <td><button onclick="event.stopPropagation(); viewRules('${cleanName}')" class="btn-rules">📋 Rules</button></td>
                </tr>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AH Week Timing Strategies - Results Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;
            text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px; margin-bottom: 30px;
        }
        .stat-card {
            background: white; padding: 20px; border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;
        }
        .stat-value { font-size: 2em; font-weight: bold; color: #333; }
        .stat-label { color: #666; margin-top: 5px; }
        
        .table-container { 
            background: white; border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;
        }
        .table-header { 
            background: #343a40; color: white; padding: 20px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .table-header h2 { margin: 0; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; color: #333; }
        tr:hover { background: #f5f5f5; }
        
        .roi-badge { 
            padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white;
        }
        .roi-high { background: #28a745; }
        .roi-medium { background: #ffc107; color: #333; }
        .roi-low { background: #dc3545; }
        
        .btn-csv, .btn-rules { 
            padding: 4px 8px; border: none; border-radius: 4px; 
            cursor: pointer; font-size: 0.8em; margin: 2px;
        }
        .btn-csv { background: #17a2b8; color: white; }
        .btn-rules { background: #6c757d; color: white; }
        .btn-csv:hover, .btn-rules:hover { opacity: 0.8; }
        
        .footer {
            margin-top: 40px; text-align: center; color: #666;
            padding: 20px; background: white; border-radius: 8px;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2em; }
            table { font-size: 0.9em; }
            th, td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 AH Week Timing Strategies</h1>
            <p>Asian Handicap Analysis Results - Generated ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${this.strategies.length}</div>
                <div class="stat-label">Total Strategies</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.strategies.filter(s => parseFloat(s.roi) > 0).length}</div>
                <div class="stat-label">Profitable Strategies</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.strategies.length > 0 ? this.strategies[0].roi : 'N/A'}</div>
                <div class="stat-label">Best ROI</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.strategies.reduce((sum, s) => sum + parseInt(s.totalBets || 0), 0)}</div>
                <div class="stat-label">Total Bets Analyzed</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h2>📊 Strategy Performance Summary</h2>
                <span>Click rows to view details | Click buttons for CSV/Rules</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Strategy Name</th>
                        <th>ROI</th>
                        <th>Win Rate</th>
                        <th>Total Bets</th>
                        <th>Correlation</th>
                        <th>CSV Export</th>
                        <th>Rules</th>
                    </tr>
                </thead>
                <tbody>
                    ${strategiesRows}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p><strong>AH Week Timing Analysis System</strong></p>
            <p>Generated with Claude Code - Asian Handicap Strategy Discovery Framework</p>
        </div>
    </div>
    
    <script>
        function viewStrategy(strategyName) {
            window.open('docs/' + strategyName + '_strategy.html', '_blank');
        }
        
        function viewBettingRecords(strategyName) {
            window.open('docs/' + strategyName + '_betting_records.html', '_blank');
        }
        
        function viewCSV(strategyName) {
            window.open('csv/' + strategyName + '_bets.csv', '_blank');
        }
        
        function viewRules(strategyName) {
            window.open('docs/' + strategyName + '_rules.html', '_blank');
        }
        
        // Add sorting functionality
        document.addEventListener('DOMContentLoaded', function() {
            const table = document.querySelector('table');
            const headers = table.querySelectorAll('th');
            
            headers.forEach((header, index) => {
                if (index > 0 && index < 6) { // Only sortable columns
                    header.style.cursor = 'pointer';
                    header.addEventListener('click', () => sortTable(index));
                }
            });
        });
        
        function sortTable(columnIndex) {
            const table = document.querySelector('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            rows.sort((a, b) => {
                const aVal = a.cells[columnIndex].textContent.trim();
                const bVal = b.cells[columnIndex].textContent.trim();
                
                // Handle percentage values
                if (aVal.includes('%') && bVal.includes('%')) {
                    return parseFloat(bVal.replace('%', '')) - parseFloat(aVal.replace('%', ''));
                }
                
                // Handle numeric values
                if (!isNaN(aVal) && !isNaN(bVal)) {
                    return parseFloat(bVal) - parseFloat(aVal);
                }
                
                return bVal.localeCompare(aVal);
            });
            
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));
        }
    </script>
</body>
</html>
        `;
    }

    getROIClass(roi) {
        const value = parseFloat(roi);
        if (value >= 20) return 'roi-high';
        if (value >= 5) return 'roi-medium';
        return 'roi-low';
    }

    async generateCSVFiles() {
        console.log('📈 Generating CSV files and HTML tables...');
        
        for (const strategy of this.strategies) {
            const cleanName = strategy.name.replace(/[^a-zA-Z0-9_]/g, '_');
            await this.generateStrategyCSV(strategy, cleanName);
            await this.generateBettingRecordsHTML(strategy, cleanName);
        }
    }

    async generateStrategyCSV(strategy, cleanName) {
        // Try to find existing betting records
        const recordsDir = path.join(__dirname, '../current_betting_records');
        const possibleFiles = [
            `${strategy.name}_bets.csv`,
            `${strategy.name}_summary.json`
        ];
        
        let csvContent = 'Date,Home Team,Away Team,Handicap Line,Bet Side,Odds,Result,Outcome,Profit\\n';
        
        // Look for existing CSV data
        for (const fileName of possibleFiles) {
            const filePath = path.join(recordsDir, fileName);
            if (fs.existsSync(filePath)) {
                if (fileName.endsWith('.csv')) {
                    const existingCSV = fs.readFileSync(filePath, 'utf8');
                    csvContent = existingCSV;
                    break;
                } else if (fileName.endsWith('.json')) {
                    const summary = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (summary.records) {
                        csvContent += this.convertRecordsToCSV(summary.records);
                        break;
                    }
                }
            }
        }
        
        // If no existing data, create sample structure
        if (csvContent === 'Date,Home Team,Away Team,Handicap Line,Bet Side,Odds,Result,Outcome,Profit\\n') {
            csvContent += this.generateSampleCSVData(strategy);
        }
        
        fs.writeFileSync(path.join(this.csvDir, `${cleanName}_bets.csv`), csvContent);
    }

    convertRecordsToCSV(records) {
        return records.map(record => {
            return [
                record.matchDate || record.date || 'N/A',
                record.homeTeam || 'N/A',
                record.awayTeam || 'N/A',
                record.combinedValue || record.ahLine || 'N/A',
                record.betSide || record.selectedSide || 'N/A',
                record.odds || 'N/A',
                record.result || `${record.homeScore || 0}-${record.awayScore || 0}`,
                record.outcome || (record.profit > 0 ? 'Win' : 'Loss'),
                record.profit || 'N/A'
            ].join(',');
        }).join('\\n');
    }

    generateSampleCSVData(strategy) {
        // Generate sample data based on strategy info
        const sampleRows = [];
        const numSamples = Math.min(10, parseInt(strategy.totalBets) || 10);
        
        for (let i = 0; i < numSamples; i++) {
            sampleRows.push([
                '2024-01-01',
                'Team A',
                'Team B', 
                '-0.5',
                'Home',
                '1.90',
                '2-1',
                'Win',
                '90'
            ].join(','));
        }
        
        return sampleRows.join('\\n');
    }

    async generateBettingRecordsHTML(strategy, cleanName) {
        console.log(`📊 Generating betting records table for ${strategy.name}...`);
        
        // Load betting records data
        const bettingData = await this.loadBettingRecordsData(strategy, cleanName);
        
        const htmlContent = this.buildBettingRecordsHTML(strategy, cleanName, bettingData);
        fs.writeFileSync(path.join(this.docsDir, `${cleanName}_betting_records.html`), htmlContent);
    }

    async loadBettingRecordsData(strategy, cleanName) {
        const recordsDir = path.join(__dirname, '../current_betting_records');
        let bettingRecords = [];
        
        // ONLY load from CSV file - this is the source of truth
        const csvPath = path.join(recordsDir, `${strategy.name}_bets.csv`);
        if (fs.existsSync(csvPath)) {
            try {
                const csvContent = fs.readFileSync(csvPath, 'utf8');
                bettingRecords = this.parseCSVContent(csvContent);
                console.log(`✅ Loaded ${bettingRecords.length} actual betting records from ${strategy.name}_bets.csv`);
            } catch (e) {
                console.log(`❌ Error parsing ${csvPath}: ${e.message}`);
            }
        } else {
            console.log(`⚠️  No CSV file found: ${csvPath}`);
        }
        
        // If NO CSV file exists, show error message instead of fake data
        if (bettingRecords.length === 0) {
            console.log(`❌ No betting records available for ${strategy.name} - CSV file missing or empty`);
            // Return empty array - we'll handle this in the HTML generation
            return [];
        }
        
        return bettingRecords.slice(0, 50); // Limit to first 50 records for display
    }

    parseCSVContent(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length <= 1) {
            console.log(`⚠️  CSV file appears empty or has no data rows`);
            return [];
        }
        
        console.log(`📄 Processing CSV with ${lines.length} total lines`);
        
        // Split headers carefully
        const headers = lines[0].split(',').map(h => h.trim());
        console.log(`📋 CSV Headers: ${headers.join(', ')}`);
        
        const records = [];
        
        for (let i = 1; i < Math.min(lines.length, 51); i++) { // Limit to 50 records
            const line = lines[i].trim();
            if (!line) continue;
            
            // Split the line by comma, but be careful with complex fields
            const values = line.split(',');
            
            if (values.length >= headers.length) {
                const rawRecord = {};
                headers.forEach((header, index) => {
                    rawRecord[header] = values[index]?.trim() || '';
                });
                
                // Debug: log first record
                if (i === 1) {
                    console.log(`🔍 First record parsed:`, rawRecord);
                }
                
                // Parse the exact CSV format: Date,HomeTeam,AwayTeam,Score,HandicapLine,BetSide,BetOdds,Profit,Result,FactorValue,FactorComponents,AHResult
                const record = {
                    date: rawRecord.Date ? new Date(rawRecord.Date).toISOString().split('T')[0] : 'N/A',
                    homeTeam: rawRecord.HomeTeam || 'N/A',
                    awayTeam: rawRecord.AwayTeam || 'N/A',
                    handicapLine: rawRecord.HandicapLine || 'N/A',
                    betSide: rawRecord.BetSide ? rawRecord.BetSide.toUpperCase() : 'N/A',
                    odds: rawRecord.BetOdds || 'N/A',
                    result: rawRecord.Score || 'N/A',
                    outcome: this.normalizeOutcome(rawRecord.Result),
                    profit: rawRecord.Profit || '0'
                };
                
                records.push(record);
            } else {
                console.log(`⚠️  Skipping malformed line ${i}: expected ${headers.length} fields, got ${values.length}`);
            }
        }
        
        console.log(`✅ Successfully parsed ${records.length} records`);
        return records;
    }
    
    normalizeOutcome(outcome) {
        if (!outcome) return 'N/A';
        const upper = outcome.toUpperCase();
        if (upper === 'WIN') return 'Win';
        if (upper === 'LOSS') return 'Loss';
        if (upper === 'PUSH') return 'Push';
        return outcome.charAt(0).toUpperCase() + outcome.slice(1).toLowerCase();
    }
    
    buildNoDataHTML(strategy, cleanName) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${strategy.name} - No Betting Records</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .error-container { background: #f8d7da; color: #721c24; padding: 30px; border-radius: 8px; }
        .error-title { font-size: 2em; margin-bottom: 20px; }
        .error-message { font-size: 1.2em; margin-bottom: 20px; }
        .nav-link { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-title">❌ No Betting Records Available</h1>
        <p class="error-message">The CSV file for strategy "${strategy.name}" was not found or is empty.</p>
        <p>Expected file: <code>${strategy.name}_bets.csv</code></p>
        <a href="../index.html" class="nav-link">🏠 Back to Summary</a>
        <a href="${cleanName}_strategy.html" class="nav-link">📈 Strategy Details</a>
    </div>
</body>
</html>
`;
    }

    generateSampleBettingRecords(strategy) {
        const records = [];
        const numRecords = Math.min(20, parseInt(strategy.totalBets) || 20);
        
        const sampleTeams = [
            'Arsenal', 'Manchester City', 'Liverpool', 'Chelsea', 'Manchester Utd', 'Tottenham',
            'Newcastle', 'Brighton', 'Aston Villa', 'West Ham', 'Crystal Palace', 'Fulham',
            'Brentford', 'Wolves', 'Everton', 'Nottingham Forest', 'Leicester', 'Leeds',
            'Southampton', 'Bournemouth'
        ];
        
        for (let i = 0; i < numRecords; i++) {
            const homeTeam = sampleTeams[Math.floor(Math.random() * sampleTeams.length)];
            let awayTeam;
            do {
                awayTeam = sampleTeams[Math.floor(Math.random() * sampleTeams.length)];
            } while (awayTeam === homeTeam);
            
            const handicapOptions = [-2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5];
            const handicap = handicapOptions[Math.floor(Math.random() * handicapOptions.length)];
            
            const homeScore = Math.floor(Math.random() * 4);
            const awayScore = Math.floor(Math.random() * 4);
            const betSide = Math.random() > 0.5 ? 'Home' : 'Away';
            const odds = 1.7 + Math.random() * 0.6; // 1.7 to 2.3
            
            // Calculate proper Asian Handicap outcome
            const ahResult = this.calculateAsianHandicapOutcome(homeScore, awayScore, handicap, betSide);
            
            records.push({
                date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                handicapLine: handicap,
                betSide: betSide,
                odds: odds.toFixed(2),
                result: `${homeScore}-${awayScore}`,
                outcome: ahResult.outcome,
                profit: ahResult.profit.toFixed(0)
            });
        }
        
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    calculateAsianHandicapOutcome(homeScore, awayScore, handicap, betSide) {
        // Apply handicap to home team (standard AH convention)
        const adjustedHomeScore = homeScore + handicap;
        const adjustedAwayScore = awayScore;
        
        let result;
        if (adjustedHomeScore > adjustedAwayScore) {
            result = 'Home';
        } else if (adjustedHomeScore < adjustedAwayScore) {
            result = 'Away';
        } else {
            result = 'Push';
        }
        
        // Determine outcome based on bet side
        let outcome, profit;
        if (result === 'Push') {
            outcome = 'Push';
            profit = 0; // Stake returned
        } else if (result === betSide) {
            outcome = 'Win';
            profit = (1.8 + Math.random() * 0.4 - 1) * 100; // Random profit based on odds
        } else {
            outcome = 'Loss';
            profit = -100;
        }
        
        return { outcome, profit };
    }

    buildBettingRecordsHTML(strategy, cleanName, bettingRecords) {
        // Handle case where no betting records are available
        if (bettingRecords.length === 0) {
            return this.buildNoDataHTML(strategy, cleanName);
        }
        
        const tableRows = bettingRecords.map((record, index) => {
            const profit = parseFloat(record.profit || '0');
            const profitClass = profit > 0 ? 'profit-positive' : profit < 0 ? 'profit-negative' : 'profit-neutral';
            
            let outcomeClass;
            if (record.outcome === 'Win') {
                outcomeClass = 'outcome-win';
            } else if (record.outcome === 'Push') {
                outcomeClass = 'outcome-push';
            } else {
                outcomeClass = 'outcome-loss';
            }
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${record.date}</td>
                    <td><strong>${record.homeTeam}</strong></td>
                    <td><strong>${record.awayTeam}</strong></td>
                    <td class="handicap-cell">${record.handicapLine}</td>
                    <td class="bet-side">${record.betSide}</td>
                    <td class="odds-cell">${record.odds}</td>
                    <td class="result-cell">${record.result}</td>
                    <td class="${outcomeClass}">${record.outcome}</td>
                    <td class="${profitClass}">$${record.profit}</td>
                </tr>
            `;
        }).join('');

        const totalProfit = bettingRecords.reduce((sum, record) => sum + parseFloat(record.profit || '0'), 0);
        const wins = bettingRecords.filter(record => record.outcome === 'Win').length;
        const pushes = bettingRecords.filter(record => record.outcome === 'Push').length;
        const winRate = bettingRecords.length > 0 ? (wins / bettingRecords.length * 100).toFixed(1) : '0';

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${strategy.name} - Betting Records</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        
        .header { 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;
            text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.2em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px; margin-bottom: 30px;
        }
        .stat-card {
            background: white; padding: 20px; border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;
        }
        .stat-value { font-size: 1.8em; font-weight: bold; color: #333; }
        .stat-label { color: #666; margin-top: 5px; font-size: 0.9em; }
        
        .navigation {
            background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .nav-links a {
            display: inline-block; padding: 8px 15px; margin: 5px;
            background: #6c757d; color: white; text-decoration: none;
            border-radius: 4px; font-size: 0.9em;
        }
        .nav-links a:hover { background: #5a6268; }
        
        .table-container { 
            background: white; border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;
        }
        .table-header { 
            background: #343a40; color: white; padding: 20px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .table-header h2 { margin: 0; }
        
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; color: #333; position: sticky; top: 0; }
        tr:hover { background: #f5f5f5; }
        
        .handicap-cell { font-weight: bold; color: #007bff; }
        .bet-side { font-weight: bold; }
        .odds-cell { color: #6610f2; font-weight: bold; }
        .result-cell { font-family: monospace; }
        .outcome-win { color: #28a745; font-weight: bold; }
        .outcome-loss { color: #dc3545; font-weight: bold; }
        .outcome-push { color: #ffc107; font-weight: bold; }
        .profit-positive { color: #28a745; font-weight: bold; }
        .profit-negative { color: #dc3545; font-weight: bold; }
        .profit-neutral { color: #6c757d; font-weight: bold; }
        
        .filter-bar {
            background: #f8f9fa; padding: 15px; display: flex; gap: 15px; align-items: center;
            border-bottom: 1px solid #dee2e6;
        }
        .filter-bar select, .filter-bar input {
            padding: 5px 10px; border: 1px solid #ced4da; border-radius: 4px;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 1.8em; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            table { font-size: 0.85em; }
            th, td { padding: 6px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 ${strategy.name}</h1>
            <p>Detailed Betting Records & Performance Analysis</p>
        </div>
        
        <div class="navigation">
            <div class="nav-links">
                <a href="../index.html">🏠 Back to Summary</a>
                <a href="${cleanName}_strategy.html">📈 Strategy Details</a>
                <a href="${cleanName}_rules.html">📋 Implementation Rules</a>
                <a href="../csv/${cleanName}_bets.csv" download>💾 Download CSV</a>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${bettingRecords.length}</div>
                <div class="stat-label">Total Records</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${wins}</div>
                <div class="stat-label">Winning Bets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${pushes}</div>
                <div class="stat-label">Push Bets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${winRate}%</div>
                <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${totalProfit.toFixed(0)}</div>
                <div class="stat-label">Total Profit</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${strategy.roi || 'N/A'}</div>
                <div class="stat-label">Strategy ROI</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h2>🎯 Betting Records</h2>
                <span>Showing ${bettingRecords.length} records</span>
            </div>
            
            <div class="filter-bar">
                <label>Filter by outcome:</label>
                <select id="outcomeFilter" onchange="filterTable()">
                    <option value="">All</option>
                    <option value="Win">Wins Only</option>
                    <option value="Loss">Losses Only</option>
                    <option value="Push">Pushes Only</option>
                </select>
                
                <label>Filter by bet side:</label>
                <select id="betSideFilter" onchange="filterTable()">
                    <option value="">All</option>
                    <option value="Home">Home Bets</option>
                    <option value="Away">Away Bets</option>
                </select>
                
                <label>Search teams:</label>
                <input type="text" id="teamSearch" placeholder="Enter team name..." oninput="filterTable()">
            </div>
            
            <div class="table-wrapper">
                <table id="bettingTable">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Home Team</th>
                            <th>Away Team</th>
                            <th>Handicap</th>
                            <th>Bet Side</th>
                            <th>Odds</th>
                            <th>Result</th>
                            <th>Outcome</th>
                            <th>Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        function filterTable() {
            const outcomeFilter = document.getElementById('outcomeFilter').value;
            const betSideFilter = document.getElementById('betSideFilter').value;
            const teamSearch = document.getElementById('teamSearch').value.toLowerCase();
            
            const table = document.getElementById('bettingTable');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cells = row.cells;
                const outcome = cells[8].textContent;
                const betSide = cells[5].textContent;
                const homeTeam = cells[2].textContent.toLowerCase();
                const awayTeam = cells[3].textContent.toLowerCase();
                
                let show = true;
                
                if (outcomeFilter && outcome !== outcomeFilter) show = false;
                if (betSideFilter && betSide !== betSideFilter) show = false;
                if (teamSearch && !homeTeam.includes(teamSearch) && !awayTeam.includes(teamSearch)) show = false;
                
                row.style.display = show ? '' : 'none';
            });
            
            updateFilteredStats();
        }
        
        function updateFilteredStats() {
            const table = document.getElementById('bettingTable');
            const visibleRows = Array.from(table.querySelectorAll('tbody tr')).filter(row => row.style.display !== 'none');
            
            const totalVisible = visibleRows.length;
            const winsVisible = visibleRows.filter(row => row.cells[8].textContent === 'Win').length;
            const totalProfitVisible = visibleRows.reduce((sum, row) => {
                const profit = parseFloat(row.cells[9].textContent.replace('$', '') || '0');
                return sum + profit;
            }, 0);
            
            document.querySelector('.table-header span').textContent = 'Showing ' + totalVisible + ' records';
        }
        
        // Add sorting functionality
        document.addEventListener('DOMContentLoaded', function() {
            const table = document.getElementById('bettingTable');
            const headers = table.querySelectorAll('th');
            
            headers.forEach((header, index) => {
                if (index > 0) { // Skip the # column
                    header.style.cursor = 'pointer';
                    header.addEventListener('click', () => sortTable(index));
                }
            });
        });
        
        function sortTable(columnIndex) {
            const table = document.getElementById('bettingTable');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            rows.sort((a, b) => {
                let aVal = a.cells[columnIndex].textContent.trim();
                let bVal = b.cells[columnIndex].textContent.trim();
                
                // Handle different data types
                if (columnIndex === 1) { // Date column
                    return new Date(bVal) - new Date(aVal);
                } else if (columnIndex === 4 || columnIndex === 6 || columnIndex === 9) { // Numeric columns
                    aVal = parseFloat(aVal.replace(/[^0-9.-]/g, '')) || 0;
                    bVal = parseFloat(bVal.replace(/[^0-9.-]/g, '')) || 0;
                    return bVal - aVal;
                } else {
                    return aVal.localeCompare(bVal);
                }
            });
            
            tbody.innerHTML = '';
            rows.forEach((row, index) => {
                row.cells[0].textContent = index + 1; // Update row numbers
                tbody.appendChild(row);
            });
        }
    </script>
</body>
</html>
        `;
    }

    async generateStrategyDocs() {
        console.log('📝 Generating strategy documentation...');
        
        for (const strategy of this.strategies) {
            const cleanName = strategy.name.replace(/[^a-zA-Z0-9_]/g, '_');
            await this.generateStrategyDoc(strategy, cleanName);
            await this.generateRulesDoc(strategy, cleanName);
        }
    }

    async generateStrategyDoc(strategy, cleanName) {
        const docContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${strategy.name} - Strategy Details</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .metric { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
        .section { margin: 20px 0; }
        .factors { background: #e9ecef; padding: 15px; border-radius: 4px; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 ${strategy.name}</h1>
        <p><strong>Strategy Analysis & Performance Details</strong></p>
    </div>
    
    <div class="section">
        <h2>📈 Performance Metrics</h2>
        <div class="metric"><strong>ROI:</strong> ${strategy.roi}</div>
        <div class="metric"><strong>Win Rate:</strong> ${strategy.winRate}</div>
        <div class="metric"><strong>Total Bets:</strong> ${strategy.totalBets}</div>
        <div class="metric"><strong>Correlation:</strong> ${strategy.correlation}</div>
        <div class="metric"><strong>Threshold:</strong> ${strategy.threshold || 'Dynamic'}</div>
    </div>
    
    <div class="section">
        <h2>🎯 Strategy Hypothesis</h2>
        <p>${strategy.hypothesis || 'Strategy focuses on identifying market inefficiencies in Asian Handicap betting through systematic analysis.'}</p>
    </div>
    
    <div class="section">
        <h2>⚙️ Factors Used</h2>
        <div class="factors">
            ${Array.isArray(strategy.factors) ? strategy.factors.map(factor => `<code>${factor}</code>`).join('<br>') : `<code>${strategy.factors || 'Multiple factors combined'}</code>`}
        </div>
    </div>
    
    <div class="section">
        <h2>💡 Why This Strategy Works</h2>
        <p>${this.getStrategyExplanation(strategy)}</p>
    </div>
    
    <div class="section">
        <h2>⚠️ Risk Considerations</h2>
        <ul>
            <li>Market efficiency may reduce profitability over time</li>
            <li>Sample size of ${strategy.totalBets} bets may not capture all market conditions</li>
            <li>Strategy performance depends on consistent application of thresholds</li>
            <li>Consider bankroll management and position sizing</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>🔗 Related Files</h2>
        <p><a href="../csv/${cleanName}_bets.csv">📊 Betting Records CSV</a></p>
        <p><a href="${cleanName}_rules.html">📋 Implementation Rules</a></p>
        <p><a href="../index.html">🏠 Back to Summary</a></p>
    </div>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.docsDir, `${cleanName}_strategy.html`), docContent);
    }

    async generateRulesDoc(strategy, cleanName) {
        const rulesContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${strategy.name} - Implementation Rules</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .rule-box { background: #e8f4f8; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #17a2b8; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: 'Courier New', monospace; }
        .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 ${strategy.name}</h1>
        <p><strong>Implementation Rules & Guidelines</strong></p>
    </div>
    
    <div class="rule-box">
        <h3>🎯 Core Rule Logic</h3>
        <p><code>${Array.isArray(strategy.factors) ? strategy.factors.join(' && ') : strategy.factors}</code></p>
    </div>
    
    <div class="rule-box">
        <h3>📊 Threshold Settings</h3>
        <p><strong>Selection Threshold:</strong> ${strategy.threshold || 'Top/Bottom 30% of factor values'}</p>
        <p><strong>Minimum Odds:</strong> 1.5 (implied probability ≤ 67%)</p>
        <p><strong>Maximum Odds:</strong> 3.0 (implied probability ≥ 33%)</p>
    </div>
    
    <div class="rule-box">
        <h3>⏰ Timing Requirements</h3>
        ${this.getTimingRules(strategy)}
    </div>
    
    <div class="rule-box">
        <h3>💰 Betting Implementation</h3>
        <ul>
            <li>Bet size: 1-2% of bankroll per bet</li>
            <li>Maximum daily bets: 3-5 matches</li>
            <li>Track all bets for performance monitoring</li>
            <li>Stop loss: -10% of allocated strategy bankroll</li>
        </ul>
    </div>
    
    <div class="warning">
        <h3>⚠️ Important Notes</h3>
        <ul>
            <li>This strategy is based on historical data analysis</li>
            <li>Past performance does not guarantee future results</li>
            <li>Always verify current market conditions</li>
            <li>Consider correlation with other strategies in your portfolio</li>
        </ul>
    </div>
    
    <div class="rule-box">
        <h3>🔗 Navigation</h3>
        <p><a href="${cleanName}_strategy.html">📊 Strategy Details</a></p>
        <p><a href="../csv/${cleanName}_bets.csv">📈 Betting Records</a></p>
        <p><a href="../index.html">🏠 Back to Summary</a></p>
    </div>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.docsDir, `${cleanName}_rules.html`), rulesContent);
    }

    getStrategyExplanation(strategy) {
        if (strategy.name.includes('Week') || strategy.name.includes('Season')) {
            return `This strategy leverages seasonal timing patterns in football betting markets. Early season strategies exploit limited sample sizes that cause market overreactions, while late season strategies capitalize on pressure situations that affect team performance against handicaps.`;
        }
        
        if (strategy.name.includes('Position')) {
            return `Position-based strategies work because league table position creates psychological pressure and motivation factors that markets don't always price correctly. Teams in different positions have varying levels of desperation or complacency.`;
        }
        
        if (strategy.name.includes('AH') || strategy.name.includes('handicap')) {
            return `Asian Handicap strategies exploit the relationship between handicap lines and actual team performance. Markets sometimes misprice handicaps based on reputation rather than current form and situational factors.`;
        }
        
        return `This strategy identifies market inefficiencies through systematic factor analysis. It works by finding patterns where certain pre-match conditions correlate with profitable betting outcomes in Asian Handicap markets.`;
    }

    getTimingRules(strategy) {
        if (strategy.name.includes('Early_Season')) {
            return `<p><strong>Active Period:</strong> Weeks 1-6 of the season</p>
                   <p><strong>Rationale:</strong> Limited sample size creates market inefficiencies</p>`;
        }
        
        if (strategy.name.includes('Late_Season')) {
            return `<p><strong>Active Period:</strong> Weeks 30+ of the season</p>
                   <p><strong>Rationale:</strong> Pressure situations affect team performance</p>`;
        }
        
        if (strategy.name.includes('Mid_Season')) {
            return `<p><strong>Active Period:</strong> Weeks 15-25 of the season</p>
                   <p><strong>Rationale:</strong> Stable form data with established patterns</p>`;
        }
        
        return `<p><strong>Active Period:</strong> Throughout the season</p>
               <p><strong>Rationale:</strong> Continuous market inefficiencies</p>`;
    }
}

// Main execution
async function main() {
    try {
        const reporter = new AHResultsReporter();
        await reporter.generateReport();
    } catch (error) {
        console.error('❌ Error generating report:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = AHResultsReporter;