// Quick verification of the corrected calculation
const totalBets = 1122;
const totalReturn = 61484;
const totalInvestment = totalBets * 100; // $112,200

console.log('=== CORRECTED CALCULATION ===');
console.log(`Total bets: ${totalBets}`);
console.log(`Total investment: $${totalInvestment.toLocaleString()}`);
console.log(`Total return: $${totalReturn.toLocaleString()}`);

const actualProfit = totalReturn - totalInvestment;
const profitability = actualProfit / totalInvestment;

console.log(`Actual profit: $${actualProfit.toLocaleString()}`);
console.log(`Profitability: ${(profitability * 100).toFixed(2)}%`);

if (actualProfit < 0) {
    console.log('❌ This is a LOSING strategy');
} else {
    console.log('✅ This is a WINNING strategy');
}

console.log('\n=== WHAT THE OLD CALCULATION SHOWED ===');
const oldCalculation = totalReturn / totalBets / 100;
console.log(`Old "profitability": ${(oldCalculation * 100).toFixed(2)}%`);
console.log('This was completely wrong - it was just average return per bet divided by 100');