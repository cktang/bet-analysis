#!/usr/bin/env node

import { LiveBettingCoordinator, SystemConfig } from './coordinator/LiveBettingCoordinator';
import fs from 'fs';
import path from 'path';

/**
 * Main entry point for Live Betting System V2
 * 
 * Usage:
 *   npm run live-betting
 *   node src/main.ts
 * 
 * Configuration:
 *   Create config/live-betting.json with HKJC credentials
 */

async function main() {
  console.log('🎰 Live Betting System V2');
  console.log('==========================');
  
  try {
    // Load configuration
    const config = loadConfiguration();
    
    // Create coordinator
    const coordinator = new LiveBettingCoordinator(config);
    
    // Handle shutdown gracefully
    setupShutdownHandlers(coordinator);
    
    // Start the system
    await coordinator.start();
    
    // Keep process alive
    console.log('\n⚡ System is running. Press Ctrl+C to stop.\n');
    
    // Set up command interface
    setupCommandInterface(coordinator);
    
  } catch (error) {
    console.error('❌ Failed to start system:', error);
    process.exit(1);
  }
}

/**
 * Load configuration from file or environment
 */
function loadConfiguration(): SystemConfig {
  // Try to load from config file
  const configPath = path.join(process.cwd(), 'config', 'live-betting.json');
  
  if (fs.existsSync(configPath)) {
    console.log('📄 Loading configuration from config/live-betting.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  }
  
  // Try environment variables
  const username = process.env.HKJC_USERNAME;
  const password = process.env.HKJC_PASSWORD;
  const answersStr = process.env.HKJC_SECURITY_ANSWERS;
  
  if (username && password && answersStr) {
    console.log('🌍 Loading configuration from environment variables');
    return {
      hkjcCredentials: {
        username,
        password,
        answers: JSON.parse(answersStr)
      },
      oddsMonitorInterval: parseInt(process.env.ODDS_MONITOR_INTERVAL || '30000'),
      enableLiveBetting: process.env.ENABLE_LIVE_BETTING === 'true',
      enablePaperTrading: process.env.ENABLE_PAPER_TRADING === 'true'
    };
  }
  
  // Create sample config file and exit
  createSampleConfig();
  console.error('❌ No configuration found. Sample config created at config/live-betting.json');
  console.error('   Please edit this file with your HKJC credentials and restart.');
  process.exit(1);
}

/**
 * Create sample configuration file
 */
function createSampleConfig(): void {
  const configDir = path.join(process.cwd(), 'config');
  const configPath = path.join(configDir, 'live-betting.json');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const sampleConfig: SystemConfig = {
    hkjcCredentials: {
      username: "YOUR_HKJC_USERNAME",
      password: "YOUR_HKJC_PASSWORD",
      answers: {
        "你出生的醫院名稱是甚麼?": "YOUR_ANSWER",
        "你最喜愛的食物?": "YOUR_ANSWER",
        "你第一份工作的地點?": "YOUR_ANSWER",
        "你最喜愛的女藝人?": "YOUR_ANSWER",
        "你的駕駛執照有效期至?": "YOUR_ANSWER"
      }
    },
    oddsMonitorInterval: 30000,
    enableLiveBetting: false, // Start with paper trading
    enablePaperTrading: true
  };
  
  fs.writeFileSync(configPath, JSON.stringify(sampleConfig, null, 2));
}

/**
 * Setup graceful shutdown handlers
 */
function setupShutdownHandlers(coordinator: LiveBettingCoordinator): void {
  const shutdownHandler = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      await coordinator.stop();
      console.log('✅ System stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught Exception:', error);
    await coordinator.emergencyStop('Uncaught Exception');
    process.exit(1);
  });
  
  process.on('unhandledRejection', async (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
    await coordinator.emergencyStop('Unhandled Promise Rejection');
    process.exit(1);
  });
}

/**
 * Setup command line interface
 */
function setupCommandInterface(coordinator: LiveBettingCoordinator): void {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('💬 Commands available:');
  console.log('   status    - Show system status');
  console.log('   metrics   - Show detailed metrics');
  console.log('   update    - Manual results update');
  console.log('   live on   - Enable live betting');
  console.log('   live off  - Disable live betting');
  console.log('   paper on  - Enable paper trading');
  console.log('   paper off - Disable paper trading');
  console.log('   restart   - Restart system');
  console.log('   stop      - Stop system');
  console.log('');
  
  rl.on('line', async (input: string) => {
    const command = input.trim().toLowerCase();
    
    try {
      switch (command) {
        case 'status':
          const status = coordinator.getSystemStatus();
          console.log('\n📊 System Status:');
          console.log(JSON.stringify(status, null, 2));
          break;
          
        case 'metrics':
          const metrics = coordinator.getSystemMetrics();
          console.log('\n📈 System Metrics:');
          console.log('Performance:', metrics.performance);
          console.log(`Strategies (${metrics.strategies.length}):`, metrics.strategies.slice(0, 5));
          console.log(`Recent Activity (${metrics.recentActivity.length}):`, metrics.recentActivity.slice(0, 10));
          break;
          
        case 'update':
          console.log('🔄 Triggering manual results update...');
          await coordinator.manualUpdateResults();
          console.log('✅ Results update completed');
          break;
          
        case 'live on':
          coordinator.toggleLiveBetting(true);
          break;
          
        case 'live off':
          coordinator.toggleLiveBetting(false);
          break;
          
        case 'paper on':
          coordinator.togglePaperTrading(true);
          break;
          
        case 'paper off':
          coordinator.togglePaperTrading(false);
          break;
          
        case 'restart':
          console.log('🔄 Restarting system...');
          await coordinator.restart();
          console.log('✅ System restarted');
          break;
          
        case 'stop':
          console.log('🛑 Stopping system...');
          await coordinator.stop();
          console.log('✅ System stopped');
          process.exit(0);
          break;
          
        case 'help':
        case '?':
          console.log('\n💬 Available commands:');
          console.log('   status, metrics, update, live on/off, paper on/off, restart, stop');
          break;
          
        default:
          if (command) {
            console.log(`❓ Unknown command: ${command}. Type 'help' for available commands.`);
          }
      }
    } catch (error) {
      console.error('❌ Command error:', error);
    }
    
    console.log(''); // Empty line for readability
  });
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

export { main };