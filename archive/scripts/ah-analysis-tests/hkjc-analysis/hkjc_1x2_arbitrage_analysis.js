const fs = require('fs');

console.log('🎯 HKJC 1X2 vs QUARTER HANDICAP ARBITRAGE ANALYSIS');
console.log('='.repeat(70));
console.log('💡 Theory: HKJC trapped quarter handicaps should deviate from 1X2 equivalents');
console.log('   -0.5 handicap = Home Win (1X2)');
console.log('   +0.5 handicap = Away Win + Draw (1X2)');
console.log('');

// Load data
const data2022 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const data2023 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2023-2024-enhanced.json', 'utf8'));  
const data2024 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

const allMatches = [
    ...Object.values(data2022.matches || {}),
    ...Object.values(data2023.matches || {}),
    ...Object.values(data2024.matches || {})
];

console.log(`📊 Total matches loaded: ${allMatches.length}\n`);

// Function to extract implied half handicap odds from quarter handicap
function extractImpliedHalfHandicapOdds(quarterOdds1, quarterOdds2, handicapStr) {
    // For quarter handicaps like 0/-0.5, the bet is split:
    // Half on 0 (push if draw), half on -0.5 (win if home wins)
    // This means quarter odds should reflect both components
    
    // Simplified: The -0.5 component odds can be approximated
    // This is complex math, but we can estimate the implied pure half odds
    
    const parts = handicapStr.split('/').map(h => parseFloat(h));
    const handicap1 = parts[0]; // e.g., 0
    const handicap2 = parts[1]; // e.g., -0.5
    
    // If one part is level (0) and other is half (-0.5), 
    // the half part dominates the pricing for winning scenarios
    
    if (Math.abs(handicap1) < 0.1 && Math.abs(handicap2 - (-0.5)) < 0.1) {
        // 0/-0.5 case: estimate pure -0.5 odds
        // Quarter odds are roughly average of level and half odds
        // Rough approximation: pure half odds ≈ 2 * quarter odds - level odds
        // Level odds for 0 handicap ≈ (home win odds + push value)
        
        // Simplified estimation: quarter odds are close to pure half odds for winning scenarios
        return quarterOdds1 * 1.05; // Small adjustment for push component
    }
    
    if (Math.abs(handicap1) < 0.1 && Math.abs(handicap2 - 0.5) < 0.1) {
        // 0/+0.5 case: estimate pure +0.5 odds  
        return quarterOdds2 * 1.05;
    }
    
    // For other cases, return original odds
    return quarterOdds1;
}

// Function to calculate 1X2 equivalent odds
function calculate1X2EquivalentOdds(homeWinOdds, drawOdds, awayWinOdds) {
    // -0.5 handicap equivalent = Home Win
    const homeHalfEquivalent = homeWinOdds;
    
    // +0.5 handicap equivalent = Away Win + Draw (combined probability)
    const awayDrawProb = (1 / awayWinOdds) + (1 / drawOdds);
    const awayHalfEquivalent = 1 / awayDrawProb;
    
    return {
        homeHalfEquivalent,
        awayHalfEquivalent,
        homeWinOdds,
        drawOdds, 
        awayWinOdds
    };
}

