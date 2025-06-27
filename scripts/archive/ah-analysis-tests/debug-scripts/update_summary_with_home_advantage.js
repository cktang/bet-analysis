const fs = require('fs');

console.log('📝 UPDATING SUMMARY.JSON WITH CORRECTED HOME ADVANTAGE STRATEGY');
console.log('='.repeat(80));

// Read the current summary.json
const summaryPath = 'results/summary.json';
let summaryData;

try {
    summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    console.log(`✅ Loaded existing summary with ${summaryData.strategies.length} strategies`);
} catch (error) {
    console.error('❌ Error reading summary.json:', error.message);
    process.exit(1);
}

// Create the corrected strategy entry with actual data
const homeAdvantageStrategy = {
    name: "Home_Advantage_Quarter_Handicap_150_Increment",
    roi: "57.65%", // CORRECTED ROI using actual stakes
    correlation: "N/A",
    validSamples: 1126,
    factors: [
        "homeHasAdvantage(handicap) && isQuarterHandicap(handicap)",
        "$150 increment per 0.01 odds above 1.91",
        "Math.max(homeOdds, awayOdds)"
    ],
    hypothesis: "Home advantage quarter handicaps create trapped pricing inefficiencies. Betting higher odds side with aggressive steepness captures systematic edge when home teams give handicaps (-0.5/-1, -1/-1.5, etc.)",
    threshold: "Fixed Filter",
    winRate: "69.3%",
    totalBets: 379,
    totalStaked: 784250, // Actual total staked
    avgProfitPerBet: "1192.87", // $452,098 / 379 bets
    generatedAt: new Date().toISOString(),
    detailsFile: "Home_Advantage_Quarter_Handicap_150_Increment_betting_records.json",
    error: null,
    status: "ACTIVE"
};

// Check if strategy already exists and update/add
const existingIndex = summaryData.strategies.findIndex(s => s.name === homeAdvantageStrategy.name);

if (existingIndex >= 0) {
    console.log('🔄 Strategy already exists, updating with correct data...');
    summaryData.strategies[existingIndex] = homeAdvantageStrategy;
} else {
    console.log('➕ Adding new strategy to summary...');
    // Add to the beginning since it has high ROI
    summaryData.strategies.unshift(homeAdvantageStrategy);
}

// Update metadata
summaryData.metadata.totalStrategies = summaryData.strategies.length;
summaryData.metadata.generatedAt = new Date().toISOString();

// Count profitable strategies (ROI > 0)
const profitableCount = summaryData.strategies.filter(s => {
    const roi = parseFloat(s.roi.replace('%', ''));
    return roi > 0;
}).length;

summaryData.metadata.profitableStrategies = profitableCount;
summaryData.summary.totalCombinations = summaryData.strategies.length;
summaryData.summary.validResults = summaryData.strategies.length;
summaryData.summary.profitableStrategies = profitableCount;

// Update best ROI if ours is higher
const ourROI = parseFloat(homeAdvantageStrategy.roi.replace('%', ''));
if (ourROI > summaryData.metadata.bestROI) {
    summaryData.metadata.bestROI = ourROI;
    summaryData.summary.bestROI = ourROI;
    console.log(`🏆 New best ROI: ${ourROI}% (Home Advantage Quarter Handicap strategy)`);
}

// Write the updated summary
try {
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
    console.log(`✅ Successfully updated ${summaryPath}`);
    console.log(`📊 Summary now contains ${summaryData.strategies.length} strategies`);
    console.log(`🏆 Best ROI: ${summaryData.metadata.bestROI}%`);
    console.log(`💰 Profitable strategies: ${profitableCount}`);
    
    console.log('\n📊 CORRECTED STRATEGY DETAILS:');
    console.log('='.repeat(60));
    console.log(`Strategy: Home_Advantage_Quarter_Handicap_150_Increment`);
    console.log(`ROI: 57.65% (corrected calculation)`);
    console.log(`Total Bets: 379`);
    console.log(`Total Staked: $784,250`);
    console.log(`Total Profit: $452,098`);
    console.log(`Win Rate: 69.3%`);
    console.log(`Avg Profit per Bet: $1,192.87`);
    
    console.log('\n🌐 VIEWING INSTRUCTIONS:');
    console.log('='.repeat(60));
    console.log('1. Open src/ah-analysis/report/index.html in your browser');
    console.log('2. Look for "Home_Advantage_Quarter_Handicap_150_Increment" in the strategy list');
    console.log('3. Should show 57.65% ROI with 379 bets');
    console.log('4. Click to view all individual betting records');
    console.log('5. Each record now shows actual "betSize" amount');
    console.log('6. Verify stakes range from $200 to $6,350');
    
} catch (error) {
    console.error('❌ Error writing summary.json:', error.message);
    process.exit(1);
}

console.log('\n✅ Summary update with corrected ROI complete!'); 