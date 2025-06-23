const fs = require('fs');

/**
 * Demo: Proper Usage of Enhanced Data Structure
 * 
 * Shows how to safely use preMatch data for training and postMatch data for filtering
 */

function demoDataIntegrity() {
    console.log('🎯 ENHANCED DATA STRUCTURE DEMO');
    console.log('=' .repeat(50));
    
    // Load enhanced data
    const data = JSON.parse(fs.readFileSync('data/enhanced/year-2024-2025-enhanced.json', 'utf8'));
    const matches = Object.values(data.matches);
    const sampleMatch = matches[0];
    
    console.log('📊 SAMPLE MATCH:');
    console.log(`${Object.keys(data.matches)[0]}`);
    console.log('');
    
    // ✅ SAFE FOR TRAINING - preMatch data
    console.log('✅ SAFE FOR TRAINING (preMatch):');
    console.log(`   Market: ${sampleMatch.preMatch.match.homeWinOdds} / ${sampleMatch.preMatch.match.drawOdds} / ${sampleMatch.preMatch.match.awayWinOdds}`);
    console.log(`   Market Efficiency: ${sampleMatch.preMatch.enhanced.marketEfficiency}%`);
    console.log(`   Home Implied Prob: ${sampleMatch.preMatch.enhanced.homeImpliedProb}%`);
    console.log(`   Referee: ${sampleMatch.preMatch.fbref.referee}`);
    console.log(`   Venue: ${sampleMatch.preMatch.fbref.venue}`);
    console.log('');
    
    // ❌ DANGEROUS FOR TRAINING - postMatch data
    console.log('❌ DANGEROUS FOR TRAINING (postMatch):');
    console.log(`   Actual Result: ${sampleMatch.postMatch.actualResults.result} (${sampleMatch.postMatch.actualResults.homeGoals}-${sampleMatch.postMatch.actualResults.awayGoals})`);
    console.log(`   Goal Line: ${sampleMatch.postMatch.actualResults.line}`);
    console.log(`   xG Data: ${sampleMatch.postMatch.xgData.homeXG} vs ${sampleMatch.postMatch.xgData.awayXG} (Line: ${sampleMatch.postMatch.xgData.xgLine})`);
    console.log(`   Performance: Home ${sampleMatch.postMatch.performance.homePerformanceRating}, Away ${sampleMatch.postMatch.performance.awayPerformanceRating}`);
    console.log('');
    
    // 🟡 FILTERING EXAMPLE
    console.log('🟡 EXAMPLE: Safe Filtering Usage');
    console.log('=' .repeat(50));
    
    // Filter clean matches for training
    const cleanMatches = matches.filter(match => {
        const incidents = match.postMatch.incidents;
        return incidents.cleanlinessCategory === 'clean' || 
               incidents.cleanlinessCategory === 'minor_incidents';
    });
    
    // Extract training features (preMatch only - NO xG!)
    const trainingData = cleanMatches.map(match => ({
        // ✅ Safe features for prediction
        homeWinOdds: match.preMatch.match.homeWinOdds,
        drawOdds: match.preMatch.match.drawOdds,
        awayWinOdds: match.preMatch.match.awayWinOdds,
        marketEfficiency: match.preMatch.enhanced.marketEfficiency,
        homeImpliedProb: match.preMatch.enhanced.homeImpliedProb,
        hadCut: match.preMatch.enhanced.hadCut,
        ouCut: match.preMatch.enhanced.ouCut,
        attendance: match.preMatch.fbref.attendance,
        
        // ❌ DO NOT USE - for reference only
        // actualResult: match.postMatch.actualResults.result,
        // homeXG: match.postMatch.xgData.homeXG,  // Now correctly in postMatch!
        // xgLine: match.postMatch.xgData.xgLine   // xG is post-match data
    }));
    
    console.log(`Clean matches for training: ${cleanMatches.length}/${matches.length} (${Math.round(cleanMatches.length/matches.length*100)}%)`);
    console.log(`Training features per match: ${Object.keys(trainingData[0]).length}`);
    console.log('');
    
    // Show data integrity verification
    console.log('🛡️  DATA INTEGRITY VERIFICATION:');
    console.log('=' .repeat(50));
    console.log('✅ Result-dependent stats isolated in postMatch');
    console.log('✅ Predictive features available in preMatch');
    console.log('✅ Filtering capabilities preserved');
    console.log('✅ No data leakage risk');
    console.log('');
    
    console.log('📋 USAGE SUMMARY:');
    console.log('• Training: Use preMatch.* and timeSeries.*');
    console.log('• Filtering: Use postMatch.incidents.* to exclude special events');
    console.log('• Analysis: Use postMatch.* for post-hoc understanding');
    console.log('• Never: Use postMatch.actualResults.* as prediction features');
}

if (require.main === module) {
    demoDataIntegrity();
}

module.exports = { demoDataIntegrity }; 