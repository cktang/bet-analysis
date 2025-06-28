const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8888;

// Serve static files from dashboards directory
app.use(express.static(__dirname));

// Serve results from parent directory
app.use('/results', express.static(path.join(__dirname, '..', 'results')));

// Main route - show dashboard selection
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pattern Discovery Dashboards</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: #1a1a1a; 
                    color: #fff; 
                    padding: 50px;
                    text-align: center;
                }
                h1 { color: #4caf50; margin-bottom: 40px; }
                .dashboard-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                    gap: 30px; 
                    max-width: 1200px; 
                    margin: 0 auto; 
                }
                .dashboard-card {
                    background: #2d2d2d;
                    padding: 30px;
                    border-radius: 10px;
                    border: 1px solid #555;
                    transition: transform 0.2s;
                }
                .dashboard-card:hover { transform: translateY(-5px); }
                .dashboard-title { 
                    font-size: 1.5em; 
                    margin-bottom: 15px; 
                    color: #4caf50; 
                }
                .dashboard-desc { 
                    margin-bottom: 20px; 
                    color: #ccc; 
                    line-height: 1.4;
                }
                .dashboard-link {
                    display: inline-block;
                    background: #4caf50;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    transition: background 0.2s;
                }
                .dashboard-link:hover { background: #45a049; }
                .primary { border-left: 4px solid #4caf50; }
                .secondary { border-left: 4px solid #2196f3; }
            </style>
        </head>
        <body>
            <h1>🎯 Pattern Discovery Dashboards</h1>
            <div class="dashboard-grid">
                <div class="dashboard-card primary">
                    <div class="dashboard-title">🔍 Factor Drilling</div>
                    <div class="dashboard-desc">
                        Interactive table for building factor combinations step-by-step. 
                        Add factors one by one and see performance impact. All 31 factors available.
                    </div>
                    <a href="/drill" class="dashboard-link">Launch Drilling</a>
                </div>
                
                <div class="dashboard-card secondary">
                    <div class="dashboard-title">📊 Comprehensive Analysis</div>
                    <div class="dashboard-desc">
                        Full overview dashboard with charts, tables, and complete analysis. 
                        Best for exploring all discovery results at once.
                    </div>
                    <a href="/analysis" class="dashboard-link">Launch Analysis</a>
                </div>
                
                <div class="dashboard-card secondary">
                    <div class="dashboard-title">🎨 Visual Dashboard</div>
                    <div class="dashboard-desc">
                        Rich visual interface with interactive charts and graphs. 
                        Perfect for presentations and visual analysis.
                    </div>
                    <a href="/visual" class="dashboard-link">Launch Visual</a>
                </div>
                
                <div class="dashboard-card primary">
                    <div class="dashboard-title">📋 Betting Records</div>
                    <div class="dashboard-desc">
                        View individual betting records for any strategy. 
                        See every single bet with match details, stakes, and results.
                    </div>
                    <a href="/records" class="dashboard-link">View Records</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Dashboard routes
app.get('/drill', (req, res) => {
    res.sendFile(path.join(__dirname, 'factor-table-drill.html'));
});

app.get('/analysis', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/visual', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-dashboard.html'));
});

app.get('/records', (req, res) => {
    res.sendFile(path.join(__dirname, 'betting_records_viewer.html'));
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
    console.log('\n🎯 Pattern Discovery Dashboard Hub');
    console.log(`\n📊 Access at: http://localhost:${PORT}`);
    console.log('\n🔍 Available Dashboards:');
    console.log('  • Factor Drilling: /drill');
    console.log('  • Comprehensive Analysis: /analysis');  
    console.log('  • Visual Dashboard: /visual');
    console.log('  • Betting Records: /records');
    console.log('\n✨ All dashboards consolidated in one place!');
    console.log('\nPress Ctrl+C to stop');
}); 