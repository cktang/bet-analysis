const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Pattern Discovery Dashboard Hub...\n');

// Launch the dashboard server from the correct directory
const dashboardsPath = path.join(__dirname, 'src', 'pattern-discovery', 'dashboards');
const dashboardProcess = spawn('node', ['launch.js'], {
    cwd: dashboardsPath,
    stdio: 'inherit'
});

dashboardProcess.on('error', (error) => {
    console.error('Error starting dashboard hub:', error);
});

dashboardProcess.on('close', (code) => {
    console.log(`\nDashboard hub exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down dashboard hub...');
    dashboardProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    dashboardProcess.kill('SIGTERM');
    process.exit(0);
}); 