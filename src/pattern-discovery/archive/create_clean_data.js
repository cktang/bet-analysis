#!/usr/bin/env node

const fs = require('fs');

console.log('🧹 Creating Clean Deduplicated Dataset...\n');

try {
    const data = JSON.parse(fs.readFileSync('./results/complete_discovery.json', 'utf8'));
    console.log(`📊 Original dataset: ${data.length.toLocaleString()} patterns`);
    
    // Deduplicate by betting signature
    const uniquePatterns = new Map();
    
    data.forEach(pattern => {
        // Create key based on actual betting results
        const key = `${pattern.bets}_${pattern.wins}_${pattern.losses}_${pattern.pushes}_${pattern.totalStake}_${pattern.totalPayout}`;
        
        if (!uniquePatterns.has(key)) {
            // Keep the first occurrence (usually the simplest name)
            uniquePatterns.set(key, pattern);
        } else {
            // If we find a duplicate, prefer the one with shorter/simpler name
            const existing = uniquePatterns.get(key);
            if (pattern.name.length < existing.name.length) {
                uniquePatterns.set(key, pattern);
            }
        }
    });
    
    const cleanData = Array.from(uniquePatterns.values());
    console.log(`✅ Deduplicated dataset: ${cleanData.length} unique patterns`);
    console.log(`🗑️  Removed: ${(data.length - cleanData.length).toLocaleString()} duplicates`);
    
    // Filter for meaningful patterns (at least 1 bet)
    const meaningfulPatterns = cleanData.filter(p => p.bets > 0);
    console.log(`🎯 Meaningful patterns (bets > 0): ${meaningfulPatterns.length}`);
    
    // Separate profitable and loss patterns
    const profitable = meaningfulPatterns.filter(p => p.roi > 0);
    const losses = meaningfulPatterns.filter(p => p.roi <= 0);
    
    console.log(`📈 Profitable patterns: ${profitable.length}`);
    console.log(`📉 Loss patterns: ${losses.length}`);
    
    // Create metadata
    const metadata = {
        created: new Date().toISOString(),
        originalSize: data.length,
        uniqueSize: cleanData.length,
        meaningfulSize: meaningfulPatterns.length,
        profitableCount: profitable.length,
        lossCount: losses.length,
        duplicatesRemoved: data.length - cleanData.length,
        deduplicationRatio: ((data.length - cleanData.length) / data.length * 100).toFixed(2) + '%'
    };
    
    // Show top patterns
    if (profitable.length > 0) {
        console.log('\n🔝 Top 5 Profitable Patterns (after deduplication):');
        profitable
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 5)
            .forEach((p, i) => {
                console.log(`${i + 1}. ${p.name}`);
                console.log(`   ROI: ${p.roi.toFixed(2)}%, Bets: ${p.bets}, Profit: $${p.totalProfit.toLocaleString()}`);
            });
    }
    
    // Save clean dataset for treemap
    const output = {
        metadata,
        patterns: meaningfulPatterns
    };
    
    fs.writeFileSync('./results/clean_discovery.json', JSON.stringify(output, null, 2));
    console.log('\n💾 Saved clean data to results/clean_discovery.json');
    
    const outputStats = fs.statSync('./results/clean_discovery.json');
    console.log(`📏 File size: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n✅ Clean dataset ready for treemap visualization!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
} 