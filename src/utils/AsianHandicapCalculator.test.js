/**
 * Comprehensive Test Suite for AsianHandicapCalculator
 * 
 * Run with: node AsianHandicapCalculator.test.js
 */

const AsianHandicapCalculator = require('./AsianHandicapCalculator');

class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }
    
    test(name, fn) {
        try {
            fn();
            this.passed++;
            console.log(`✅ ${name}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${name}: ${error.message}`);
        }
    }
    
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toBeCloseTo: (expected, precision = 2) => {
                const diff = Math.abs(actual - expected);
                const tolerance = Math.pow(10, -precision);
                if (diff > tolerance) {
                    throw new Error(`Expected ${expected} (±${tolerance}), got ${actual}`);
                }
            }
        };
    }
    
    summary() {
        console.log(`\n📊 Test Summary: ${this.passed} passed, ${this.failed} failed`);
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        }
    }
}

const test = new TestRunner();

console.log('🧪 Testing AsianHandicapCalculator\n');

// ==================== SIMPLE HANDICAP TESTS ====================

test.test('Simple handicap: Home team wins with negative handicap', () => {
    // Man City vs Brighton: 4-0, City has -2 handicap, bet on City
    // Adjusted: 4-2 = 2 vs 0, City wins
    const result = AsianHandicapCalculator.calculate(4, 0, '-2', 'home', 1.8, 100);
    test.expect(result.outcome).toBe('win');
    test.expect(result.profit).toBe(80);
    test.expect(result.payout).toBe(180);
});

test.test('Simple handicap: Home team loses with negative handicap', () => {
    // Chelsea vs Liverpool: 1-3, Chelsea has -1 handicap, bet on Chelsea  
    // Adjusted: 1-1 = 0 vs 3, Chelsea loses
    const result = AsianHandicapCalculator.calculate(1, 3, '-1', 'home', 2.0, 100);
    test.expect(result.outcome).toBe('loss');
    test.expect(result.profit).toBe(-100);
    test.expect(result.payout).toBe(0);
});

test.test('Simple handicap: Home wins after overcoming negative handicap', () => {
    // Arsenal vs Spurs: 2-1, Arsenal has -1 handicap, bet on Arsenal
    // Adjusted: 2+(-1) = 1 vs 1, draw = push
    const result = AsianHandicapCalculator.calculate(2, 1, '-1', 'home', 1.9, 100);
    test.expect(result.outcome).toBe('push');
    test.expect(result.profit).toBe(0);
    test.expect(result.payout).toBe(100);
});

test.test('Simple handicap: Away team with positive handicap wins', () => {
    // Burnley vs Man City: 0-2, bet on Burnley with +2 handicap
    // Adjusted: 0+2 = 2 vs 2, draw = push
    const result = AsianHandicapCalculator.calculate(0, 2, '+2', 'away', 2.1, 100);
    test.expect(result.outcome).toBe('push');
    test.expect(result.profit).toBe(0);
    test.expect(result.payout).toBe(100);
});

// ==================== QUARTER HANDICAP TESTS ====================

test.test('Quarter handicap: Full win (both halves win)', () => {
    // Man City vs West Ham: 3-0, bet on City with -1/-1.5 
    // Half 1: 3-1 = 2 vs 0 (WIN), Half 2: 3-1.5 = 1.5 vs 0 (WIN)
    const result = AsianHandicapCalculator.calculate(3, 0, '-1/-1.5', 'home', 1.8, 100);
    test.expect(result.outcome).toBe('win');
    test.expect(result.profit).toBe(80);
    test.expect(result.payout).toBe(180);
    test.expect(result.isQuarterHandicap).toBe(true);
});

test.test('Quarter handicap: Half win (one wins, one pushes)', () => {
    // Southampton vs Man Utd: 0-1, bet on Man Utd (away)
    // Man Utd has -0.5/-1 handicap, so Southampton gets +0.5/+1
    // Half 1: 0+0.5 = 0.5 vs 1 (Man Utd wins = AWAY WIN)
    // Half 2: 0+1 = 1 vs 1 (Draw = PUSH)
    const awayHandicap = '-0.5/-1';
    const homeHandicap = AsianHandicapCalculator.getAwayHandicap(awayHandicap); // +0.5/+1
    const result = AsianHandicapCalculator.calculate(0, 1, homeHandicap, 'away', 2.17, 100);
    test.expect(result.outcome).toBe('win');
    test.expect(result.profit).toBeCloseTo(58.5, 1); // (50 * 2.17) + 50 - 100 = 58.5
    test.expect(result.payout).toBeCloseTo(158.5, 1);
});