// Analyze extreme odds quarter handicap cases
function analyzeExtremeOddsArbitrage() {
    const extremeArbitrageCases = [];
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!ah.homeHandicap.includes('/')) return; // Quarter handicaps only
        
        const homeOdds = ah.homeOdds;
        const awayOdds = ah.awayOdds;
        const homeWinOdds = matchInfo.homeWinOdds;
        const drawOdds = matchInfo.drawOdds;
        const awayWinOdds = matchInfo.awayWinOdds;
        
        if (!homeWinOdds || !drawOdds || !awayWinOdds) return;
        
        // Check for extreme odds (≤1.72 threshold)
        const hasExtremeOdds = homeOdds <= 1.72 || awayOdds <= 1.72;
        
        if (hasExtremeOdds) {
            // Calculate 1X2 equivalent odds
            const equivalent1X2 = calculate1X2EquivalentOdds(homeWinOdds, drawOdds, awayWinOdds);
            
            // Extract implied half handicap odds from quarter handicap
            const impliedHomeHalf = extractImpliedHalfHandicapOdds(homeOdds, awayOdds, ah.homeHandicap);
            const impliedAwayHalf = extractImpliedHalfHandicapOdds(awayOdds, homeOdds, ah.homeHandicap);
            
            // Calculate deviations
            const homeDeviation = impliedHomeHalf - equivalent1X2.homeHalfEquivalent;
            const awayDeviation = impliedAwayHalf - equivalent1X2.awayHalfEquivalent;
            
            const homeDeviationPct = (homeDeviation / equivalent1X2.homeHalfEquivalent) * 100;
            const awayDeviationPct = (awayDeviation / equivalent1X2.awayHalfEquivalent) * 100;
            
            extremeArbitrageCases.push({
                date: matchInfo.date,
                homeTeam: matchInfo.homeTeam,
                awayTeam: matchInfo.awayTeam,
                handicap: ah.homeHandicap,
                
                // Quarter handicap odds
                quarterHomeOdds: homeOdds,
                quarterAwayOdds: awayOdds,
                
                // 1X2 odds
                homeWinOdds: homeWinOdds,
                drawOdds: drawOdds,
                awayWinOdds: awayWinOdds,
                
                // Equivalent calculations
                homeHalfEquivalent: equivalent1X2.homeHalfEquivalent,
                awayHalfEquivalent: equivalent1X2.awayHalfEquivalent,
                
                // Implied quarter handicap half odds
                impliedHomeHalf: impliedHomeHalf,
                impliedAwayHalf: impliedAwayHalf,
                
                // Deviations
                homeDeviation: homeDeviation,
                awayDeviation: awayDeviation,
                homeDeviationPct: homeDeviationPct,
                awayDeviationPct: awayDeviationPct,
                
                // Which side has extreme odds
                extremeSide: homeOdds <= 1.72 ? 'home' : 'away',
                extremeOdds: Math.min(homeOdds, awayOdds),
                
                // Match outcome
                homeScore: matchInfo.homeScore,
                awayScore: matchInfo.awayScore,
                homeWin: matchInfo.homeScore > matchInfo.awayScore,
                draw: matchInfo.homeScore === matchInfo.awayScore,
                awayWin: matchInfo.awayScore > matchInfo.homeScore,
                
                week: match.preMatch?.fbref?.week || 'Unknown'
            });
        }
    });
    
    return extremeArbitrageCases;
}

// Run the analysis
console.log('🎯 EXTREME ODDS ARBITRAGE ANALYSIS');
console.log('='.repeat(70));

const arbitrageCases = analyzeExtremeOddsArbitrage();

console.log(`📈 Total extreme odds quarter handicap cases: ${arbitrageCases.length}`);

if (arbitrageCases.length === 0) {
    console.log('❌ No cases found - check data availability');
    return;
}

// Summary statistics
console.log('\n📊 DEVIATION SUMMARY STATISTICS:');
console.log('-'.repeat(60));

const homeDeviations = arbitrageCases.map(c => c.homeDeviationPct).filter(d => !isNaN(d));
const awayDeviations = arbitrageCases.map(c => c.awayDeviationPct).filter(d => !isNaN(d));

if (homeDeviations.length > 0) {
    const avgHomeDeviation = homeDeviations.reduce((a, b) => a + b) / homeDeviations.length;
    const maxHomeDeviation = Math.max(...homeDeviations);
    const minHomeDeviation = Math.min(...homeDeviations);
    
    console.log(`Home odds deviations:`);
    console.log(`  Average: ${avgHomeDeviation.toFixed(2)}%`);
    console.log(`  Range: ${minHomeDeviation.toFixed(2)}% to ${maxHomeDeviation.toFixed(2)}%`);
}

if (awayDeviations.length > 0) {
    const avgAwayDeviation = awayDeviations.reduce((a, b) => a + b) / awayDeviations.length;
    const maxAwayDeviation = Math.max(...awayDeviations);
    const minAwayDeviation = Math.min(...awayDeviations);
    
    console.log(`Away odds deviations:`);
    console.log(`  Average: ${avgAwayDeviation.toFixed(2)}%`);
    console.log(`  Range: ${minAwayDeviation.toFixed(2)}% to ${maxAwayDeviation.toFixed(2)}%`);
}

// Analyze by extreme side
console.log('\n🎯 ANALYSIS BY EXTREME ODDS SIDE:');
console.log('-'.repeat(60));

const homeExtremeCases = arbitrageCases.filter(c => c.extremeSide === 'home');
const awayExtremeCases = arbitrageCases.filter(c => c.extremeSide === 'away');

console.log(`📊 Home extreme cases: ${homeExtremeCases.length}`);
console.log(`📊 Away extreme cases: ${awayExtremeCases.length}`);

// Show sample cases
console.log('\n🔍 SAMPLE ARBITRAGE OPPORTUNITIES:');
console.log('-'.repeat(90));
console.log('Date        | Match                    | Handicap | Quarter | 1X2 Equiv | Deviation | Extreme');
console.log('-'.repeat(90));

