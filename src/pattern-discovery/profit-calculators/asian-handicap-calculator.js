/**
 * Asian Handicap Profit Calculator
 * 
 * Calculates profit using the existing AsianHandicapCalculator utility
 * for betting scenario analysis.
 */

// Import the existing Asian Handicap Calculator
// Note: In browser environment, this would be loaded via script tag
// For now, we'll reference the global AsianHandicapCalculator

class AsianHandicapProfitCalculator {
    
    /**
     * Calculate profit for a betting record using Asian Handicap rules
     * 
     * @param {Object} record - Match record with all data
     * @param {Object} config - Drilling configuration
     * @param {Object} strategy - Strategy being evaluated (contains betSide, stake)
     * @returns {Object} Result with { profit, outcome, details }
     */
    static calculate(record, config, strategy) {
        try {
            // Extract required fields using config paths
            const homeScore = this.getFieldValue(record, config.dataStructure.resultFields.homeScore);
            const awayScore = this.getFieldValue(record, config.dataStructure.resultFields.awayScore);
            const handicap = this.getFieldValue(record, config.dataStructure.resultFields.handicap);
            
            // Get odds based on bet side
            let odds;
            if (strategy.betSide === 'home') {
                odds = this.getFieldValue(record, 'preMatch.match.asianHandicapOdds.homeOdds');
            } else if (strategy.betSide === 'away') {
                odds = this.getFieldValue(record, 'preMatch.match.asianHandicapOdds.awayOdds');
            } else {
                // Dynamic bet side - evaluate the expression
                const betSide = this.evaluateBetSide(record, strategy.betSide);
                odds = betSide === 'home' ? 
                    this.getFieldValue(record, 'preMatch.match.asianHandicapOdds.homeOdds') :
                    this.getFieldValue(record, 'preMatch.match.asianHandicapOdds.awayOdds');
                strategy.betSide = betSide; // Update for calculation
            }
            
            // Validate all required fields are present
            if (!this.validateInputs(homeScore, awayScore, handicap, strategy.betSide, odds, strategy.stake)) {
                return {
                    profit: 0,
                    outcome: 'invalid',
                    details: 'Missing required fields for calculation'
                };
            }
            
            // Use the existing AsianHandicapCalculator utility
            // Note: This assumes AsianHandicapCalculator is available globally
            const result = window.AsianHandicapCalculator ? 
                window.AsianHandicapCalculator.calculate(homeScore, awayScore, handicap, strategy.betSide, odds, strategy.stake) :
                this.fallbackCalculation(homeScore, awayScore, handicap, strategy.betSide, odds, strategy.stake);
            
            return {
                profit: result.profit,
                outcome: result.outcome,
                details: {
                    homeScore,
                    awayScore,
                    handicap,
                    betSide: strategy.betSide,
                    odds,
                    stake: strategy.stake,
                    payout: result.payout,
                    calculation: result.details || 'Asian Handicap calculation'
                }
            };
            
        } catch (error) {
            console.warn('Error in Asian Handicap calculation:', error);
            return {
                profit: 0,
                outcome: 'error',
                details: `Calculation error: ${error.message}`
            };
        }
    }
    
    /**
     * Get field value from record using dot notation path
     */
    static getFieldValue(record, path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], record);
    }
    
    /**
     * Evaluate dynamic bet side expressions
     */
    static evaluateBetSide(record, expression) {
        try {
            const context = {
                match: record.preMatch?.match || {},
                fbref: record.preMatch?.fbref || {},
                timeSeries: record.timeSeries || {},
                preMatch: record.preMatch || {},
                postMatch: record.postMatch || {},
                Math: Math
            };
            
            const result = new Function(...Object.keys(context), `return ${expression}`)(...Object.values(context));
            return result;
        } catch (error) {
            console.warn('Error evaluating bet side expression:', expression, error);
            return 'home'; // fallback
        }
    }
    
    /**
     * Validate inputs for Asian Handicap calculation
     */
    static validateInputs(homeScore, awayScore, handicap, betSide, odds, stake) {
        return typeof homeScore === 'number' && 
               typeof awayScore === 'number' && 
               typeof handicap === 'string' && 
               ['home', 'away'].includes(betSide) && 
               typeof odds === 'number' && 
               typeof stake === 'number' &&
               odds > 0 && stake > 0;
    }
    
    /**
     * Fallback calculation if AsianHandicapCalculator is not available
     */
    static fallbackCalculation(homeScore, awayScore, handicap, betSide, odds, stake) {
        // Simple fallback - just check if bet wins based on final score
        const homeWins = homeScore > awayScore;
        const awayWins = awayScore > homeScore;
        const draw = homeScore === awayScore;
        
        let wins = false;
        if (betSide === 'home') {
            wins = homeWins || (draw && handicap === '0');
        } else {
            wins = awayWins || (draw && handicap === '0');
        }
        
        const payout = wins ? stake * odds : 0;
        const profit = payout - stake;
        
        return {
            outcome: wins ? 'win' : 'loss',
            payout,
            profit,
            details: 'Fallback calculation (simplified)'
        };
    }
    
    /**
     * Validate that a record has all required fields
     */
    static validateRecord(record, config) {
        const requiredPaths = [
            config.dataStructure.resultFields.homeScore,
            config.dataStructure.resultFields.awayScore,
            config.dataStructure.resultFields.handicap,
            'preMatch.match.asianHandicapOdds.homeOdds',
            'preMatch.match.asianHandicapOdds.awayOdds'
        ];
        
        return requiredPaths.every(path => {
            const value = this.getFieldValue(record, path);
            return value !== null && value !== undefined;
        });
    }
    
    /**
     * Get description of this calculator
     */
    static getDescription() {
        return 'Asian Handicap betting profit calculation using official handicap rules';
    }
    
    /**
     * Get required fields for this calculator
     */
    static getRequiredFields() {
        return [
            'preMatch.match.homeScore',
            'preMatch.match.awayScore', 
            'preMatch.match.asianHandicapOdds.homeHandicap',
            'preMatch.match.asianHandicapOdds.homeOdds',
            'preMatch.match.asianHandicapOdds.awayOdds'
        ];
    }
}