test.test('Quarter handicap: Half loss (one loses, one pushes)', () => {
    // Liverpool vs Arsenal: 2-1, bet on Arsenal (away)
    // Arsenal has +0.5/+1 handicap, so Liverpool gets -0.5/-1 
    // Wait, this doesn't make sense. Let me fix this test case.
    // Let's say: Home team 2-1 Away team, bet on away with disadvantage
    // Away team has -0.5/-1, so home gets +0.5/+1
    // Half 1: 2+0.5 = 2.5 vs 1 (Home wins = AWAY LOSS)
    // Half 2: 2+1 = 3 vs 1 (Home wins = AWAY LOSS) 
    // This would be full loss, not half loss. Let me create a proper half loss scenario:
    // Home 1 - Away 2, bet on home team with +0.5/+1 handicap
    // Half 1: 1+0.5 = 1.5 vs 2 (Away wins = HOME LOSS)
    // Half 2: 1+1 = 2 vs 2 (Draw = PUSH)
    const result = AsianHandicapCalculator.calculate(1, 2, '+0.5/+1', 'home', 2.0, 100);
    test.expect(result.outcome).toBe('loss');
    test.expect(result.profit).toBe(-50); // 0 + 50 - 100 = -50
    test.expect(result.payout).toBe(50);
});

test.test('Quarter handicap: Full loss (both halves lose)', () => {
    // Man City vs Brighton: 4-0, bet on Brighton with +1/+1.5
    // Half 1: 4-1 = 3 vs 0 (Brighton loses)
    // Half 2: 4-1.5 = 2.5 vs 0 (Brighton loses)
    const result = AsianHandicapCalculator.calculate(4, 0, '+1/+1.5', 'away', 2.5, 100);
    test.expect(result.outcome).toBe('loss');
    test.expect(result.profit).toBe(-100);
    test.expect(result.payout).toBe(0);
});

// ==================== EDGE CASES ====================

test.test('Level handicap (0)', () => {
    // Standard 1X2 bet with 0 handicap
    const result = AsianHandicapCalculator.calculate(2, 1, '0', 'home', 1.5, 100);
    test.expect(result.outcome).toBe('win');
    test.expect(result.profit).toBe(50);
});

test.test('Large positive handicap', () => {
    const result = AsianHandicapCalculator.calculate(1, 3, '+3', 'home', 1.9, 100);
    test.expect(result.outcome).toBe('win'); // 1+3 = 4 vs 3
    test.expect(result.profit).toBe(90);
});

// ==================== AWAY HANDICAP CONVERSION TESTS ====================

test.test('Away handicap conversion: Simple', () => {
    const away = AsianHandicapCalculator.getAwayHandicap('-1');
    test.expect(away).toBe('+1');
});

test.test('Away handicap conversion: Quarter', () => {
    const away = AsianHandicapCalculator.getAwayHandicap('-0.5/-1');
    test.expect(away).toBe('+0.5/+1');
});

test.test('Away handicap conversion: Zero', () => {
    const away = AsianHandicapCalculator.getAwayHandicap('0');
    test.expect(away).toBe('0');
});

// ==================== VALIDATION TESTS ====================

test.test('Invalid input validation', () => {
    try {
        AsianHandicapCalculator.calculate('invalid', 1, '-1', 'home', 2.0, 100);
        throw new Error('Should have thrown validation error');
    } catch (error) {
        test.expect(error.message).toBe('Scores must be numbers');
    }
});

test.test('Invalid bet side validation', () => {
    try {
        AsianHandicapCalculator.calculate(1, 1, '-1', 'invalid', 2.0, 100);
        throw new Error('Should have thrown validation error');
    } catch (error) {
        test.expect(error.message).toBe('betSide must be "home" or "away"');
    }
});

// ==================== REAL WORLD SCENARIOS ====================

test.test('Real scenario: Manchester Derby with small handicap', () => {
    // Man City vs Man Utd: 3-1, City -0.5, betting on City
    const result = AsianHandicapCalculator.calculate(3, 1, '-0.5', 'home', 1.75, 200);
    test.expect(result.outcome).toBe('win'); // 3-0.5 = 2.5 vs 1
    test.expect(result.profit).toBe(150); // 200 * 1.75 - 200
});

test.test('Real scenario: Underdog cover', () => {
    // Leicester vs Liverpool: 1-2, Leicester +1.5, betting on Leicester  
    const result = AsianHandicapCalculator.calculate(1, 2, '+1.5', 'home', 2.2, 100);
    test.expect(result.outcome).toBe('win'); // 1+1.5 = 2.5 vs 2
    test.expect(result.profit).toBe(120);
});

console.log('\n=== VERIFICATION AGAINST PREVIOUS BUG ===');

test.test('Bug fix verification: Southampton vs Man Utd', () => {
    // This was the test case that revealed our bug
    // Southampton 0-1 Man Utd, Man Utd (away) has -0.5/-1 handicap
    // Convert to home handicap: +0.5/+1
    const awayHandicap = '-0.5/-1';
    const homeHandicap = AsianHandicapCalculator.getAwayHandicap(awayHandicap);
    const result = AsianHandicapCalculator.calculate(0, 1, homeHandicap, 'away', 2.17, 100);
    
    // Should be half win: one half wins, one half pushes
    test.expect(result.outcome).toBe('win');
    test.expect(result.profit).toBeCloseTo(58.5, 1); // NOT 117 like before
    test.expect(result.details.result1).toBe(1); // +0.5: away wins (0.5 vs 1)
    test.expect(result.details.result2).toBe(0); // +1: push (1 vs 1)
});

// Run all tests
test.summary();

// Export for use in other files
if (typeof module !== 'undefined') {
    module.exports = { AsianHandicapCalculator, TestRunner };
} 