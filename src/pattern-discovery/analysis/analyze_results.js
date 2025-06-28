#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load and analyze complete discovery results
function analyzeResults() {
    const resultsPath = path.join(__dirname, 'results', 'complete_discovery.json');
    
    if (!fs.existsSync(resultsPath)) {
        console.log('❌ No complete_discovery.json found');
        return;
    }
    
    console.log('📊 Loading discovery results...');
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    console.log(`\n📈 DISCOVERY SUMMARY:`);
    console.log(`   Total combinations tested: ${results.length}`);
    
    // Filter profitable patterns with sufficient sample size
    const profitable = results.filter(r => r.roi > 0 && r.bets >= 50);
    const highProfitable = results.filter(r => r.roi > 5 && r.bets >= 50);
    const verifiedProfitable = results.filter(r => r.roi > 0 && r.bets >= 100);
    
    console.log(`   Profitable patterns (ROI > 0%, bets >= 50): ${profitable.length}`);
    console.log(`   High profit patterns (ROI > 5%, bets >= 50): ${highProfitable.length}`);
    console.log(`   Verified profitable (ROI > 0%, bets >= 100): ${verifiedProfitable.length}`);
    
    // Factor size breakdown
    const sizeBreakdown = {};
    results.forEach(r => {
        sizeBreakdown[r.size] = (sizeBreakdown[r.size] || 0) + 1;
    });
    
    console.log(`\n🔢 FACTOR SIZE BREAKDOWN:`);
    Object.keys(sizeBreakdown).sort().forEach(size => {
        console.log(`   ${size} factors: ${sizeBreakdown[size]} combinations`);
    });
    
    // Top 20 patterns by ROI (with sufficient sample)
    console.log(`\n🏆 TOP 20 PATTERNS (bets >= 50):`);
    profitable.slice(0, 20).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.roi}% ROI | ${p.bets} bets | ${p.winRate}% win | ${p.name}`);
    });
    
    // Best patterns by factor size
    console.log(`\n🎯 BEST PATTERN BY FACTOR SIZE:`);
    [2, 3, 4, 5, 6].forEach(size => {
        const sizePatterns = profitable.filter(r => r.size === size);
        if (sizePatterns.length > 0) {
            const best = sizePatterns[0];
            console.log(`   ${size} factors: ${best.roi}% ROI | ${best.bets} bets | ${best.name}`);
        }
    });
    
    // Show some specific high-performing patterns with details
    if (highProfitable.length > 0) {
        console.log(`\n🚀 HIGH-PERFORMING PATTERNS (ROI > 5%):`);
        highProfitable.slice(0, 10).forEach((p, i) => {
            console.log(`\n   ${i + 1}. ${p.name}`);
            console.log(`      ROI: ${p.roi}% | Bets: ${p.bets} | Win Rate: ${p.winRate}%`);
            console.log(`      Bet Side: ${p.betSide} | Staking: ${p.stakingMethod}`);
            console.log(`      Size: ${p.size} factors`);
        });
    }
    
    // Save summary
    const summary = {
        totalCombinations: results.length,
        profitable: profitable.length,
        highProfitable: highProfitable.length,
        verifiedProfitable: verifiedProfitable.length,
        sizeBreakdown: sizeBreakdown,
        topPatterns: profitable.slice(0, 20),
        bestBySize: [2, 3, 4, 5, 6].map(size => {
            const sizePatterns = profitable.filter(r => r.size === size);
            return sizePatterns.length > 0 ? { size, pattern: sizePatterns[0] } : null;
        }).filter(Boolean)
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'results', 'discovery_summary.json'), 
        JSON.stringify(summary, null, 2)
    );
    
    console.log(`\n✅ Analysis complete! Summary saved to discovery_summary.json`);
}

analyzeResults(); 