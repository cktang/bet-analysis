/**
 * Basic Usage Example
 * Demonstrates how to use the new betting system architecture
 */

import { createBettingSystem, BettingSystemV2, ServiceKeys } from '../index';
import { BettingService, BetRequest } from '../services/BettingService';

async function main() {
  console.log('=== Betting System V2 - Basic Usage Example ===\n');

  // 1. Create and start the system
  const system = createBettingSystem();
  await system.start();

  try {
    // 2. Get services through dependency injection
    const bettingService = await system.getService<BettingService>(ServiceKeys.BETTING_SERVICE);
    
    // 3. Set up event listeners
    const eventBus = system.getEventBus();
    
    eventBus.on('bet.placed', (data: any) => {
      console.log('🎯 Bet placed successfully:', data.betId);
    });
    
    eventBus.on('bet.failed', (data: any) => {
      console.log('❌ Bet failed:', data.error?.message || 'Unknown error');
    });

    // 4. Place a sample bet
    const betRequest: BetRequest = {
      matchId: 'epl_2024_arsenal_vs_chelsea',
      betType: 'handicap',
      amount: 100,
      odds: 1.85,
      league: 'Eng Premier',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea'
    };

    console.log('Placing bet...');
    const result = await bettingService.placeBet(betRequest);
    console.log('Bet result:', result);

    // 5. View betting history
    console.log('\nBetting History:');
    const history = await bettingService.getBetHistory(10);
    history.forEach(bet => {
      console.log(`- ${bet.betId}: ${bet.status} (${bet.message})`);
    });

    // 6. Demonstrate event-driven communication
    console.log('\nTriggering external bet request via events...');
    await eventBus.emit('user.betRequest', { 
      request: {
        matchId: 'epl_2024_liverpool_vs_city',
        betType: 'overunder',
        amount: 50,
        odds: 2.10,
        league: 'Eng Premier',
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester City'
      }
    });

    // 7. Check active bets
    console.log('\nActive bets:');
    const activeBets = await bettingService.getActiveBets();
    console.log(`Currently ${activeBets.length} active bets`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // 8. Clean shutdown
    console.log('\nShutting down system...');
    await system.stop();
  }
}

// Run the example if this file is executed directly
// Note: In a real implementation, you'd set up proper module detection
// if (require.main === module) {
//   main().catch(console.error);
// }

export { main as runBasicExample };