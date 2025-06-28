/**
 * Asian Handicap Calculator Utility
 * 
 * SINGLE SOURCE OF TRUTH for all Asian Handicap calculations.
 * Use this class everywhere in the project to avoid calculation errors.
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

class AsianHandicapCalculator {
    
    /**
     * Calculate Asian Handicap betting result
     * 
     * @param {number} homeScore - Final home team score
     * @param {number} awayScore - Final away team score  
     * @param {string} handicap - Handicap string (e.g., "-0.5", "+1/+1.5", "0")
     * @param {string} betSide - Which team we bet on ("home" or "away")
     * @param {number} odds - Betting odds for our bet
     * @param {number} stake - Amount staked
     * @returns {Object} Result object with outcome, payout, profit, and details
     */
    static calculate(homeScore, awayScore, handicap, betSide, odds, stake) {
        // Input validation
        if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
            throw new Error('Scores must be numbers');
        }
        if (!['home', 'away'].includes(betSide)) {
            throw new Error('betSide must be "home" or "away"');
        }
        if (typeof odds !== 'number' || odds <= 0) {
            throw new Error('Odds must be a positive number');
        }
        if (typeof stake !== 'number' || stake <= 0) {
            throw new Error('Stake must be a positive number');
        }
        
        // Handle quarter handicaps (split handicaps)
        if (handicap.includes('/')) {
            return this._calculateQuarterHandicap(homeScore, awayScore, handicap, betSide, odds, stake);
        } else {
            return this._calculateSimpleHandicap(homeScore, awayScore, handicap, betSide, odds, stake);
        }
    }
    
    /**
     * Calculate quarter/split handicap (e.g., "-0.5/-1", "+1/+1.5")
     * Splits stake in half and calculates each part separately
     */
    static _calculateQuarterHandicap(homeScore, awayScore, handicap, betSide, odds, stake) {
        const parts = handicap.split('/');
        if (parts.length !== 2) {
            throw new Error(`Invalid quarter handicap format: ${handicap}`);
        }
        
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        if (isNaN(h1) || isNaN(h2)) {
            throw new Error(`Invalid handicap numbers: ${handicap}`);
        }
        
        // Split stake in half
        const halfStake = stake / 2;
        
        // Calculate each half separately
        const result1 = this._calculateSimpleHandicapResult(homeScore, awayScore, h1, betSide);
        const result2 = this._calculateSimpleHandicapResult(homeScore, awayScore, h2, betSide);
        
        // Calculate payout for each half
        let totalPayout = 0;
        
        // First half
        if (result1 === 1) {
            totalPayout += halfStake * odds; // Win
        } else if (result1 === 0) {
            totalPayout += halfStake; // Push (stake returned)
        }
        // Loss = 0 payout
        
        // Second half  
        if (result2 === 1) {
            totalPayout += halfStake * odds; // Win
        } else if (result2 === 0) {
            totalPayout += halfStake; // Push (stake returned)
        }
        // Loss = 0 payout
        
        const totalProfit = totalPayout - stake;
        
        // Determine overall outcome
        let outcome;
        if (totalProfit > 0) {
            outcome = 'win';
        } else if (totalProfit < 0) {
            outcome = 'loss';
        } else {
            outcome = 'push';
        }
        
        return {
            outcome: outcome,
            payout: Math.round(totalPayout * 100) / 100,
            profit: Math.round(totalProfit * 100) / 100,
            isQuarterHandicap: true,
            details: {
                handicap1: h1,
                result1: result1,
                handicap2: h2,
                result2: result2,
                halfStake: halfStake
            }
        };
    }
    
    /**
     * Calculate simple handicap (e.g., "-0.5", "+1", "0")
     */
    static _calculateSimpleHandicap(homeScore, awayScore, handicap, betSide, odds, stake) {
        const h = parseFloat(handicap);
        
        if (isNaN(h)) {
            throw new Error(`Invalid handicap: ${handicap}`);
        }
        
        const result = this._calculateSimpleHandicapResult(homeScore, awayScore, h, betSide);
        
        let payout = 0;
        if (result === 1) {
            payout = stake * odds; // Win
        } else if (result === 0) {
            payout = stake; // Push (stake returned)
        }
        // Loss = 0 payout
        
        const profit = payout - stake;
        
        let outcome;
        if (profit > 0) {
            outcome = 'win';
        } else if (profit < 0) {
            outcome = 'loss';
        } else {
            outcome = 'push';
        }
        
        return {
            outcome: outcome,
            payout: Math.round(payout * 100) / 100,
            profit: Math.round(profit * 100) / 100,
            isQuarterHandicap: false,
            details: {
                handicap: h,
                result: result
            }
        };
    }
    
    /**
     * Calculate the result of a simple handicap
     * 
     * @param {number} homeScore 
     * @param {number} awayScore 
     * @param {number} handicap - Numeric handicap value applied to HOME team
     * @param {string} betSide - "home" or "away"
     * @returns {number} 1 = win, 0 = push/draw, -1 = loss
     */
    static _calculateSimpleHandicapResult(homeScore, awayScore, handicap, betSide) {
        // STANDARD METHOD: Apply handicap to HOME team score
        // Positive handicap = home team gets advantage  
        // Negative handicap = home team at disadvantage
        const adjustedHomeScore = homeScore + handicap;
        const adjustedAwayScore = awayScore;
        
        // Compare adjusted scores to determine winner
        if (adjustedHomeScore > adjustedAwayScore) {
            // Home team wins after handicap adjustment
            return betSide === 'home' ? 1 : -1;
        } else if (adjustedHomeScore < adjustedAwayScore) {
            // Away team wins after handicap adjustment  
            return betSide === 'away' ? 1 : -1;
        } else {
            // Draw after handicap adjustment = push
            return 0;
        }
    }
    
    /**
     * Convert home handicap to away handicap
     * 
     * @param {string} homeHandicap - Home team handicap (e.g., "-1", "+0.5/+1")
     * @returns {string} - Equivalent away team handicap
     */
    static getAwayHandicap(homeHandicap) {
        if (homeHandicap.includes('/')) {
            // Quarter handicap
            const parts = homeHandicap.split('/');
            const reversedParts = parts.map(part => {
                const num = parseFloat(part);
                if (num === 0) return '0';
                return num > 0 ? `-${num}` : `+${Math.abs(num)}`;
            });
            return reversedParts.join('/');
        } else {
            // Simple handicap
            const num = parseFloat(homeHandicap);
            if (num === 0) return '0';
            return num > 0 ? `-${num}` : `+${Math.abs(num)}`;
        }
    }
    
    /**
     * Get human-readable explanation of handicap
     */
    static explainHandicap(handicap, betSide) {
        const h = parseFloat(handicap.split('/')[0]);
        
        if (betSide === 'home') {
            if (h > 0) {
                return `Home team gets +${Math.abs(h)} goal advantage`;
            } else if (h < 0) {
                return `Home team starts ${Math.abs(h)} goal(s) behind`;
            } else {
                return `Level betting (no handicap)`;
            }
        } else {
            if (h < 0) {
                return `Away team gets +${Math.abs(h)} goal advantage`;
            } else if (h > 0) {
                return `Away team starts ${h} goal(s) behind`;
            } else {
                return `Level betting (no handicap)`;
            }
        }
    }
}

module.exports = AsianHandicapCalculator; 