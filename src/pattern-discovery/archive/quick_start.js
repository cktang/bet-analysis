#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Bar Chart Visualization Server...\n');

// Check if data file exists
if (!fs.existsSync('./results/clean_discovery.json')) {
    console.log('❌ Data file not found!');
    console.log('Please run: node create_clean_data.js');
    process.exit(1);
}

console.log('✅ Data file found: results/clean_discovery.json');

const PORT = 3000;
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    // Default to bar chart
    if (filePath === './') {
        filePath = './bar_chart_visualization.html';
    }
    
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'text/plain';
    
    console.log(`📂 Serving: ${filePath}`);
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end(`File not found: ${filePath}`);
                console.log(`❌ 404: ${filePath}`);
            } else {
                res.writeHead(500);
                res.end('Server error: ' + err.code);
                console.log(`❌ 500: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
            console.log(`✅ 200: ${filePath}`);
        }
    });
});

server.listen(PORT, () => {
    console.log('\n🌐 Server Status:');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('📊 Default: Bar Chart Visualization');
    console.log('🔗 Treemap: http://localhost:3000/treemap_visualization.html');
    console.log('🧪 Test: http://localhost:3000/test_treemap.html');
    console.log('\n🎯 Open your browser and go to http://localhost:3000');
    console.log('💡 Use Ctrl+C to stop the server');
    console.log('\n⏳ Waiting for requests...\n');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use!`);
        console.log('💡 Kill existing server with: lsof -ti:3000 | xargs kill -9');
    } else {
        console.log('❌ Server error:', err);
    }
    process.exit(1);
});

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...');
    server.close();
    process.exit(0);
}); 