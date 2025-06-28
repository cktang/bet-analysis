#!/usr/bin/env node

// Dashboard Launcher - Start web server for pattern discovery visualization

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;

// Simple static file server
function createServer() {
    const server = http.createServer((req, res) => {
        let filePath = path.join(__dirname, req.url === '/' ? 'dashboard.html' : req.url);
        
        // Set CORS headers for local development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Serve files
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.json': 'application/json',
                '.css': 'text/css'
            };
            
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        }
    });

    return server;
}

function main() {
    console.log('🚀 Starting Pattern Discovery Dashboard...\n');
    
    // Check if discovery results exist
    const resultsPath = path.join(__dirname, 'results', 'optimized_discovery.json');
    if (fs.existsSync(resultsPath)) {
        console.log('✅ Discovery results found: optimized_discovery.json');
        console.log('   Dashboard will load live data automatically\n');
    } else {
        console.log('⚠️  No discovery results found in results/optimized_discovery.json');
        console.log('   Dashboard will show sample data only');
        console.log('   Run "node run_discovery.js" first to generate real data\n');
    }
    
    // Start server
    const server = createServer();
    
    server.listen(PORT, () => {
        console.log('🌐 Dashboard server running!');
        console.log(`   Local URL: http://localhost:${PORT}`);
        console.log(`   Dashboard: http://localhost:${PORT}/dashboard.html`);
        console.log('');
        console.log('📊 Features available:');
        console.log('   • Interactive charts and visualizations');
        console.log('   • Filterable pattern tables');
        console.log('   • Stakes distribution analysis');
        console.log('   • ROI vs sample size scatter plots');
        console.log('   • Performance by odds range');
        console.log('   • Fixed vs variable staking comparison');
        console.log('');
        console.log('💡 Tip: Keep this server running and refresh browser to see updates');
        console.log('Press Ctrl+C to stop the server\n');
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down dashboard server...');
        server.close(() => {
            console.log('✅ Server stopped. Goodbye!');
            process.exit(0);
        });
    });
}

if (require.main === module) {
    main();
}

module.exports = { createServer }; 