console.log('💰 DETAILED 25x STEEPNESS BETTING TABLE');
console.log('='.repeat(80));
console.log('📊 Exact betting amounts at every 0.01 odds increment');
console.log('🎯 Linear scaling: $200 (at 1.91) to $5000 (at 2.24+)');
console.log('');

// Define the betting range
const minOdds = 1.91;
const maxOdds = 2.24;  // Cap at 2.24 for 25x steepness
const minStake = 200;
const maxStake = 5000;

// Calculate stake for any odds
function calculateStake(odds) {
    if (odds <= minOdds) return minStake;
    if (odds >= maxOdds) return maxStake;
    
    const ratio = (odds - minOdds) / (maxOdds - minOdds);
    return minStake + (ratio * (maxStake - minStake));
}

// Generate detailed table
console.log('📋 YOUR EXACT BETTING AMOUNTS:');
console.log('='.repeat(60));
console.log('Odds  | Stake     | Multiplier | Profit if Win');
console.log('-'.repeat(60));

// Start from 1.91 and go to 2.32 (actual max in data) in 0.01 increments
for (let odds = 1.91; odds <= 2.32; odds += 0.01) {
    const stake = calculateStake(odds);
    const multiplier = stake / minStake;
    const profitIfWin = stake * (odds - 1);
    
    console.log(`${odds.toFixed(2)} | $${stake.toFixed(0).padStart(8)} | ${multiplier.toFixed(1).padStart(9)}x | $${profitIfWin.toFixed(0).padStart(10)}`);
}

console.log('-'.repeat(60));
console.log(`Total odds levels: ${Math.round((2.32 - 1.91) / 0.01) + 1}`);
console.log(`Stakes range: $${minStake} to $${maxStake}`);
console.log(`Maximum multiplier: ${(calculateStake(2.32) / minStake).toFixed(1)}x`);

// Show key milestones
console.log('\n🎯 KEY BETTING MILESTONES:');
console.log('='.repeat(50));

const milestones = [
    { odds: 1.91, label: 'Minimum (start of range)' },
    { odds: 1.95, label: 'Early range' },
    { odds: 2.00, label: 'Round number' },
    { odds: 2.05, label: 'Mid range' },
    { odds: 2.10, label: 'Higher range' },
    { odds: 2.15, label: 'Premium range' },
    { odds: 2.20, label: 'High range' },
    { odds: 2.24, label: 'Maximum steepness (25x)' },
    { odds: 2.30, label: 'Above 25x cap' },
    { odds: 2.32, label: 'Data maximum' }
];

milestones.forEach(milestone => {
    const stake = calculateStake(milestone.odds);
    const multiplier = stake / minStake;
    const profitIfWin = stake * (milestone.odds - 1);
    
    console.log(`${milestone.odds.toFixed(2)} | $${stake.toFixed(0).padStart(4)} | ${multiplier.toFixed(1).padStart(4)}x | ${milestone.label}`);
});

// Calculate how much you'd bet across common odds ranges
console.log('\n📊 BETTING VOLUME BY ODDS RANGE:');
console.log('='.repeat(60));

const ranges = [
    { min: 1.91, max: 2.00, label: '1.91-2.00 (39.3% of cases)' },
    { min: 2.00, max: 2.10, label: '2.00-2.10 (39.2% of cases)' },
    { min: 2.10, max: 2.20, label: '2.10-2.20 (18.9% of cases)' },
    { min: 2.20, max: 2.24, label: '2.20-2.24 (1.6% of cases)' },
    { min: 2.24, max: 2.32, label: '2.24+ (1.0% of cases)' }
];

ranges.forEach(range => {
    const avgOdds = (range.min + range.max) / 2;
    const avgStake = calculateStake(avgOdds);
    const minStakeRange = calculateStake(range.min);
    const maxStakeRange = calculateStake(range.max);
    
    console.log(`${range.label}`);
    console.log(`  Stakes: $${minStakeRange.toFixed(0)} - $${maxStakeRange.toFixed(0)} (avg $${avgStake.toFixed(0)})`);
});

console.log('\n🚀 REAL-WORLD IMPLEMENTATION:');
console.log('='.repeat(50));
console.log('✅ Minimum bet: $200 (HKJC requirement)');
console.log('✅ Maximum bet: $5000 (your comfort level)');
console.log('✅ Precise scaling: Every 0.01 odds increment');
console.log('✅ 25x steepness: Maximum aggression at 2.24+ odds');
console.log('✅ Covers 100% of realistic AH quarter handicap range');

console.log('\n💡 BETTING STRATEGY:');
console.log('- Use this exact table for every quarter handicap bet');
console.log('- Find higher odds, look up exact stake amount');
console.log('- Maximum profit concentration at 2.20+ odds');
console.log('- Conservative at 1.91-1.95, aggressive at 2.15+');

console.log('\n✅ Detailed betting table complete!'); 