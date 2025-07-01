/**
 * Betting Analysis Utilities
 * Common methods for betting calculations and data processing
 */

const AsianHandicapCalculator = require('./AsianHandicapCalculator');

class BettingAnalysisUtils {
    
    /**
     * Load and parse enhanced data from all seasons
     * @param {Array} dataFiles - Array of JSON data objects
     * @returns {Array} Array of all matches with metadata
     */
    static parseEnhancedData(dataFiles) {
        const allMatches = [];
        
        dataFiles.forEach(data => {
            if (data.matches) {
                Object.keys(data.matches).forEach(matchKey => {
                    const match = data.matches[matchKey];
                    // Add match key and season info
                    match.matchKey = matchKey;
                    match.season = data.metadata?.season || 'unknown';
                    allMatches.push(match);
                });
            }
        });
        
        return allMatches;
    }
    
    /**
     * Evaluate a factor expression against a match
     * @param {Object} match - Match data
     * @param {string} expression - JavaScript expression to evaluate
     * @returns {boolean|number} Result of the expression
     */
    static evaluateFactorExpression(match, expression) {
        try {
            // Create evaluation context
            const context = {
                match: match.preMatch?.match || {},
                fbref: match.preMatch?.fbref || {},
                timeSeries: match.preMatch?.timeSeries || {},
                preMatch: match.preMatch || {},
                postMatch: match.postMatch || {},
                Math: Math
            };
            
            // Use Function constructor to evaluate expression safely
            const func = new Function(...Object.keys(context), `return ${expression}`);
            return func(...Object.values(context));
        } catch (error) {
            console.warn(`Error evaluating expression: ${expression}`, error);
            return false;
        }
    }
    
    /**
     * Filter matches by selected factors
     * @param {Array} matches - All matches
     * @param {Array} selectedFactors - Array of selected factor objects
     * @returns {Array} Filtered matches
     */
    static filterMatchesByFactors(matches, selectedFactors) {
        return matches.filter(match => {
            return selectedFactors.every(factor => {
                return this.evaluateFactorExpression(match, factor.expression);
            });
        });
    }
    
    /**
     * Calculate betting results for filtered matches
     * @param {Array} matches - Filtered matches
     * @param {Object} sideSelection - Selected betting side factor
     * @param {Object} sizeSelection - Selected staking size factor
     * @returns {Object} Betting analysis results
     */
    static calculateBettingResults(matches, sideSelection, sizeSelection) {
        const bettingRecords = [];
        let totalStake = 0;
        let totalPayout = 0;
        let wins = 0;
        let losses = 0;
        let pushes = 0;
        
        matches.forEach(match => {
            try {
                const matchData = match.preMatch?.match || {};
                const homeScore = matchData.homeScore || 0;
                const awayScore = matchData.awayScore || 0;
                const handicap = matchData.asianHandicapOdds?.homeHandicap;
                
                if (!handicap) return;
                
                // Determine betting side
                let betSide = sideSelection.betSide;
                if (typeof betSide === 'string' && betSide.includes('match.')) {
                    // Dynamic side selection
                    betSide = this.evaluateFactorExpression(match, betSide);
                }
                
                // Determine stake size
                let stake = 200; // default
                if (sizeSelection.expression && sizeSelection.expression !== "200") {
                    stake = this.evaluateFactorExpression(match, sizeSelection.expression);
                }
                
                // Get odds for betting side
                const homeOdds = matchData.asianHandicapOdds?.homeOdds || 2.0;
                const awayOdds = matchData.asianHandicapOdds?.awayOdds || 2.0;
                const odds = betSide === 'home' ? homeOdds : awayOdds;
                
                // Calculate result using AsianHandicapCalculator
                const result = AsianHandicapCalculator.calculate(
                    homeScore, 
                    awayScore, 
                    handicap, 
                    betSide, 
                    odds, 
                    stake
                );
                
                // Create betting record
                const record = {
                    matchKey: match.matchKey,
                    date: matchData.date,
                    homeTeam: matchData.homeTeam,
                    awayTeam: matchData.awayTeam,
                    score: `${homeScore}-${awayScore}`,
                    handicap: handicap,
                    betSide: betSide,
                    odds: odds,
                    stake: stake,
                    outcome: result.outcome,
                    payout: result.payout,
                    profit: result.profit,
                    week: match.preMatch?.fbref?.week || 0
                };
                
                bettingRecords.push(record);
                
                // Update totals
                totalStake += stake;
                totalPayout += result.payout;
                
                if (result.outcome === 'win') wins++;
                else if (result.outcome === 'loss') losses++;
                else if (result.outcome === 'push') pushes++;
                
            } catch (error) {
                console.warn('Error calculating betting result for match:', match.matchKey, error);
            }
        });
        
        const totalProfit = totalPayout - totalStake;
        const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
        const winRate = (wins + losses + pushes) > 0 ? (wins / (wins + losses + pushes)) * 100 : 0;
        
        return {
            bettingRecords,
            summary: {
                totalBets: bettingRecords.length,
                totalStake: Math.round(totalStake * 100) / 100,
                totalPayout: Math.round(totalPayout * 100) / 100,
                totalProfit: Math.round(totalProfit * 100) / 100,
                roi: Math.round(roi * 100) / 100,
                winRate: Math.round(winRate * 100) / 100,
                wins,
                losses,
                pushes
            }
        };
    }
    
    /**
     * Format currency values
     * @param {number} value - Numeric value
     * @returns {string} Formatted currency string
     */
    static formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
    
    /**
     * Format percentage values
     * @param {number} value - Numeric percentage value
     * @returns {string} Formatted percentage string
     */
    static formatPercent(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    
    /**
     * Get color class for profit/loss display
     * @param {number} value - Profit/loss value
     * @returns {string} CSS class name
     */
    static getProfitColorClass(value) {
        if (value > 0) return 'profit-positive';
        if (value < 0) return 'profit-negative';
        return 'profit-neutral';
    }
}

module.exports = BettingAnalysisUtils; 