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

// Sort by ROI (highest first)
const strategies = summaryData.strategies.sort((a, b) => {
    const aROI = parseFloat(a.roi.replace('%', '')) || 0;
    const bROI = parseFloat(b.roi.replace('%', '')) || 0;
    return bROI - aROI;
});

// Generate HTML
const html = `<!DOCTYPE html>
<html>
<head>
    <title>Complete Strategy Report - ${summaryData.metadata.totalStrategies} Strategies</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #0a0e1a; color: #e1e5e9; }
        .header { text-align: center; margin-bottom: 30px; background: #1a2332; padding: 20px; border-radius: 8px; }
        .header h1 { color: #4CAF50; margin-bottom: 10px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; background: #2d4263; padding: 15px; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #4CAF50; }
                 .strategies { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 15px; }
         .strategy { background: #1a2332; padding: 15px; border-radius: 8px; border: 1px solid #333; }
         .strategy:hover { border-color: #4CAF50; }
         .strategy-name { font-weight: bold; color: #4CAF50; margin-bottom: 10px; font-size: 16px; }
         .strategy.error { border-color: #f44336; }
         .strategy.no-matches { border-color: #ff9800; }
         .status-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; margin-left: 8px; }
         .status-active { background: #4CAF50; color: black; }
         .status-no-matches { background: #ff9800; color: black; }
         .status-error { background: #f44336; color: white; }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .metric { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #333; font-size: 14px; }
        .roi-positive { color: #4CAF50; }
        .roi-negative { color: #f44336; }
                 .factors { background: #0f1419; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; margin-top: 10px; }
        .rank { float: right; background: #4CAF50; color: black; border-radius: 50%; width: 24px; height: 24px; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; }
        .search { margin: 20px 0; text-align: center; }
        .search input { padding: 10px; width: 300px; border: 1px solid #555; border-radius: 4px; background: #2d4263; color: #e1e5e9; }
        .details-btn { background: #4CAF50; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 12px; font-weight: bold; }
        .details-btn:hover { background: #45a049; }
        .betting-records { display: none; margin-top: 15px; background: #0f1419; padding: 15px; border-radius: 4px; }
        .betting-records.show { display: block; }
        .records-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .records-table th, .records-table td { padding: 6px; text-align: left; border-bottom: 1px solid #333; }
        .records-table th { background: #2d4263; color: #4CAF50; font-weight: bold; }
        .records-table td { background: #1a2332; }
        .profit-positive { color: #4CAF50; }
        .profit-negative { color: #f44336; }
        .factor-details { background: #0a0e1a; padding: 4px; border-radius: 2px; font-family: monospace; font-size: 10px; }
        .threshold-met { color: #4CAF50; }
        .threshold-not-met { color: #f44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Asian Handicap Strategy Report</h1>
        <p>Complete Analysis of All ${summaryData.metadata.totalStrategies} Strategies</p>
        <p>Generated: ${new Date(summaryData.metadata.generatedAt).toLocaleString()}</p>
        
                 <div class="stats">
             <div class="stat">
                 <div class="stat-value">${summaryData.metadata.totalStrategies}</div>
                 <div>Total Strategies</div>
             </div>
             <div class="stat">
                 <div class="stat-value">${summaryData.metadata.strategiesWithBets || summaryData.metadata.totalStrategies}</div>
                 <div>With Betting Records</div>
             </div>
             <div class="stat">
                 <div class="stat-value">${summaryData.metadata.profitableStrategies}</div>
                 <div>Profitable (>0% ROI)</div>
             </div>
             <div class="stat">
                 <div class="stat-value">${summaryData.metadata.bestROI}%</div>
                 <div>Best ROI</div>
             </div>
             <div class="stat">
                 <div class="stat-value">${summaryData.metadata.strategiesWithErrors || 0}</div>
                 <div>With Errors</div>
             </div>
         </div>
    </div>
    
    <div class="search">
        <input type="text" id="searchInput" placeholder="Search strategies..." onkeyup="filterStrategies()">
    </div>
    
         <div class="strategies" id="strategiesContainer">
         ${strategies.map((strategy, index) => {
             const roiNum = parseFloat(strategy.roi.replace('%', ''));
             const roiClass = roiNum > 0 ? 'roi-positive' : 'roi-negative';
             
             // Determine strategy status and styling
             let statusClass = '';
             let statusBadge = '';
             if (strategy.error) {
                 statusClass = 'error';
                 statusBadge = '<span class="status-badge status-error">ERROR</span>';
             } else if (strategy.totalBets === 0) {
                 statusClass = 'no-matches';
                 statusBadge = '<span class="status-badge status-no-matches">NO MATCHES</span>';
             } else {
                 statusBadge = '<span class="status-badge status-active">ACTIVE</span>';
             }
             
             // Load betting records for this strategy
             const bettingRecords = loadBettingRecords(strategy.name);
             const hasRecords = bettingRecords.length > 0;
             
             return `
                 <div class="strategy ${statusClass}" data-name="${strategy.name.toLowerCase()}" data-factors="${(strategy.factors || []).join(' ').toLowerCase()}">
                     <div class="rank">${index + 1}</div>
                     <div class="strategy-name">${strategy.name}${statusBadge}</div>
                     
                     <div class="metrics">
                         <div class="metric">
                             <span>ROI:</span>
                             <span class="${roiClass}">${strategy.roi}</span>
                         </div>
                         <div class="metric">
                             <span>Win Rate:</span>
                             <span>${strategy.winRate || '0%'}</span>
                         </div>
                         <div class="metric">
                             <span>Total Bets:</span>
                             <span>${strategy.totalBets || 0}</span>
                         </div>
                         <div class="metric">
                             <span>Avg Profit:</span>
                             <span class="${roiClass}">${strategy.avgProfitPerBet || '0.00'}</span>
                         </div>
                     </div>
                     
                     <div class="factors">
                         <strong>Factors:</strong><br>
                         ${(strategy.factors || ['N/A']).join('<br>')}
                     </div>
                     
                     ${strategy.hypothesis ? `<div style="margin-top: 8px; font-style: italic; color: #a0a6ad; font-size: 13px;">${strategy.hypothesis}</div>` : ''}
                     ${strategy.error ? `<div style="margin-top: 8px; color: #f44336; font-size: 12px;"><strong>Error:</strong> ${strategy.error}</div>` : ''}
                     
                     ${hasRecords ? `
                         <button class="details-btn" onclick="toggleDetails('${strategy.name}')">
                             View ${bettingRecords.length} Betting Records
                         </button>
                         
                         <div class="betting-records" id="details-${strategy.name}">
                             <h4>📊 Betting Records (First 20 shown)</h4>
                             <table class="records-table">
                                 <thead>
                                     <tr>
                                         <th>Date</th>
                                         <th>Match</th>
                                         <th>Score</th>
                                         <th>Handicap</th>
                                         <th>Bet Side</th>
                                         <th>Odds</th>
                                         <th>Profit</th>
                                         <th>Outcome</th>
                                         <th>Factor Value</th>
                                         <th>Factor Calculation</th>
                                         <th>Threshold</th>
                                         <th>Met</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     ${bettingRecords.slice(0, 20).map(record => {
                                         const profitClass = parseFloat(record.profit) > 0 ? 'profit-positive' : 'profit-negative';
                                         const thresholdClass = record.thresholdMet ? 'threshold-met' : 'threshold-not-met';
                                         
                                         const factorCalculation = record.factorCalculation ? 
                                             record.factorCalculation.map(calc => 
                                                 `<div class="factor-details">
                                                     <strong>Factor ${calc.factorIndex}:</strong><br>
                                                     ${calc.expression}<br>
                                                     <strong>Value:</strong> ${calc.calculatedValue}<br>
                                                     <strong>Context:</strong> ${calc.explanation}
                                                 </div>`
                                             ).join('') : 'N/A';
                                         
                                         return `
                                             <tr>
                                                 <td>${new Date(record.date).toLocaleDateString()}</td>
                                                 <td>${record.homeTeam} vs ${record.awayTeam}</td>
                                                 <td>${record.score}</td>
                                                 <td>${record.handicapLine}</td>
                                                 <td>${record.betSide}</td>
                                                 <td>${record.betOdds}</td>
                                                 <td class="${profitClass}">${record.profit}</td>
                                                 <td>${record.outcome}</td>
                                                 <td>${record.factorValue}</td>
                                                 <td>${factorCalculation}</td>
                                                 <td>${record.threshold} (${record.thresholdType})</td>
                                                 <td class="${thresholdClass}">${record.thresholdMet ? '✓' : '✗'}</td>
                                             </tr>
                                         `;
                                     }).join('')}
                                 </tbody>
                             </table>
                             ${bettingRecords.length > 20 ? `<p><em>Showing first 20 of ${bettingRecords.length} records</em></p>` : ''}
                         </div>
                     ` : ''}
                 </div>
             `;
         }).join('')}
    </div>
    
    <script>
        function filterStrategies() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const strategies = document.querySelectorAll('.strategy');
            
            strategies.forEach(strategy => {
                const name = strategy.dataset.name;
                const factors = strategy.dataset.factors;
                const visible = name.includes(searchTerm) || factors.includes(searchTerm);
                strategy.style.display = visible ? 'block' : 'none';
            });
        }
        
        function toggleDetails(strategyName) {
            const detailsDiv = document.getElementById('details-' + strategyName);
            const button = event.target;
            
            if (detailsDiv.classList.contains('show')) {
                detailsDiv.classList.remove('show');
                button.textContent = button.textContent.replace('Hide', 'View');
            } else {
                detailsDiv.classList.add('show');
                button.textContent = button.textContent.replace('View', 'Hide');
            }
        }
    </script>
</body>
</html>`;

// Write HTML file
const outputPath = path.join(__dirname, '../results/full_report.html');
fs.writeFileSync(outputPath, html);

console.log(`✅ Report generated: ${outputPath}`);
console.log(`🌐 Open in browser to view all ${summaryData.metadata.totalStrategies} strategies`);
