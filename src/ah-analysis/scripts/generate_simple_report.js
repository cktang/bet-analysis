const fs = require('fs');
const path = require('path');

// Load summary data
const summaryPath = path.join(__dirname, '../results/summary.json');
const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

console.log(`📊 Loaded ${summaryData.strategies.length} strategies`);

// Function to load betting records for a strategy
function loadBettingRecords(strategyName) {
    try {
        const recordsPath = path.join(__dirname, '../results', `${strategyName}_betting_records.json`);
        if (fs.existsSync(recordsPath)) {
            const records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
            return records.bettingRecords || [];
        }
    } catch (error) {
        console.log(`Could not load betting records for ${strategyName}: ${error.message}`);
    }
    return [];
}

// Sort by ROI (highest first) and get top 10 strategies with betting records
const strategies = summaryData.strategies
    .filter(s => !s.error && s.totalBets > 0)
    .sort((a, b) => {
        const aROI = parseFloat(a.roi.replace('%', '')) || 0;
        const bROI = parseFloat(b.roi.replace('%', '')) || 0;
        return bROI - aROI;
    })
    .slice(0, 10);

// Generate HTML for top strategies
let strategiesHtml = '';

strategies.forEach((strategy, index) => {
    const bettingRecords = loadBettingRecords(strategy.name);
    const roiNum = parseFloat(strategy.roi.replace('%', ''));
    const roiClass = roiNum > 0 ? 'profit-positive' : 'profit-negative';
    
    strategiesHtml += `
        <div class="strategy-section">
            <h2>#${index + 1} ${strategy.name}</h2>
            <div class="strategy-metrics">
                <span class="metric">ROI: <strong class="${roiClass}">${strategy.roi}</strong></span>
                <span class="metric">Bets: <strong>${strategy.totalBets}</strong></span>
                <span class="metric">Win Rate: <strong>${strategy.winRate}</strong></span>
                <span class="metric">Correlation: <strong>${strategy.correlation}</strong></span>
            </div>
            
            <div class="factors-display">
                <strong>Strategy Factors:</strong>
                <ul>
                    ${(strategy.factors || []).map(factor => `<li><code>${factor}</code></li>`).join('')}
                </ul>
            </div>
            
            <h3>📊 Betting Records (First 15)</h3>
            <div class="table-container">
                <table class="records-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Match</th>
                            <th>Score</th>
                            <th>Handicap</th>
                            <th>Side</th>
                            <th>Odds</th>
                            <th>Result</th>
                            <th>P/L</th>
                            <th>Factor Value</th>
                            <th>Factor Calculation</th>
                            <th>Threshold</th>
                            <th>Met</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bettingRecords.slice(0, 15).map(record => {
                            const profitClass = parseFloat(record.profit) > 0 ? 'profit-positive' : 'profit-negative';
                            const thresholdClass = record.thresholdMet ? 'threshold-met' : 'threshold-not-met';
                            
                            const factorCalculation = record.factorCalculation ? 
                                record.factorCalculation.map(calc => 
                                    `<div class="factor-item">
                                        <strong>Factor ${calc.factorIndex}:</strong><br>
                                        <code>${calc.expression}</code><br>
                                        <strong>Value:</strong> ${calc.calculatedValue}<br>
                                        <strong>Context:</strong> ${calc.explanation}
                                    </div>`
                                ).join('') : 'No factor data';
                            
                            return `
                                <tr>
                                    <td>${new Date(record.date).toLocaleDateString()}</td>
                                    <td>${record.homeTeam} vs ${record.awayTeam}</td>
                                    <td>${record.score}</td>
                                    <td>${record.handicapLine}</td>
                                    <td>${record.betSide}</td>
                                    <td>${record.betOdds}</td>
                                    <td>${record.outcome}</td>
                                    <td class="${profitClass}">${record.profit}</td>
                                    <td><strong>${record.factorValue}</strong></td>
                                    <td class="factor-calc">${factorCalculation}</td>
                                    <td>${record.threshold}<br><small>(${record.thresholdType})</small></td>
                                    <td class="${thresholdClass}">${record.thresholdMet ? '✓ YES' : '✗ NO'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
});

// Generate HTML
const html = `<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Factor Analysis Report - Top 10 Strategies</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #0a0e1a; 
            color: #e1e5e9; 
            line-height: 1.4;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            background: #1a2332; 
            padding: 20px; 
            border-radius: 8px; 
        }
        .header h1 { 
            color: #4CAF50; 
            margin-bottom: 10px; 
        }
        .strategy-section {
            background: #1a2332;
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #333;
        }
        .strategy-section h2 {
            color: #4CAF50;
            margin-top: 0;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .strategy-metrics {
            display: flex;
            gap: 20px;
            margin: 15px 0;
            flex-wrap: wrap;
        }
        .metric {
            background: #2d4263;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
        }
        .factors-display {
            background: #0f1419;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .factors-display ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .factors-display code {
            background: #2d4263;
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 12px;
        }
        .table-container {
            overflow-x: auto;
            margin-top: 15px;
        }
        .records-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 12px;
            min-width: 1400px;
        }
        .records-table th, .records-table td { 
            padding: 8px; 
            text-align: left; 
            border: 1px solid #333; 
            vertical-align: top;
        }
        .records-table th { 
            background: #2d4263; 
            color: #4CAF50; 
            font-weight: bold; 
            position: sticky;
            top: 0;
        }
        .records-table td { 
            background: #1a2332; 
        }
        .profit-positive { color: #4CAF50; font-weight: bold; }
        .profit-negative { color: #f44336; font-weight: bold; }
        .threshold-met { color: #4CAF50; font-weight: bold; }
        .threshold-not-met { color: #f44336; font-weight: bold; }
        .factor-calc {
            max-width: 300px;
            background: #0a0e1a;
            padding: 8px;
            border-radius: 4px;
        }
        .factor-item {
            background: #2d4263;
            padding: 6px;
            margin: 4px 0;
            border-radius: 2px;
            border-left: 3px solid #4CAF50;
        }
        .factor-item code {
            background: #0a0e1a;
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 10px;
            display: block;
            margin: 2px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Enhanced Factor Analysis Report</h1>
        <p>Top 10 Profitable Strategies with Detailed Factor Calculations</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    ${strategiesHtml}
    
</body>
</html>`;

// Write HTML file
const outputPath = path.join(__dirname, '../results/enhanced_factor_report.html');
fs.writeFileSync(outputPath, html);

console.log(`✅ Enhanced factor report generated: ${outputPath}`);
console.log(`🌐 This report shows factor calculations for top 10 strategies`); 