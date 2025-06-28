#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const BASE_DIR = path.join(__dirname, '..');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            console.log(`404 - File not found: ${filePath}`);
            return;
        }

        const mimeType = getMimeType(filePath);
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(data);
        console.log(`200 - Served: ${filePath}`);
    });
}

const server = http.createServer((req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
    }

    let urlPath = req.url;
    
    // Default to index.html for root path
    if (urlPath === '/') {
        urlPath = '/report/index.html';
    }
    
    // Remove query parameters
    urlPath = urlPath.split('?')[0];
    
    // Construct file path - handle the relative path from HTML properly
    let filePath;
    if (urlPath.startsWith('/results/')) {
        // Direct access to results files
        filePath = path.join(BASE_DIR, urlPath);
    } else if (urlPath.startsWith('/report/')) {
        // Direct access to report files
        filePath = path.join(BASE_DIR, urlPath);
    } else {
        // Other paths
        filePath = path.join(BASE_DIR, urlPath);
    }
    
    console.log(`🔍 Request: ${req.url} -> File: ${filePath}`);
    
    // Security check - ensure file is within BASE_DIR
    const normalizedPath = path.normalize(filePath);
    const normalizedBase = path.normalize(BASE_DIR);
    
    if (!normalizedPath.startsWith(normalizedBase)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        console.log(`403 - Forbidden: ${filePath}`);
        return;
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            console.log(`404 - File not found: ${filePath}`);
            return;
        }

        // Check if it's a directory
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                console.log(`500 - Error: ${err.message}`);
                return;
            }

            if (stats.isDirectory()) {
                // Try to serve index.html from directory
                const indexPath = path.join(filePath, 'index.html');
                fs.access(indexPath, fs.constants.F_OK, (err) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Directory index not found');
                        console.log(`404 - Directory index not found: ${indexPath}`);
                        return;
                    }
                    serveFile(res, indexPath);
                });
            } else {
                serveFile(res, filePath);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log('🚀 Asian Handicap Report Server Started');
    console.log('==========================================');
    console.log(`📊 Server running at: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${BASE_DIR}`);
    console.log('📋 Available endpoints:');
    console.log('   • http://localhost:' + PORT + '/ (Report homepage)');
    console.log('   • http://localhost:' + PORT + '/report/ (Report directory)');
    console.log('   • http://localhost:' + PORT + '/results/ (JSON data files)');
    console.log('');
    console.log('💡 Press Ctrl+C to stop the server');
    console.log('==========================================');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Server shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
}); 