#!/usr/bin/env node
/**
 * Start the Clean Genetic Algorithm
 */
const http = require('http');

console.log('🧬 Starting Clean Genetic Algorithm');
console.log('==================================');

// Configuration optimized for 5-factor exploration
const config = {
  populationSize: 20,
  maxGenerations: 30,
  mutationRate: 0.2,
  crossoverRate: 0.8,
  eliteSize: 3,
  minFactors: 2,
  maxFactors: 5
};

console.log('📊 Configuration:');
console.log(`   Population Size: ${config.populationSize}`);
console.log(`   Max Generations: ${config.maxGenerations}`);
console.log(`   Mutation Rate: ${config.mutationRate}`);
console.log(`   Crossover Rate: ${config.crossoverRate}`);
console.log(`   Elite Size: ${config.eliteSize}`);
console.log(`   Factor Range: ${config.minFactors}-${config.maxFactors}`);

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

console.log('\n🚀 Starting optimization...');

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
      
      console.log('✅ Clean Genetic Algorithm Started!');
      console.log('📄', response.message);
      
      console.log('\n📂 Log Files Location:');
      console.log('   Log files will be created in: data/v2/');
      console.log('   - clean-genetic-log-[timestamp].txt');
      
      console.log('\n📊 Monitor Progress:');
      console.log('   tail -f data/v2/clean-genetic-log-*.txt');
      
      console.log('\n🛑 Stop Algorithm:');
      console.log('   curl -X POST http://localhost:3001/analysis/genetic/stop');
      
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