# AsianHandicapCalculator Test Suite

## Overview
Comprehensive test suite for the `AsianHandicapCalculator` class covering all calculation scenarios, edge cases, and input validation for Asian Handicap betting calculations.

## Test Coverage
- **Statement Coverage**: 95.29%
- **Branch Coverage**: 94.44%
- **Function Coverage**: 100%
- **Line Coverage**: 96.38%

## Test Categories

### 1. Input Validation (4 tests)
- Non-numeric scores validation
- Invalid bet side validation  
- Invalid odds validation
- Invalid stake validation

### 2. Simple Handicap Calculations (12 tests)
- **Home Team Betting**: Win, loss, push scenarios with various handicaps
- **Away Team Betting**: Win/loss scenarios from away perspective
- **Edge Cases**: Large handicaps, decimal scores

### 3. Quarter Handicap Calculations (7 tests)
- Full win (both halves win)
- Half win (one wins, one pushes)
- Half loss (one loses, one pushes)  
- Full loss (both halves lose)
- Away team quarter handicaps
- Positive quarter handicaps
- Invalid format error handling

### 4. Helper Methods (7 tests)
- **getAwayHandicap**: Converting home handicaps to away equivalents
- **explainHandicap**: Human-readable handicap explanations

### 5. Real World Scenarios (4 tests)
- Manchester City vs Brighton (favorite loses)
- Leicester underdog win
- Quarter handicap tight margins
- Level handicap draws

### 6. Precision and Rounding (3 tests)
- Floating point precision handling
- Very small stakes
- Very large stakes

## Key Test Scenarios

### Quarter Handicap Examples
```javascript
// Full Win: Home 2-0, betting -0.5/-1 → Both halves win
// Half Win: Home 1-0, betting -0.5/-1 → One wins, one pushes  
// Half Loss: Home 1-2, betting +0.5/+1 → One loses, one pushes
// Full Loss: Both halves lose
```

### Real Betting Examples
- **Man City -1.5 vs Brighton**: Favorites can lose handicap bets
- **Leicester +2.5 away**: Underdogs can cover large spreads
- **Arsenal -0.5/-1 vs Spurs 2-1**: Tight margins in quarter handicaps

## Running Tests

```bash
# Run all tests
npm test src/utils/AsianHandicapCalculator.test.js

# Run with watch mode
npm run test:watch src/utils/AsianHandicapCalculator.test.js

# Generate coverage report
npm test -- --coverage
```

## Test Maintenance Notes

1. **Memory from Bug Fixes**: Previous calculation errors were in handicap application direction - always apply handicap to home team score first
2. **Quarter Handicap Logic**: Split stake in half, calculate each part separately, combine results
3. **Precision**: All monetary values rounded to 2 decimal places
4. **Real Data**: Tests use realistic odds (1.5-2.5 range) and stakes (£50-£1000)

## Future Test Additions

Consider adding tests for:
- Multiple handicap formats (Asian vs European notation)
- Currency formatting edge cases
- Performance benchmarks for large calculations
- Integration tests with actual match data 