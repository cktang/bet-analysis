/**
 * Asian Handicap Validation Utilities
 * 
 * Common methods to ensure all strategies use proper Asian Handicap calculations
 * and avoid 1X2 (win/lose/draw) confusion.
 * 
 * CRITICAL: Asian Handicap betting has only TWO outcomes (home covers or away covers)
 * Never use match results (win/lose/draw) for Asian Handicap calculations.
 */

/**
 * Validates that a factor expression uses only Asian Handicap compatible data
 * @param {string} factorExpression - The factor expression to validate
 * @returns {object} - Validation result with isValid boolean and issues array
 */
function validateAsianHandicapFactor(factorExpression) {
    const result = {
        isValid: true,
        issues: [],
        warnings: []
    };
    
    // Prohibited 1X2 patterns that should not be used for AH betting
    const prohibited1X2Patterns = [
        'homeWinOdds',
        'awayWinOdds', 
        'drawOdds',
        'homeImpliedProb',
        'awayImpliedProb',
        'drawImpliedProb'
    ];
    
    // Check for prohibited patterns
    prohibited1X2Patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(factorExpression)) {
            result.isValid = false;
            result.issues.push(`Uses 1X2 factor '${pattern}' - should use Asian Handicap equivalent`);
        }
    });
    
    return result;
}

module.exports = {
    validateAsianHandicapFactor
};