arbitrageCases.slice(0, 10).forEach(case_ => {
    const matchStr = `${case_.homeTeam.slice(0,8)} vs ${case_.awayTeam.slice(0,8)}`;
    const dateStr = new Date(case_.date).toISOString().slice(0,10);
    
    if (case_.extremeSide === 'home') {
        console.log(`${dateStr} | ${matchStr.padEnd(24)} | ${case_.handicap.padEnd(8)} | ${case_.quarterHomeOdds.toFixed(2).padStart(7)} | ${case_.homeHalfEquivalent.toFixed(2).padStart(9)} | ${case_.homeDeviationPct.toFixed(1).padStart(8)}% | Home`);
    } else {
        console.log(`${dateStr} | ${matchStr.padEnd(24)} | ${case_.handicap.padEnd(8)} | ${case_.quarterAwayOdds.toFixed(2).padStart(7)} | ${case_.awayHalfEquivalent.toFixed(2).padStart(9)} | ${case_.awayDeviationPct.toFixed(1).padStart(8)}% | Away`);
    }
});

// Analyze systematic patterns
console.log('\n🎯 SYSTEMATIC PATTERN ANALYSIS:');
console.log('-'.repeat(50));

// Count positive vs negative deviations
const positiveHomeDeviations = homeDeviations.filter(d => d > 0).length;
const negativeHomeDeviations = homeDeviations.filter(d => d < 0).length;

const positiveAwayDeviations = awayDeviations.filter(d => d > 0).length;
const negativeAwayDeviations = awayDeviations.filter(d => d < 0).length;

console.log(`Home deviations: ${positiveHomeDeviations} positive, ${negativeHomeDeviations} negative`);
console.log(`Away deviations: ${positiveAwayDeviations} positive, ${negativeAwayDeviations} negative`);

// Check for systematic bias
const homeSystematicBias = homeDeviations.length > 0 ? 
    (homeDeviations.reduce((a, b) => a + b) / homeDeviations.length) : 0;
const awaySystematicBias = awayDeviations.length > 0 ? 
    (awayDeviations.reduce((a, b) => a + b) / awayDeviations.length) : 0;

console.log(`\n📈 SYSTEMATIC BIAS DETECTION:`);
console.log(`Home quarter handicaps vs 1X2: ${homeSystematicBias.toFixed(2)}% average deviation`);
console.log(`Away quarter handicaps vs 1X2: ${awaySystematicBias.toFixed(2)}% average deviation`);

if (Math.abs(homeSystematicBias) > 5) {
    console.log(`🚨 SIGNIFICANT HOME BIAS: ${homeSystematicBias > 0 ? 'Quarter handicaps OVERPRICED' : 'Quarter handicaps UNDERPRICED'}`);
}

if (Math.abs(awaySystematicBias) > 5) {
    console.log(`🚨 SIGNIFICANT AWAY BIAS: ${awaySystematicBias > 0 ? 'Quarter handicaps OVERPRICED' : 'Quarter handicaps UNDERPRICED'}`);
}

// Test arbitrage profitability
console.log('\n💰 ARBITRAGE PROFITABILITY TEST:');
console.log('-'.repeat(50));

let arbitrageOpportunities = 0;
let arbitrageProfits = [];

arbitrageCases.forEach(case_ => {
    // Simple arbitrage test: if quarter odds significantly deviate from 1X2 equivalent
    const homeArbitrage = Math.abs(case_.homeDeviationPct) > 10;
    const awayArbitrage = Math.abs(case_.awayDeviationPct) > 10;
    
    if (homeArbitrage || awayArbitrage) {
        arbitrageOpportunities++;
        
        // Estimate potential profit (simplified)
        const profitPotential = Math.max(Math.abs(case_.homeDeviationPct), Math.abs(case_.awayDeviationPct));
        arbitrageProfits.push(profitPotential);
    }
});

console.log(`🎯 Potential arbitrage opportunities: ${arbitrageOpportunities}/${arbitrageCases.length} (${(arbitrageOpportunities/arbitrageCases.length*100).toFixed(1)}%)`);

if (arbitrageProfits.length > 0) {
    const avgArbitrageProfit = arbitrageProfits.reduce((a, b) => a + b) / arbitrageProfits.length;
    console.log(`💰 Average arbitrage potential: ${avgArbitrageProfit.toFixed(2)}%`);
}

console.log('\n✅ HKJC 1X2 vs Quarter Handicap arbitrage analysis complete!');

// Save results for further analysis
const results = {
    totalCases: arbitrageCases.length,
    homeSystematicBias: homeSystematicBias,
    awaySystematicBias: awaySystematicBias,
    arbitrageOpportunities: arbitrageOpportunities,
    sampleCases: arbitrageCases.slice(0, 20)
};

fs.writeFileSync('hkjc_1x2_arbitrage_results.json', JSON.stringify(results, null, 2));
console.log('📁 Results saved to hkjc_1x2_arbitrage_results.json'); 