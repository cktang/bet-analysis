const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8888;

// Serve static files from dashboards directory
app.use(express.static(__dirname));

// Serve results from parent directory
app.use('/results', express.static(path.join(__dirname, '..', 'results')));

// Main route - redirect to drill dashboard
app.get('/', (req, res) => {
    res.redirect('/drill');
});

// Drill dashboard route (the only dashboard we keep)
app.get('/drill', (req, res) => {
    res.sendFile(path.join(__dirname, 'factor-table-drill.html'));
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
    console.log('\n🎯 Pattern Discovery Drill Dashboard');
    console.log(`\n🔍 Access at: http://localhost:${PORT}`);
    console.log('\n✨ Factor drilling dashboard ready!');
    console.log('\nPress Ctrl+C to stop');
}); 