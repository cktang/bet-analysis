#!/usr/bin/env node
/**
 * Start a Simple Genetic Algorithm with basic configuration
 * Good for quick testing and exploration
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧬 Starting Simple Genetic Algorithm');
console.log('====================================');

// Simple configuration for quick testing
const config = {
  populationSize: 100,
  maxGenerations: 1000,
  mutationRate: 0.4,
  crossoverRate: 0.6,
  eliteSize: 20,
  minFactors: 2,
  maxFactors: 6
};

console.log('📊 Simple Configuration:');
console.log(`   Population Size: ${config.populationSize} (small for quick results)`);
console.log(`   Max Generations: ${config.maxGenerations} (short run)`);
console.log(`   Mutation Rate: ${config.mutationRate}`);
console.log(`   Crossover Rate: ${config.crossoverRate}`);
console.log(`   Elite Size: ${config.eliteSize}`);
console.log(`   Factor Range: ${config.minFactors}-${config.maxFactors} (simple combinations)`);

const postData = JSON.stringify(config);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/analysis/genetic/optimize',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('\n🚀 Starting simple optimization...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.log('❌ Error:', response.error);
        return;
      }
      
      console.log('✅ Simple Genetic Algorithm Started!');
      console.log('📄', response.message);
      console.log('⏱️  Expected runtime: ~2-5 minutes');
      
      console.log('\n📂 Log Files Location:');
      console.log('   Log files will be created in: data/v2/');
      console.log('   - clean-genetic-log-[timestamp].txt');
      
      console.log('\n📊 Monitor Progress:');
      console.log('   ./monitor-genetic-logs.sh');
      console.log('   or: tail -f data/v2/clean-genetic-log-*.txt');
      
      console.log('\n🛑 Stop Algorithm:');
      console.log('   curl -X POST http://localhost:3001/analysis/genetic/stop');
      
      // Start monitoring after a short delay
      setTimeout(() => {
        monitorGeneticAlgorithm();
      }, 3000);
      
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request error:', error.message);
  console.log('\n💡 Make sure NestJS server is running:');
  console.log('   npm start');
});

req.write(postData);
req.end();

// Monitoring function
function monitorGeneticAlgorithm() {
  console.log('\n🔍 Starting monitoring...');
  
  let lastLogSize = 0;
  let generationCount = 0;
  let bestROI = 0;
  let bestMatches = 0;
  
  const monitorInterval = setInterval(async () => {
    try {
      // Check genetic algorithm status
      const statusResponse = await makeRequest('/analysis/genetic/status', 'GET');
      if (statusResponse && statusResponse.isRunning !== undefined) {
        console.log(`\n📊 Status: ${statusResponse.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        if (statusResponse.currentGeneration) {
          console.log(`   Generation: ${statusResponse.currentGeneration}`);
        }
        if (statusResponse.bestFitness) {
          console.log(`   Best Fitness: ${statusResponse.bestFitness.toFixed(2)}`);
        }
      }
      
      // Monitor log file
      const logFiles = fs.readdirSync('data/v2/')
        .filter(file => file.startsWith('clean-genetic-log-'))
        .sort()
        .reverse();
      
      if (logFiles.length > 0) {
        const latestLog = path.join('data/v2', logFiles[0]);
        const stats = fs.statSync(latestLog);
        
        if (stats.size > lastLogSize) {
          // Read new content
          const content = fs.readFileSync(latestLog, 'utf8');
          const lines = content.split('\n');
          
          // Extract latest results
          const resultLines = lines.filter(line => line.includes('📈 Result:'));
          if (resultLines.length > 0) {
            const latestResult = resultLines[resultLines.length - 1];
            console.log(`\n📈 Latest Result: ${latestResult}`);
            
            // Parse ROI and matches
            const roiMatch = latestResult.match(/ROI=([\d.]+)%/);
            const matchesMatch = latestResult.match(/Matches=(\d+)/);
            
            if (roiMatch && matchesMatch) {
              const roi = parseFloat(roiMatch[1]);
              const matches = parseInt(matchesMatch[1]);
              
              if (roi > bestROI) {
                bestROI = roi;
                console.log(`🎯 New Best ROI: ${bestROI.toFixed(1)}%`);
              }
              if (matches > bestMatches) {
                bestMatches = matches;
                console.log(`🎯 New Best Matches: ${bestMatches}`);
              }
            }
          }
          
          // Count generations
          const generationLines = lines.filter(line => line.includes('Generation'));
          generationCount = generationLines.length;
          
          lastLogSize = stats.size;
        }
      }
      
      // Check if algorithm has stopped
      if (statusResponse && !statusResponse.isRunning) {
        console.log('\n🏁 Genetic Algorithm completed!');
        console.log(`📊 Summary:`);
        console.log(`   Total Generations: ${generationCount}`);
        console.log(`   Best ROI Found: ${bestROI.toFixed(1)}%`);
        console.log(`   Best Matches Found: ${bestMatches}`);
        clearInterval(monitorInterval);
        return;
      }
      
    } catch (error) {
      console.log(`\n⚠️  Monitoring error: ${error.message}`);
    }
  }, 5000); // Check every 5 seconds
  
  // Stop monitoring after 10 minutes
  setTimeout(() => {
    clearInterval(monitorInterval);
    console.log('\n⏰ Monitoring timeout (10 minutes)');
  }, 600000);
}

// Helper function for HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}