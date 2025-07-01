/**
 * Test Suite for AsianHandicapCalculator
 * 
 * Comprehensive tests covering all calculation scenarios, edge cases,
 * and input validation for Asian Handicap betting calculations.
 */

const AsianHandicapCalculator = require('./AsianHandicapCalculator');

describe('AsianHandicapCalculator', () => {
    
    describe('Input Validation', () => {
        test('should throw error for non-numeric scores', () => {
            expect(() => {
                AsianHandicapCalculator.calculate('2', 1, '-0.5', 'home', 1.9, 100);
            }).toThrow('Scores must be numbers');
            
            expect(() => {
                AsianHandicapCalculator.calculate(2, '1', '-0.5', 'home', 1.9, 100);
            }).toThrow('Scores must be numbers');
        });
        
        test('should throw error for invalid bet side', () => {
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5', 'invalid', 1.9, 100);
            }).toThrow('betSide must be "home" or "away"');
            
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5', '', 1.9, 100);
            }).toThrow('betSide must be "home" or "away"');
        });
        
        test('should throw error for invalid odds', () => {
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5', 'home', 0, 100);
            }).toThrow('Odds must be a positive number');
            
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5', 'home', -1.5, 100);
            }).toThrow('Odds must be a positive number');
            
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5', 'home', 'abc', 100);
            }).toThrow('Odds must be a positive number');
        });
        
        test('should throw error for invalid stake', () => {
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5', 'home', 1.9, 0);
            }).toThrow('Stake must be a positive number');
            
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5', 'home', 1.9, -100);
            }).toThrow('Stake must be a positive number');
        });
    });
    
    describe('Simple Handicap Calculations', () => {
        
        describe('Home Team Betting', () => {
            test('should calculate home win with negative handicap', () => {
                // Home 2-1, betting home -0.5 at odds 1.9, stake 100
                // Adjusted: Home 1.5 vs Away 1 = Home wins
                const result = AsianHandicapCalculator.calculate(2, 1, '-0.5', 'home', 1.9, 100);
                
                expect(result.outcome).toBe('win');
                expect(result.payout).toBe(190);
                expect(result.profit).toBe(90);
                expect(result.isQuarterHandicap).toBe(false);
                expect(result.details.handicap).toBe(-0.5);
                expect(result.details.result).toBe(1);
            });
            
            test('should calculate home loss with negative handicap', () => {
                // Home 1-1, betting home -0.5 at odds 1.9, stake 100
                // Adjusted: Home 0.5 vs Away 1 = Away wins
                const result = AsianHandicapCalculator.calculate(1, 1, '-0.5', 'home', 1.9, 100);
                
                expect(result.outcome).toBe('loss');
                expect(result.payout).toBe(0);
                expect(result.profit).toBe(-100);
                expect(result.isQuarterHandicap).toBe(false);
            });
            
            test('should calculate home push with zero handicap', () => {
                // Home 1-1, betting home 0 at odds 1.9, stake 100
                // Adjusted: Home 1 vs Away 1 = Draw/Push
                const result = AsianHandicapCalculator.calculate(1, 1, '0', 'home', 1.9, 100);
                
                expect(result.outcome).toBe('push');
                expect(result.payout).toBe(100);
                expect(result.profit).toBe(0);
            });
            
            test('should calculate home win with positive handicap', () => {
                // Home 1-2, betting home +0.5 at odds 1.9, stake 100
                // Adjusted: Home 1.5 vs Away 2 = Away wins, but we bet home
                const result = AsianHandicapCalculator.calculate(1, 2, '+0.5', 'home', 1.9, 100);
                
                expect(result.outcome).toBe('loss');
                expect(result.profit).toBe(-100);
            });
            
            test('should calculate home win with positive handicap advantage', () => {
                // Home 0-1, betting home +1.5 at odds 1.9, stake 100
                // Adjusted: Home 1.5 vs Away 1 = Home wins
                const result = AsianHandicapCalculator.calculate(0, 1, '+1.5', 'home', 1.9, 100);
                
                expect(result.outcome).toBe('win');
                expect(result.profit).toBe(90);
            });
        });
        
        describe('Away Team Betting', () => {
            test('should calculate away win with home negative handicap', () => {
                // Home 1-1, betting away (home has -0.5) at odds 2.0, stake 100
                // Adjusted: Home 0.5 vs Away 1 = Away wins
                const result = AsianHandicapCalculator.calculate(1, 1, '-0.5', 'away', 2.0, 100);
                
                expect(result.outcome).toBe('win');
                expect(result.payout).toBe(200);
                expect(result.profit).toBe(100);
            });
            
            test('should calculate away loss with home negative handicap', () => {
                // Home 2-1, betting away (home has -0.5) at odds 2.0, stake 100
                // Adjusted: Home 1.5 vs Away 1 = Home wins
                const result = AsianHandicapCalculator.calculate(2, 1, '-0.5', 'away', 2.0, 100);
                
                expect(result.outcome).toBe('loss');
                expect(result.profit).toBe(-100);
            });
        });
        
        describe('Edge Cases', () => {
            test('should handle large handicaps', () => {
                // Home 5-0, betting home -4.5 at odds 1.5, stake 50
                // Adjusted: Home 0.5 vs Away 0 = Home wins
                const result = AsianHandicapCalculator.calculate(5, 0, '-4.5', 'home', 1.5, 50);
                
                expect(result.outcome).toBe('win');
                expect(result.profit).toBe(25);
            });
            
            test('should handle decimal scores', () => {
                // This shouldn't happen in real football but test robustness
                const result = AsianHandicapCalculator.calculate(2.5, 1.3, '-0.5', 'home', 1.8, 100);
                
                expect(result.outcome).toBe('win'); // 2.0 vs 1.3
                expect(result.profit).toBe(80);
            });
        });
    });
    
    describe('Quarter Handicap Calculations', () => {
        
        test('should calculate full win on quarter handicap', () => {
            // Home 2-0, betting home -0.5/-1 at odds 1.9, stake 100
            // Split: 50 on -0.5 (Home 1.5 vs 0 = Win) + 50 on -1 (Home 1 vs 0 = Win)
            const result = AsianHandicapCalculator.calculate(2, 0, '-0.5/-1', 'home', 1.9, 100);
            
            expect(result.outcome).toBe('win');
            expect(result.payout).toBe(190); // Both halves win: 50*1.9 + 50*1.9
            expect(result.profit).toBe(90);
            expect(result.isQuarterHandicap).toBe(true);
            expect(result.details.handicap1).toBe(-0.5);
            expect(result.details.handicap2).toBe(-1);
            expect(result.details.halfStake).toBe(50);
        });
        
        test('should calculate half win on quarter handicap', () => {
            // Home 1-0, betting home -0.5/-1 at odds 1.9, stake 100
            // Split: 50 on -0.5 (Home 0.5 vs 0 = Win) + 50 on -1 (Home 0 vs 0 = Push)
            const result = AsianHandicapCalculator.calculate(1, 0, '-0.5/-1', 'home', 1.9, 100);
            
            expect(result.outcome).toBe('win');
            expect(result.payout).toBe(145); // 50*1.9 (win) + 50 (push)
            expect(result.profit).toBe(45);
            expect(result.details.result1).toBe(1); // -0.5 wins
            expect(result.details.result2).toBe(0); // -1 pushes
        });
        
                 test('should calculate half loss on quarter handicap', () => {
             // Home 1-2, betting home +0.5/+1 at odds 1.9, stake 100
             // Split: 50 on +0.5 (Home 1.5 vs Away 2 = Loss) + 50 on +1 (Home 2 vs Away 2 = Push)
             const result = AsianHandicapCalculator.calculate(1, 2, '+0.5/+1', 'home', 1.9, 100);
             
             expect(result.outcome).toBe('loss');
             expect(result.payout).toBe(50); // 0 (loss) + 50 (push)
             expect(result.profit).toBe(-50);
             expect(result.details.result1).toBe(-1); // +0.5 loses
             expect(result.details.result2).toBe(0); // +1 pushes
         });
        
        test('should calculate full loss on quarter handicap', () => {
            // Home 0-2, betting home -0.5/-1 at odds 1.9, stake 100
            // Split: Both halves lose
            const result = AsianHandicapCalculator.calculate(0, 2, '-0.5/-1', 'home', 1.9, 100);
            
            expect(result.outcome).toBe('loss');
            expect(result.payout).toBe(0);
            expect(result.profit).toBe(-100);
        });
        
        test('should calculate away team quarter handicap', () => {
            // Home 1-2, betting away (home has -0.5/-1) at odds 2.1, stake 200
            // From away perspective: away gets +0.5/+1
            // Split: 100 on +0.5 (Home 1 vs Away 2.5 = Away Win) + 100 on +1 (Home 1 vs Away 3 = Away Win)
            const result = AsianHandicapCalculator.calculate(1, 2, '-0.5/-1', 'away', 2.1, 200);
            
            expect(result.outcome).toBe('win');
            expect(result.payout).toBe(420); // Both halves win
            expect(result.profit).toBe(220);
        });
        
        test('should handle positive quarter handicaps', () => {
            // Home 0-1, betting home +0.5/+1 at odds 1.8, stake 100
            // Split: 50 on +0.5 (Home 0.5 vs 1 = Loss) + 50 on +1 (Home 1 vs 1 = Push)
            const result = AsianHandicapCalculator.calculate(0, 1, '+0.5/+1', 'home', 1.8, 100);
            
            expect(result.outcome).toBe('loss');
            expect(result.payout).toBe(50); // Loss + Push
            expect(result.profit).toBe(-50);
        });
        
        test('should throw error for invalid quarter handicap format', () => {
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, '-0.5/-1/-1.5', 'home', 1.9, 100);
            }).toThrow('Invalid quarter handicap format');
            
            expect(() => {
                AsianHandicapCalculator.calculate(2, 1, 'invalid/format', 'home', 1.9, 100);
            }).toThrow('Invalid handicap numbers');
        });
    });
    
    describe('Helper Methods', () => {
        
        describe('getAwayHandicap', () => {
            test('should convert simple negative home handicap to positive away', () => {
                expect(AsianHandicapCalculator.getAwayHandicap('-1')).toBe('+1');
                expect(AsianHandicapCalculator.getAwayHandicap('-0.5')).toBe('+0.5');
                expect(AsianHandicapCalculator.getAwayHandicap('-2.5')).toBe('+2.5');
            });
            
            test('should convert simple positive home handicap to negative away', () => {
                expect(AsianHandicapCalculator.getAwayHandicap('+1')).toBe('-1');
                expect(AsianHandicapCalculator.getAwayHandicap('+0.5')).toBe('-0.5');
                expect(AsianHandicapCalculator.getAwayHandicap('+1.5')).toBe('-1.5');
            });
            
            test('should handle zero handicap', () => {
                expect(AsianHandicapCalculator.getAwayHandicap('0')).toBe('0');
            });
            
            test('should convert quarter handicaps', () => {
                expect(AsianHandicapCalculator.getAwayHandicap('-0.5/-1')).toBe('+0.5/+1');
                expect(AsianHandicapCalculator.getAwayHandicap('+0.5/+1')).toBe('-0.5/-1');
                expect(AsianHandicapCalculator.getAwayHandicap('-1.5/-2')).toBe('+1.5/+2');
            });
        });
        
        describe('explainHandicap', () => {
            test('should explain home team handicaps', () => {
                expect(AsianHandicapCalculator.explainHandicap('-1', 'home'))
                    .toBe('Home team starts 1 goal(s) behind');
                
                expect(AsianHandicapCalculator.explainHandicap('+1.5', 'home'))
                    .toBe('Home team gets +1.5 goal advantage');
                
                expect(AsianHandicapCalculator.explainHandicap('0', 'home'))
                    .toBe('Level betting (no handicap)');
            });
            
            test('should explain away team handicaps', () => {
                expect(AsianHandicapCalculator.explainHandicap('-1', 'away'))
                    .toBe('Away team gets +1 goal advantage');
                
                expect(AsianHandicapCalculator.explainHandicap('+1.5', 'away'))
                    .toBe('Away team starts 1.5 goal(s) behind');
                
                expect(AsianHandicapCalculator.explainHandicap('0', 'away'))
                    .toBe('Level betting (no handicap)');
            });
        });
    });
    
    describe('Real World Scenarios', () => {
        
        test('Manchester City vs Brighton scenario', () => {
            // Man City (favorites) at home, handicap -1.5, lose 1-2
            // Betting on Man City at odds 1.85, stake 500
            const result = AsianHandicapCalculator.calculate(1, 2, '-1.5', 'home', 1.85, 500);
            
            expect(result.outcome).toBe('loss');
            expect(result.profit).toBe(-500);
        });
        
        test('Underdog away win scenario', () => {
            // Leicester away vs Man City, handicap +2.5, win 0-3
            // Betting on Leicester at odds 1.95, stake 200
            const result = AsianHandicapCalculator.calculate(0, 3, '+2.5', 'away', 1.95, 200);
            
            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(190); // 200 * 1.95 - 200
        });
        
                 test('Quarter handicap tight margin scenario', () => {
             // Arsenal vs Tottenham 2-1, Arsenal -0.5/-1, stake 1000, odds 1.92
             // Split: 500 on -0.5 (Home 1.5 vs Away 1 = Win) + 500 on -1 (Home 1 vs Away 1 = Push)
             const result = AsianHandicapCalculator.calculate(2, 1, '-0.5/-1', 'home', 1.92, 1000);
             
             expect(result.outcome).toBe('win');
             expect(result.profit).toBe(460); // Half win: (500 * 1.92) + 500 - 1000 = 460
         });
        
        test('Draw with level handicap', () => {
            // Chelsea vs Liverpool 1-1, level handicap (0), Chelsea bet
            const result = AsianHandicapCalculator.calculate(1, 1, '0', 'home', 2.05, 150);
            
            expect(result.outcome).toBe('push');
            expect(result.profit).toBe(0);
            expect(result.payout).toBe(150); // Stake returned
        });
    });
    
    describe('Precision and Rounding', () => {
        
        test('should properly round monetary values', () => {
            // Test case that could produce floating point precision issues
            const result = AsianHandicapCalculator.calculate(2, 1, '-0.5', 'home', 1.91, 333.33);
            
            expect(result.payout).toBe(636.66); // Should be properly rounded
            expect(result.profit).toBe(303.33);
        });
        
        test('should handle very small stakes', () => {
            const result = AsianHandicapCalculator.calculate(1, 0, '-0.5', 'home', 2.0, 0.01);
            
            expect(result.payout).toBe(0.02);
            expect(result.profit).toBe(0.01);
        });
        
        test('should handle very large stakes', () => {
            const result = AsianHandicapCalculator.calculate(3, 0, '-2.5', 'home', 1.5, 100000);
            
            expect(result.payout).toBe(150000);
            expect(result.profit).toBe(50000);
        });
    });
}); 