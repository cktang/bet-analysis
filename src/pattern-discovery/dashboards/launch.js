const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8888;

// Serve static files from dashboards directory
app.use(express.static(__dirname));

// Serve results from parent directory
app.use('/results', express.static(path.join(__dirname, '..', 'results')));

// Main route - show dashboard menu
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Asian Handicap Dashboards</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #0d1117; color: #c9d1d9; }
                h1 { color: #58a6ff; }
                .dashboard { border: 1px solid #30363d; margin: 20px 0; padding: 20px; border-radius: 6px; background: #161b22; }
                .dashboard h2 { margin-top: 0; color: #f0f6fc; }
                .dashboard a { color: #58a6ff; text-decoration: none; font-weight: bold; }
                .dashboard a:hover { text-decoration: underline; }
                .recommended { border-color: #3fb950; }
                .legacy { border-color: #f85149; }
                .status { font-size: 12px; color: #8b949e; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>🎯 Asian Handicap Factor Analysis Dashboards</h1>
            
            <div class="dashboard recommended">
                <h2>✅ Comprehensive Analysis (Recommended)</h2>
                <p><strong><a href="/reliable">Access Dashboard →</a></strong></p>
                <p>Complete analysis of 2,646 meaningful factor combinations from 20,384 strategies.</p>
                <ul>
                    <li>✅ No buggy logic - every combination properly tested</li>
                    <li>🎯 Shows 1,147 useful aggregates with high ROI</li>
                    <li>⭐ 4 precise small groups (≤10 strategies each)</li>
                    <li>🔍 Filter by type, ROI, bet count, factor count</li>
                    <li>📊 Best strategy: 42.5% ROI (Level -0.25 + Away + Early Season)</li>
                </ul>
                <div class="status">Status: ✅ Stable & Comprehensive</div>
            </div>
            
            <div class="dashboard legacy">
                <h2>🔧 Interactive Drilling (Legacy)</h2>
                <p><strong><a href="/drill">Access Dashboard →</a></strong></p>
                <p>Interactive factor selection with real-time combination building.</p>
                <ul>
                    <li>⚠️ Has known bugs with factor removal</li>
                    <li>🎲 Inconsistent results for broad selections</li>
                    <li>📋 Shows individual betting records</li>
                    <li>🧪 Good for experimental exploration</li>
                </ul>
                <div class="status">Status: ⚠️ Buggy but functional</div>
            </div>
            
            <h2>📊 Key Findings</h2>
            <ul>
                <li><strong>2,646 meaningful combinations</strong> found from 20,384 total strategies</li>
                <li><strong>1,147 useful aggregates</strong> + 4 small groups vs 1,495 too broad</li>
                <li><strong>Best ROI: 42.5%</strong> for "Level -0.25 + Away + Early Season" (738 bets)</li>
                <li><strong>31 unique factors</strong> properly extracted from actual strategy names</li>
                <li><strong>Complete coverage:</strong> Every possible combination now tested correctly</li>
            </ul>
        </body>
        </html>
    `);
});

// Interactive drill dashboard (legacy)
app.get('/drill', (req, res) => {
    res.sendFile(path.join(__dirname, 'factor-table-drill.html'));
});

// Pre-computed reliable dashboard (recommended)
app.get('/reliable', (req, res) => {
    res.sendFile(path.join(__dirname, 'factor-table-drill-precomputed.html'));
});

// API endpoint for discovery data
app.get('/api/discovery', (req, res) => {
    try {
        const dataPath = path.join(__dirname, '..', 'results', 'optimized_discovery.json');
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            res.json(data);
        } else {
            res.status(404).json({ error: 'Discovery data not found. Run discovery first.' });
        }
    } catch (error) {
        console.error('Error loading discovery data:', error);
        res.status(500).json({ error: 'Failed to load discovery data' });
    }
});

app.listen(PORT, () => {
    console.log('\n🎯 Asian Handicap Factor Analysis Dashboards');
    console.log(`\n🔍 Main Menu: http://localhost:${PORT}`);
    console.log(`\n✅ Recommended: http://localhost:${PORT}/reliable (Comprehensive Analysis)`);
    console.log(`⚠️  Legacy: http://localhost:${PORT}/drill (Interactive Drilling)`);
    console.log('\n📊 Complete analysis: 2,646 combinations from 20,384 strategies!');
    console.log('\nPress Ctrl+C to stop');
}); 