const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8889; // Different port from main dashboard

// Serve static files
app.use(express.static(__dirname));

// Main drill dashboard route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'factor-table-drill.html'));
});

// API endpoint for discovery data
app.get('/api/discovery', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'results', 'optimized_discovery.json');
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
    console.log('\n📊 Factor Drilling - Table Analysis Starting...');
    console.log(`\n🔍 Dashboard URL: http://localhost:${PORT}`);
    console.log('\n📈 Tabular Features:');
    console.log('  • Structured table view with factor columns');
    console.log('  • Step-by-step factor building (horizontal progression)');
    console.log('  • Strategies found and ROI impact per combination');
    console.log('  • Detailed strategy breakdown on the right');
    console.log('  • Click factors to add them to combinations');
    console.log('  • "Add Best Factor" button for optimal selection');
    console.log('\n🎯 Perfect for analytical factor analysis!');
    console.log('\nPress Ctrl+C to stop the server');
}); 