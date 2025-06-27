const fs = require('fs');

console.log('🔍 DETAILED REAL-LIFE CASE ANALYSIS');
console.log('='.repeat(60));
console.log('🎯 Let\'s verify the arbitrage calculations with specific examples');
console.log('');

// Load the arbitrage results
const results = JSON.parse(fs.readFileSync('hkjc_1x2_arbitrage_results.json', 'utf8'));

// Pick the first few cases for detailed analysis
const casesToAnalyze = results.sampleCases.slice(0, 3);

casesToAnalyze.forEach((case_, index) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 CASE ${index + 1}: ${case_.homeTeam} vs ${case_.awayTeam}`);
    console.log(`📅 Date: ${new Date(case_.date).toDateString()}`);
    console.log(`📈 Result: ${case_.homeScore}-${case_.awayScore} (Week ${case_.week})`);
    console.log(`${'='.repeat(70)}`);
    
    console.log('\n🎯 MARKET DATA:');
    console.log(`   Asian Handicap: ${case_.handicap}`);
    console.log(`   Quarter Odds:   Home ${case_.quarterHomeOdds} | Away ${case_.quarterAwayOdds}`);
    console.log(`   1X2 Odds:       Home ${case_.homeWinOdds} | Draw ${case_.drawOdds} | Away ${case_.awayWinOdds}`);
    
    // Let's manually calculate what the handicap means
    console.log('\n🔍 HANDICAP BREAKDOWN:');
    const handicapParts = case_.handicap.split('/');
    const handicap1 = parseFloat(handicapParts[0]);
    const handicap2 = parseFloat(handicapParts[1]);
    
    console.log(`   Split: ${handicap1} and ${handicap2}`);
    console.log(`   This means: Half bet on ${handicap1} handicap, half bet on ${handicap2} handicap`);
    
    // Explain what each handicap means
    if (case_.handicap === '0/+0.5') {
        console.log(`   🏠 Home team handicap: 0/-0.5 (giving 0 to 0.5 goal start to away)`);
        console.log(`   ✈️  Away team handicap: 0/+0.5 (getting 0 to 0.5 goal start)`);
        console.log(`   Away bet wins if: Away wins OR draws (both +0 and +0.5 cover)`);
        console.log(`   Away bet loses if: Away loses by 1+ goals (both +0 and +0.5 lose)`);
    } else if (case_.handicap === '0/-0.5') {
        console.log(`   🏠 Home team handicap: 0/-0.5 (getting 0 to 0.5 goal start)`);
        console.log(`   ✈️  Away team handicap: 0/+0.5 (giving 0 to 0.5 goal start to home)`);
        console.log(`   Home bet wins if: Home wins OR draws (both 0 and -0.5 cover)`);
        console.log(`   Home bet loses if: Home loses by 1+ goals`);
    } else if (case_.handicap === '-0.5/-1') {
        console.log(`   🏠 Home team handicap: -0.5/-1 (giving 0.5 to 1 goal start to away)`);
        console.log(`   ✈️  Away team handicap: +0.5/+1 (getting 0.5 to 1 goal start)`);
        console.log(`   Home bet wins if: Home wins by 2+ goals (both -0.5 and -1 cover)`);
        console.log(`   Home bet half-wins if: Home wins by exactly 1 (-0.5 wins, -1 pushes)`);
        console.log(`   Home bet loses if: Home draws or loses`);
    } else {
        console.log(`   Custom handicap: ${case_.handicap}`);
    }
    
    // Calculate 1X2 probabilities
    console.log('\n📊 1X2 MARKET ANALYSIS:');
    const homeWinProb = 1 / case_.homeWinOdds;
    const drawProb = 1 / case_.drawOdds;
    const awayWinProb = 1 / case_.awayWinOdds;
    const totalProb = homeWinProb + drawProb + awayWinProb;
    const margin = (totalProb - 1) * 100;
    
    console.log(`   Home Win Probability: ${(homeWinProb * 100).toFixed(2)}%`);
    console.log(`   Draw Probability:     ${(drawProb * 100).toFixed(2)}%`);
    console.log(`   Away Win Probability: ${(awayWinProb * 100).toFixed(2)}%`);
    console.log(`   Bookmaker Margin:     ${margin.toFixed(2)}%`);
    
    // Calculate what the quarter handicap SHOULD be based on 1X2
    console.log('\n🎯 THEORETICAL QUARTER HANDICAP ODDS:');
    
    if (case_.handicap === '0/+0.5' || case_.handicap === '0/-0.5') {
        // For level handicaps, one side should equal "not home win" or "not away win"
        if (case_.extremeSide === 'away') {
            // Away team extreme odds in 0/+0.5
            const awayWinOrDrawProb = awayWinProb + drawProb;
            const theoreticalAwayOdds = 1 / awayWinOrDrawProb;
            
            console.log(`   Away team gets +0/+0.5 handicap`);
            console.log(`   Should win if: Away wins OR draws`);
            console.log(`   Theoretical probability: ${(awayWinOrDrawProb * 100).toFixed(2)}%`);
            console.log(`   Theoretical odds: ${theoreticalAwayOdds.toFixed(3)}`);
            console.log(`   HKJC offering: ${case_.quarterAwayOdds}`);
            console.log(`   Difference: ${case_.quarterAwayOdds > theoreticalAwayOdds ? 'HKJC odds are BETTER (underpriced)' : 'HKJC odds are WORSE (overpriced)'}`);
            
        } else {
            // Home team extreme odds in 0/-0.5  
            const homeWinOrDrawProb = homeWinProb + drawProb;
            const theoreticalHomeOdds = 1 / homeWinOrDrawProb;
            
            console.log(`   Home team gets 0/-0.5 handicap`);
            console.log(`   Should win if: Home wins OR draws`);
            console.log(`   Theoretical probability: ${(homeWinOrDrawProb * 100).toFixed(2)}%`);
            console.log(`   Theoretical odds: ${theoreticalHomeOdds.toFixed(3)}`);
            console.log(`   HKJC offering: ${case_.quarterHomeOdds}`);
            console.log(`   Difference: ${case_.quarterHomeOdds > theoreticalHomeOdds ? 'HKJC odds are BETTER (underpriced)' : 'HKJC odds are WORSE (overpriced)'}`);
        }
    }
    
    // Check what actually happened
    console.log('\n⚽ ACTUAL MATCH OUTCOME:');
    console.log(`   Final Score: ${case_.homeTeam} ${case_.homeScore}-${case_.awayScore} ${case_.awayTeam}`);
    
    // Calculate what happened to the quarter handicap bets
    const homeScoreAdj1 = case_.homeScore + handicap1;
    const homeScoreAdj2 = case_.homeScore + handicap2;
    
    console.log('\n💰 QUARTER HANDICAP BET RESULTS:');
    
    if (case_.extremeSide === 'home') {
        console.log(`   Home bet (odds ${case_.quarterHomeOdds}):`);
        
        // Check each half of the quarter bet
        let result1 = 'LOSE';
        let result2 = 'LOSE';
        
        if (homeScoreAdj1 > case_.awayScore) result1 = 'WIN';
        else if (homeScoreAdj1 === case_.awayScore) result1 = 'PUSH';
        
        if (homeScoreAdj2 > case_.awayScore) result2 = 'WIN';
        else if (homeScoreAdj2 === case_.awayScore) result2 = 'PUSH';
        
        console.log(`   Half 1 (${handicap1}): Home ${case_.homeScore}${handicap1 >= 0 ? '+' + handicap1 : handicap1} vs Away ${case_.awayScore} = ${result1}`);
        console.log(`   Half 2 (${handicap2}): Home ${case_.homeScore}${handicap2 >= 0 ? '+' + handicap2 : handicap2} vs Away ${case_.awayScore} = ${result2}`);
        
        // Overall result
        if (result1 === 'WIN' && result2 === 'WIN') {
            console.log(`   ✅ Overall: FULL WIN - Profit: +${((case_.quarterHomeOdds - 1) * 100).toFixed(0)} units`);
        } else if ((result1 === 'WIN' && result2 === 'PUSH') || (result1 === 'PUSH' && result2 === 'WIN')) {
            console.log(`   🔶 Overall: HALF WIN - Profit: +${((case_.quarterHomeOdds - 1) * 50).toFixed(0)} units`);
        } else if (result1 === 'PUSH' && result2 === 'PUSH') {
            console.log(`   🔄 Overall: PUSH - Profit: 0 units`);
        } else if ((result1 === 'LOSE' && result2 === 'PUSH') || (result1 === 'PUSH' && result2 === 'LOSE')) {
            console.log(`   🔶 Overall: HALF LOSS - Profit: -50 units`);
        } else {
            console.log(`   ❌ Overall: FULL LOSS - Profit: -100 units`);
        }
        
    } else {
        // Away bet analysis
        console.log(`   Away bet (odds ${case_.quarterAwayOdds}):`);
        
        const awayScoreAdj1 = case_.awayScore - handicap1; // Away perspective  
        const awayScoreAdj2 = case_.awayScore - handicap2;
        
        let result1 = 'LOSE';
        let result2 = 'LOSE';
        
        if (awayScoreAdj1 > case_.homeScore) result1 = 'WIN';
        else if (awayScoreAdj1 === case_.homeScore) result1 = 'PUSH';
        
        if (awayScoreAdj2 > case_.homeScore) result2 = 'WIN';
        else if (awayScoreAdj2 === case_.homeScore) result2 = 'PUSH';
        
        console.log(`   Half 1 (${-handicap1}): Away ${case_.awayScore}${-handicap1 >= 0 ? '+' + (-handicap1) : -handicap1} vs Home ${case_.homeScore} = ${result1}`);
        console.log(`   Half 2 (${-handicap2}): Away ${case_.awayScore}${-handicap2 >= 0 ? '+' + (-handicap2) : -handicap2} vs Home ${case_.homeScore} = ${result2}`);
        
        // Overall result
        if (result1 === 'WIN' && result2 === 'WIN') {
            console.log(`   ✅ Overall: FULL WIN - Profit: +${((case_.quarterAwayOdds - 1) * 100).toFixed(0)} units`);
        } else if ((result1 === 'WIN' && result2 === 'PUSH') || (result1 === 'PUSH' && result2 === 'WIN')) {
            console.log(`   🔶 Overall: HALF WIN - Profit: +${((case_.quarterAwayOdds - 1) * 50).toFixed(0)} units`);
        } else if (result1 === 'PUSH' && result2 === 'PUSH') {
            console.log(`   🔄 Overall: PUSH - Profit: 0 units`);
        } else if ((result1 === 'LOSE' && result2 === 'PUSH') || (result1 === 'PUSH' && result2 === 'LOSE')) {
            console.log(`   🔶 Overall: HALF LOSS - Profit: -50 units`);
        } else {
            console.log(`   ❌ Overall: FULL LOSS - Profit: -100 units`);
        }
    }
    
    console.log('\n🎯 ARBITRAGE ANALYSIS VERDICT:');
    if (case_.extremeSide === 'away') {
        const theoreticalAwayOdds = 1 / (awayWinProb + drawProb);
        const hkjcOdds = case_.quarterAwayOdds;
        const deviation = ((hkjcOdds - theoreticalAwayOdds) / theoreticalAwayOdds) * 100;
        
        console.log(`   Theoretical fair odds: ${theoreticalAwayOdds.toFixed(3)}`);
        console.log(`   HKJC offering: ${hkjcOdds}`);
        console.log(`   Deviation: ${deviation.toFixed(1)}%`);
        
        if (deviation > 10) {
            console.log(`   🎯 ARBITRAGE OPPORTUNITY: HKJC is offering better odds than fair value!`);
        } else if (deviation < -10) {
            console.log(`   ❌ BAD BET: HKJC is offering worse odds than fair value`);
        } else {
            console.log(`   🤝 FAIR PRICING: Odds are close to theoretical value`);
        }
    } else {
        const theoreticalHomeOdds = 1 / (homeWinProb + drawProb);
        const hkjcOdds = case_.quarterHomeOdds;
        const deviation = ((hkjcOdds - theoreticalHomeOdds) / theoreticalHomeOdds) * 100;
        
        console.log(`   Theoretical fair odds: ${theoreticalHomeOdds.toFixed(3)}`);
        console.log(`   HKJC offering: ${hkjcOdds}`);
        console.log(`   Deviation: ${deviation.toFixed(1)}%`);
        
        if (deviation > 10) {
            console.log(`   🎯 ARBITRAGE OPPORTUNITY: HKJC is offering better odds than fair value!`);
        } else if (deviation < -10) {
            console.log(`   ❌ BAD BET: HKJC is offering worse odds than fair value`);
        } else {
            console.log(`   🤝 FAIR PRICING: Odds are close to theoretical value`);
        }
    }
});

console.log('\n\n🔍 SUMMARY: Are my calculations correct?');
console.log('Please review the detailed breakdowns above and let me know if the logic makes sense!'); 