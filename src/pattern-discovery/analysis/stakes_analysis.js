#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Analyze stakes distribution from discovery results
function analyzeStakes() {
    const resultsPath = path.join(__dirname, 'results', 'optimized_discovery.json');
    
    if (!fs.existsSync(resultsPath)) {
        console.log('❌ No optimized_discovery.json found');
        return;
    }
    
    console.log('📊 Loading discovery results for stakes analysis...');
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Filter to profitable patterns only
    const profitable = results.filter(r => r.roi > 0 && r.bets >= 20);
    
    console.log(`\n💰 STAKES DISTRIBUTION ANALYSIS:`);
    console.log(`   Analyzing ${profitable.length} profitable patterns\n`);
    
    // Analyze stakes by staking method
    const fixedStakes = profitable.filter(r => r.stakingMethod === 'fixed');
    const variableStakes = profitable.filter(r => r.stakingMethod === 'variable');
    
    console.log(`📈 BY STAKING METHOD:`);
    console.log(`   Fixed staking: ${fixedStakes.length} patterns`);
    console.log(`   Variable staking: ${variableStakes.length} patterns`);
    
    // Calculate average stakes
    if (fixedStakes.length > 0) {
        const avgFixedStake = fixedStakes.reduce((sum, r) => sum + r.averageStake, 0) / fixedStakes.length;
        const avgFixedROI = fixedStakes.reduce((sum, r) => sum + r.roi, 0) / fixedStakes.length;
        console.log(`   Fixed - Avg stake: $${avgFixedStake.toFixed(0)}, Avg ROI: ${avgFixedROI.toFixed(2)}%`);
    }
    
    if (variableStakes.length > 0) {
        const avgVariableStake = variableStakes.reduce((sum, r) => sum + r.averageStake, 0) / variableStakes.length;
        const avgVariableROI = variableStakes.reduce((sum, r) => sum + r.roi, 0) / variableStakes.length;
        console.log(`   Variable - Avg stake: $${avgVariableStake.toFixed(0)}, Avg ROI: ${avgVariableROI.toFixed(2)}%`);
    }
    
    // Find patterns with higher stakes (variable staking impact)
    const highStakePatterns = profitable.filter(r => r.averageStake > 250);
    console.log(`\n🚀 HIGH STAKE PATTERNS (avg > $250):`);
    console.log(`   Found ${highStakePatterns.length} patterns with elevated stakes`);
    
    if (highStakePatterns.length > 0) {
        highStakePatterns.slice(0, 10).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.roi}% ROI | $${p.averageStake} avg stake | ${p.bets} bets | ${p.stakingMethod}`);
            console.log(`      ${p.name.substring(0, 80)}...`);
        });
    }
    
    // Stakes distribution buckets
    const stakeBuckets = {
        '200': 0,      // Base stakes
        '200-300': 0,  // Low variable
        '300-500': 0,  // Medium variable  
        '500+': 0      // High variable
    };
    
    profitable.forEach(r => {
        if (r.averageStake <= 200) stakeBuckets['200']++;
        else if (r.averageStake <= 300) stakeBuckets['200-300']++;
        else if (r.averageStake <= 500) stakeBuckets['300-500']++;
        else stakeBuckets['500+']++;
    });
    
    console.log(`\n📊 STAKES DISTRIBUTION:`);
    Object.keys(stakeBuckets).forEach(bucket => {
        const count = stakeBuckets[bucket];
        const percentage = ((count / profitable.length) * 100).toFixed(1);
        console.log(`   $${bucket}: ${count} patterns (${percentage}%)`);
    });
    
    // Compare fixed vs variable performance
    console.log(`\n⚖️  FIXED vs VARIABLE STAKING COMPARISON:`);
    
    if (fixedStakes.length > 0 && variableStakes.length > 0) {
        const topFixed = fixedStakes.slice(0, 100);
        const topVariable = variableStakes.slice(0, 100);
        
        const fixedAvgROI = topFixed.reduce((sum, r) => sum + r.roi, 0) / topFixed.length;
        const variableAvgROI = topVariable.reduce((sum, r) => sum + r.roi, 0) / topVariable.length;
        
        const fixedTotalProfit = topFixed.reduce((sum, r) => sum + r.totalProfit, 0);
        const variableTotalProfit = topVariable.reduce((sum, r) => sum + r.totalProfit, 0);
        
        console.log(`   Top 100 Fixed Patterns:`);
        console.log(`     Average ROI: ${fixedAvgROI.toFixed(2)}%`);
        console.log(`     Total Profit: $${fixedTotalProfit.toFixed(0)}`);
        
        console.log(`   Top 100 Variable Patterns:`);
        console.log(`     Average ROI: ${variableAvgROI.toFixed(2)}%`);
        console.log(`     Total Profit: $${variableTotalProfit.toFixed(0)}`);
        
        const profitDiff = variableTotalProfit - fixedTotalProfit;
        const roiDiff = variableAvgROI - fixedAvgROI;
        
        console.log(`   📈 Variable vs Fixed:`);
        console.log(`     Profit difference: $${profitDiff.toFixed(0)} (${profitDiff > 0 ? '+' : ''}${((profitDiff/fixedTotalProfit)*100).toFixed(1)}%)`);
        console.log(`     ROI difference: ${roiDiff > 0 ? '+' : ''}${roiDiff.toFixed(2)} percentage points`);
    }
    
    // Find highest individual stakes patterns 
    const sortedByStake = [...profitable].sort((a, b) => b.averageStake - a.averageStake);
    console.log(`\n💎 HIGHEST INDIVIDUAL STAKES:`);
    sortedByStake.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. $${p.averageStake} avg stake | ${p.roi}% ROI | ${p.bets} bets`);
        console.log(`      ${p.name}`);
    });
}

analyzeStakes(); 