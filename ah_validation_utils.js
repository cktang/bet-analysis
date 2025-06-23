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
        'drawImpliedProb',
        'homeScore',
        'awayScore',
        'homeGoals',
        'awayGoals',
        'result.*home',
        'result.*away',
        'result.*draw',
        'winRate(?!.*AH)',  // Allow AH win rates but not regular win rates
        'win.*streak(?!.*AH)', // Allow AH streaks but not regular streaks
        'lose.*streak',
        'draw.*streak'
    ];
    
    // Check for prohibited patterns
    prohibited1X2Patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(factorExpression)) {
            result.isValid = false;
            result.issues.push(`Uses 1X2 factor '${pattern}' - should use Asian Handicap equivalent`);
        }
    });
    
    // Recommended Asian Handicap patterns
    const recommendedAHPatterns = [
        'asianHandicapOdds',
        'asianHandicapResults',
        'asianHandicapWinRate',
        'ahHomeOdds',
        'ahAwayOdds',
        'handicapLine',
        'leaguePosition',
        'goalDifference',
        'currentStreak',
        'attendance',
        'week'
    ];
    
    // Check if using recommended patterns
    const usesRecommendedPattern = recommendedAHPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(factorExpression);
    });
    
    if (!usesRecommendedPattern && result.isValid) {
        result.warnings.push('Factor does not use clearly Asian Handicap compatible data - verify it is appropriate for AH betting');
    }
    
    return result;
}

/**
 * Calculates Asian Handicap result for a match
 * @param {number} homeScore - Home team final score
 * @param {number} awayScore - Away team final score  
 * @param {string} handicapLine - Handicap line (e.g., "-1", "+0.5", "0/-0.5")
 * @returns {string} - 'home', 'away', or 'draw' (push)
 */
function calculateAsianHandicapResult(homeScore, awayScore, handicapLine) {
    if (!handicapLine || homeScore === undefined || awayScore === undefined) {
        return 'draw';
    }
    
    // Parse handicap line
    let numericHandicap = 0;
    let isSplitHandicap = false;
    let handicap1 = 0;
    let handicap2 = 0;
    
    if (typeof handicapLine === 'string') {
        if (handicapLine.includes('/')) {
            // Split handicap like "0/-0.5" or "+1/+1.5"
            isSplitHandicap = true;
            const parts = handicapLine.split('/');
            handicap1 = parseFloat(parts[0].replace('+', ''));
            handicap2 = parseFloat(parts[1].replace('+', ''));
        } else {
            numericHandicap = parseFloat(handicapLine.replace('+', ''));
        }
    }
    
    // Calculate goal difference with handicap applied
    const goalDifference = homeScore - awayScore;
    
    if (isSplitHandicap) {
        // For split handicaps, check both lines
        const result1 = goalDifference + handicap1;
        const result2 = goalDifference + handicap2;
        
        // If both results are same direction, clear result
        if (result1 > 0 && result2 > 0) return 'home';
        if (result1 < 0 && result2 < 0) return 'away';
        
        // If results differ, it's a push (draw)
        return 'draw';
    } else {
        // Single handicap line
        const result = goalDifference + numericHandicap;
        
        if (result > 0) return 'home';
        if (result < 0) return 'away';
        return 'draw'; // Exactly 0 = push
    }
}

/**
 * Validates a complete strategy for Asian Handicap compliance
 * @param {object} strategy - Strategy object with factors array
 * @returns {object} - Validation result
 */
function validateStrategyForAsianHandicap(strategy) {
    const result = {
        isValid: true,
        issues: [],
        warnings: [],
        strategyName: strategy.name || 'Unknown'
    };
    
    if (!strategy.factors || !Array.isArray(strategy.factors)) {
        result.isValid = false;
        result.issues.push('Strategy has no factors array');
        return result;
    }
    
    // Validate each factor
    strategy.factors.forEach((factor, index) => {
        const factorValidation = validateAsianHandicapFactor(factor);
        
        if (!factorValidation.isValid) {
            result.isValid = false;
            factorValidation.issues.forEach(issue => {
                result.issues.push(`Factor ${index + 1}: ${issue}`);
            });
        }
        
        factorValidation.warnings.forEach(warning => {
            result.warnings.push(`Factor ${index + 1}: ${warning}`);
        });
    });
    
    return result;
}

/**
 * Suggests Asian Handicap alternatives for common 1X2 factors
 * @param {string} factor1X2 - The 1X2 factor to replace
 * @returns {string[]} - Array of suggested AH alternatives
 */
function suggestAsianHandicapAlternatives(factor1X2) {
    const suggestions = {
        'homeWinOdds': ['match.asianHandicapOdds.homeOdds', 'timeSeries.home.cumulative.markets.asianHandicapWinRate'],
        'awayWinOdds': ['match.asianHandicapOdds.awayOdds', 'timeSeries.away.cumulative.markets.asianHandicapWinRate'],
        'drawOdds': ['match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds', 'Math.abs(match.asianHandicapOdds.homeHandicap)'],
        'homeImpliedProb': ['1 / match.asianHandicapOdds.homeOdds', 'timeSeries.home.cumulative.markets.asianHandicapWinRate'],
        'awayImpliedProb': ['1 / match.asianHandicapOdds.awayOdds', 'timeSeries.away.cumulative.markets.asianHandicapWinRate'],
        'drawImpliedProb': ['Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap))', 'match.asianHandicapOdds.homeOdds / match.asianHandicapOdds.awayOdds'],
        'winRate': ['timeSeries.home.cumulative.markets.asianHandicapWinRate', 'timeSeries.away.cumulative.markets.asianHandicapWinRate'],
        'homeScore': ['timeSeries.home.cumulative.overall.goalsFor', 'timeSeries.home.leaguePosition'],
        'awayScore': ['timeSeries.away.cumulative.overall.goalsFor', 'timeSeries.away.leaguePosition']
    };
    
    for (const [pattern, alternatives] of Object.entries(suggestions)) {
        if (factor1X2.includes(pattern)) {
            return alternatives;
        }
    }
    
    return ['Use Asian Handicap specific data instead of 1X2 match results'];
}

module.exports = {
    validateAsianHandicapFactor,
    calculateAsianHandicapResult,
    validateStrategyForAsianHandicap,
    suggestAsianHandicapAlternatives
}; 