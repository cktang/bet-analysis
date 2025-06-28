#!/usr/bin/env node

// Analysis Runner - Run all analysis tools on discovery results

console.log('📊 Running Pattern Discovery Analysis Suite...\n');

try {
    console.log('1️⃣ Running Results Summary Analysis...');
    require('./analysis/analyze_results.js');
    
    console.log('\n2️⃣ Running Stakes Distribution Analysis...');
    require('./analysis/stakes_analysis.js');
    
    console.log('\n3️⃣ Running Odds vs Profitability Analysis...');
    require('./analysis/odds_analysis.js');
    
    console.log('\n✅ Analysis suite completed successfully!');
    
} catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.log('\nMake sure you have run the discovery first: node run_discovery.js');
} 