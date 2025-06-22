// Final debug - the profit values are NET profit/loss, not total returns!

console.log('🎯 FINAL DEBUG - Understanding profit values\n');

// The profit values are NET profit/loss from a $100 bet:
// -100 = lost entire bet
// +88 = won $88 profit 
// 0 = push (no profit, no loss)

// Test with simple always-bet-away strategy
const profits = [-50, 0, 88, -50, 0, 56, -50, -50, 0, 88]; // Sample from debug output

console.log('Sample profits:', profits);

const totalBets = profits.length;
const totalNetProfit = profits.reduce((sum, profit) => sum + profit, 0);

console.log(`Total bets: ${totalBets}`);
console.log(`Total net profit: ${totalNetProfit}`);
console.log(`Average profit per bet: ${(totalNetProfit / totalBets).toFixed(2)}`);

// Since these are NET profits, the profitability is simply:
const profitability = totalNetProfit / (totalBets * 100); // Total investment is totalBets * 100

console.log(`Investment per bet: $100`);
console.log(`Total investment: $${totalBets * 100}`);
console.log(`Profitability: ${(profitability * 100).toFixed(2)}%`);

console.log('\n=== THE ERROR IN MY CALCULATION ===');
console.log('I was treating NET profit as total return!');
console.log('Correct: profitability = totalNetProfit / totalInvestment');
console.log('Wrong: profitability = (totalReturn - totalInvestment) / totalInvestment');
console.log('Where I calculated totalReturn = sum of profits (which are already net)');

console.log('\n=== REALISTIC EXPECTATION ===');
console.log('For a losing strategy, we expect -2% to -10% profitability (house edge)');
console.log('For a winning strategy, we might see +1% to +5% profitability');
console.log('Values like -134% mean I was double-counting the losses!');