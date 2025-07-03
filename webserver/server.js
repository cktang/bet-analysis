const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const _ = require('lodash');
const { GetMatchKey } = require('./util');
const cors = require('cors');

const app = express();
app.use(cors());

// Serve static files from the data directory
app.use('/data', express.static(path.join(__dirname, '../data')));

// Serve the factor drilling tool and other HTML files
app.use(express.static(path.join(__dirname, '..')));

const port = 3000;

let records = [];

// Directory to watch
const watchDir = path.join(__dirname, '../data/odds-movement/');

// Function to read JSON files and update records
const updateRecords = filePath => {
    console.warn(filePath);
    if (filePath.endsWith('.json')) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }
            try {
                const jsonData = JSON.parse(data);
                records.push(jsonData);
                records = records.flat();
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        });
    }
};

// Watch for changes in the directory
chokidar.watch(watchDir).on('all', (event, path) => {
    console.log(`Event: ${event}, Path: ${path}`);
    updateRecords(path || '');
});

// Endpoint to retrieve records
app.get('/records', (req, res) => {
    res.json(records);
});

// Endpoint to retrieve records by matching home or away attribute
app.get('/records/search', (req, res) => {
    const query = req.query;
    if (_.isEmpty(query)) {
        return res.status(400).json({ error: 'At least one query parameter is required' });
    }

    const matchingRecords = records.filter(record => 
        Object.keys(query).every(key => record[key] === query[key])
    );

    res.json(matchingRecords);
});

// Endpoint to retrieve unique matches
app.get('/matches', (req, res) => {
    const uniqueMatches = _(records).groupBy(GetMatchKey)
        .map((matches, key) => ({..._(matches[0]).pick(['id', 'home', 'away', 'date']).value(), key}))
        .value();
    res.json(uniqueMatches);
});

// Endpoint to retrieve match records by key
app.get('/records/:key', (req, res) => {
    const { key } = req.params;
    const matchRecords = records.filter(record => GetMatchKey(record) === key);
    if (matchRecords.length === 0) {
        return res.status(404).json({ error: 'No records found for the given key' });
    }
    res.json(matchRecords);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});