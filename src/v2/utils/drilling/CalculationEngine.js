/**
 * CalculationEngine - Handles betting calculations and risk analysis
 * Isolates all calculation logic for better organization and reusability
 */

// Environment-specific imports
// Variables will be set inside the class constructor

class CalculationEngine {
    constructor() {
        // Set up utilities based on environment
        if (typeof module !== 'undefined' && module.exports) {
            // Node.js environment
            this.AsianHandicapCalculator = require('./AsianHandicapCalculator');
            this.UtilityHelper = require('./UtilityHelper');
        } else if (typeof window !== 'undefined') {
            // Browser environment
            this.AsianHandicapCalculator = window.AsianHandicapCalculator;
            this.UtilityHelper = window.UtilityHelper;
        }

        // Performance cache for expensive operations
        this.performanceCache = {
            // Cache for factor expression evaluations: "matchKey|expression" -> boolean
            factorEvaluations: new Map(),
            
            // Cache for Asian Handicap calculations: "homeScore|awayScore|handicap|betSide|odds|stake" -> result
            asianHandicapResults: new Map(),
            
            // Cache for filtered match lists: "factorCombinationHash" -> matchArray
            filteredMatches: new Map(),
            
            // Cache for complete betting results: "matchListHash|sideKey|sizeKey" -> results
            bettingResults: new Map(),
            
            // Performance stats
            stats: {
                factorEvalHits: 0,
                factorEvalMisses: 0,
                ahCalcHits: 0,
                ahCalcMisses: 0,
                matchFilterHits: 0,
                matchFilterMisses: 0,
                bettingResultHits: 0,
                bettingResultMisses: 0
            }
        };
    }

    /**
     * Clear all performance caches
     */
    clearCache() {
        this.performanceCache.factorEvaluations.clear();
        this.performanceCache.asianHandicapResults.clear();
        this.performanceCache.filteredMatches.clear();
        this.performanceCache.bettingResults.clear();
        console.log('🧹 Performance cache cleared');
    }

    /**
     * Get cache hit rates for performance monitoring
     * @returns {Object} Hit rate statistics
     */
    getCacheHitRates() {
        const stats = this.performanceCache.stats;
        const factorRate = stats.factorEvalHits / (stats.factorEvalHits + stats.factorEvalMisses) * 100;
        const ahRate = stats.ahCalcHits / (stats.ahCalcHits + stats.ahCalcMisses) * 100;
        const filterRate = stats.matchFilterHits / (stats.matchFilterHits + stats.matchFilterMisses) * 100;
        const resultRate = stats.bettingResultHits / (stats.bettingResultHits + stats.bettingResultMisses) * 100;
        
        return {
            factorEvaluation: isNaN(factorRate) ? '0' : factorRate.toFixed(1),
            asianHandicap: isNaN(ahRate) ? '0' : ahRate.toFixed(1),
            matchFilter: isNaN(filterRate) ? '0' : filterRate.toFixed(1),
            bettingResult: isNaN(resultRate) ? '0' : resultRate.toFixed(1)
        };
    }

    /**
     * Filter matches based on selected factors with caching
     * @param {Array} allMatches - All available matches
     * @param {Array} selectedFactors - Array of selected factor objects
     * @returns {Array} Filtered array of matches
     */
    getFilteredMatches(allMatches, selectedFactors) {
        if (!selectedFactors || selectedFactors.length === 0) {
            return allMatches;
        }

        // Create cache key from factor combination
        const factorHash = selectedFactors
            .map(f => `${f.category}:${f.key}`)
            .sort()
            .join('|');

        // Check cache first
        if (this.performanceCache.filteredMatches.has(factorHash)) {
            this.performanceCache.stats.matchFilterHits++;
            return this.performanceCache.filteredMatches.get(factorHash);
        }

        // Filter matches that satisfy ALL selected factors
        const filteredMatches = allMatches.filter(match => {
            return selectedFactors.every(factor => {
                try {
                    return this.UtilityHelper.evaluateFactorExpression(
                        match, 
                        factor.expression, 
                        this.performanceCache.factorEvaluations
                    );
                } catch (error) {
                    console.warn(`Error evaluating factor ${factor.key}:`, error);
                    return false;
                }
            });
        });

        // Cache the result
        this.performanceCache.filteredMatches.set(factorHash, filteredMatches);
        this.performanceCache.stats.matchFilterMisses++;

        return filteredMatches;
    }

    /**
     * Calculate betting results with performance caching
     * @param {Array} matches - Filtered matches to analyze
     * @param {Object} sideSelection - Side selection configuration
     * @param {Object} sizeSelection - Size selection configuration
     * @returns {Object} Complete betting analysis results
     */
    calculateBettingResults(matches, sideSelection, sizeSelection) {
        // Check cache first
        const configHash = this.UtilityHelper.getBettingConfigHash(matches, sideSelection, sizeSelection);
        if (this.performanceCache.bettingResults.has(configHash)) {
            this.performanceCache.stats.bettingResultHits++;
            return this.performanceCache.bettingResults.get(configHash);
        }

        const bettingRecords = [];
        let totalStake = 0;
        let totalPayout = 0;
        let wins = 0;
        let losses = 0;
        let pushes = 0;

        matches.forEach(match => {
            try {
                const record = this.calculateSingleBet(match, sideSelection, sizeSelection);
                if (record) {
                    bettingRecords.push(record);
                    totalStake += record.stake;
                    totalPayout += record.payout;
                    
                    if (record.outcome === 'win' || record.outcome === 'half-win') wins++;
                    else if (record.outcome === 'loss' || record.outcome === 'half-loss') losses++;
                    else if (record.outcome === 'push') pushes++;
                }
            } catch (error) {
                console.warn('Error calculating betting result:', error);
            }
        });

        const totalProfit = totalPayout - totalStake;
        const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
        const winRate = (wins + losses + pushes) > 0 ? (wins / (wins + losses + pushes)) * 100 : 0;

        const result = {
            bettingRecords,
            summary: {
                totalBets: bettingRecords.length,
                filteredMatches: matches.length,
                totalStake: this.UtilityHelper.roundNumber(totalStake),
                totalPayout: this.UtilityHelper.roundNumber(totalPayout),
                totalProfit: this.UtilityHelper.roundNumber(totalProfit),
                roi: this.UtilityHelper.roundNumber(roi),
                winRate: this.UtilityHelper.roundNumber(winRate),
                wins,
                losses,
                pushes
            }
        };

        // Cache the result
        this.performanceCache.bettingResults.set(configHash, result);
        this.performanceCache.stats.bettingResultMisses++;

        return result;
    }

    /**
     * Calculate a single bet result
     * @param {Object} match - Single match object
     * @param {Object} sideSelection - Side selection configuration
     * @param {Object} sizeSelection - Size selection configuration
     * @returns {Object|null} Betting record or null if invalid
     */
    calculateSingleBet(match, sideSelection, sizeSelection) {
        const matchData = match.preMatch?.match || {};
        const homeScore = matchData.homeScore || 0;
        const awayScore = matchData.awayScore || 0;
        const handicap = matchData.asianHandicapOdds?.homeHandicap;
        
        if (handicap == null) return null;
        
        // Determine betting side
        let betSide = sideSelection.betSide;
        // Always resolve betSide if not 'home' or 'away'
        if (typeof betSide === 'string' && betSide !== 'home' && betSide !== 'away') {
            const resolvedBetSide = this.UtilityHelper.evaluateFactorExpression(
                match, 
                betSide, 
                this.performanceCache.factorEvaluations
            );
            
            // Ensure we get a valid betSide
            if (resolvedBetSide === 'home' || resolvedBetSide === 'away') {
                betSide = resolvedBetSide;
            } else {
                // If resolution failed, try to handle common cases
                if (betSide.includes('higherOdds')) {
                    const homeOdds = matchData.asianHandicapOdds?.homeOdds || 2.0;
                    const awayOdds = matchData.asianHandicapOdds?.awayOdds || 2.0;
                    betSide = homeOdds > awayOdds ? 'home' : 'away';
                } else if (betSide.includes('lowerOdds')) {
                    const homeOdds = matchData.asianHandicapOdds?.homeOdds || 2.0;
                    const awayOdds = matchData.asianHandicapOdds?.awayOdds || 2.0;
                    betSide = homeOdds < awayOdds ? 'home' : 'away';
                } else {
                    // Default to home if we can't resolve
                    betSide = 'home';
                }
            }
        }
        
        // Determine stake size
        let stake = 200; // Default fallback
        if (sizeSelection.expression) {
            const evaluatedStake = this.UtilityHelper.evaluateFactorExpression(
                match, 
                sizeSelection.expression, 
                this.performanceCache.factorEvaluations
            );
            
            // Use evaluated stake if valid
            if (evaluatedStake && evaluatedStake > 0) {
                stake = evaluatedStake;
            }
            
        }
        
        // Skip invalid data early
        if (!stake || stake <= 0) return null;
        
        let result;
        let odds;
        
        // Handle HAD betting vs Asian Handicap betting
        if (betSide === 'home_had' || betSide === 'away_had') {
            // HAD (Head-to-Head) betting using actual bookmaker HAD odds
            const homeWinOdds = matchData.homeWinOdds;
            const awayWinOdds = matchData.awayWinOdds;
            
            // Use actual HAD odds from bookmaker data
            odds = betSide === 'home_had' ? homeWinOdds : awayWinOdds;
            
            // Skip invalid odds or missing HAD data
            if (!odds || odds <= 1) return null;
            
            // Calculate HAD result
            result = this.AsianHandicapCalculator.calculate(homeScore, awayScore, handicap, betSide, odds, stake);
        } else {
            // Asian Handicap betting (original logic)
            const homeOdds = matchData.asianHandicapOdds?.homeOdds || 2.0;
            const awayOdds = matchData.asianHandicapOdds?.awayOdds || 2.0;
            odds = betSide === 'home' ? homeOdds : awayOdds;
            
            // Skip invalid odds
            if (!odds || odds <= 1) return null;
            
            // Calculate AH result
            result = this.AsianHandicapCalculator.calculate(homeScore, awayScore, handicap, betSide, odds, stake);
        }

        // Create betting record
        return {
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
            week: match.preMatch?.fbref?.week || 0,
            season: match.season || 'unknown',
            match
        };
    }

    /**
     * Calculate comprehensive risk metrics
     * @param {Array} bettingRecords - Array of betting record objects
     * @returns {Object} Risk analysis metrics
     */
    calculateRiskMetrics(bettingRecords) {
        if (!bettingRecords || bettingRecords.length === 0) {
            return this.getEmptyRiskMetrics();
        }

        // Sort records by date
        const sortedRecords = [...bettingRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate initial capital estimation
        const { initialCapital } = this.estimateInitialCapital(bettingRecords);
        
        // Calculate cumulative profits and metrics
        const metrics = this.calculateDrawdownMetrics(sortedRecords, initialCapital);
        const profitFactorMetrics = this.calculateProfitFactor(sortedRecords);
        const volatilityMetrics = this.calculateVolatilityMetrics(sortedRecords, initialCapital);
        
        return {
            ...metrics,
            ...profitFactorMetrics,
            ...volatilityMetrics
        };
    }

    /**
     * Get empty risk metrics object
     * @returns {Object} Empty risk metrics
     */
    getEmptyRiskMetrics() {
        return {
            maxDrawdown: 0,
            maxDrawdownPercent: 0,
            recoveryFactor: 0,
            profitFactor: 0,
            sharpeRatio: 0,
            maxConsecutiveLosses: 0,
            volatility: 0,
            timeToRecovery: 0
        };
    }

    /**
     * Estimate initial capital for risk calculations
     * @param {Array} bettingRecords - Array of betting records
     * @returns {Object} Capital estimation data
     */
    estimateInitialCapital(bettingRecords) {
        const avgBetSize = bettingRecords.reduce((sum, r) => sum + r.stake, 0) / bettingRecords.length;
        const totalStaked = bettingRecords.reduce((sum, r) => sum + r.stake, 0);
        
        // Use either 50x average bet OR 20% of total staked (whichever is larger)
        // This assumes you never risk more than 2-3% per bet
        const conservativeCapital = avgBetSize * 50;
        const stakingBasedCapital = totalStaked * 0.2;
        const initialCapital = Math.max(conservativeCapital, stakingBasedCapital);
        
        return { initialCapital, avgBetSize, totalStaked };
    }

    /**
     * Calculate drawdown and recovery metrics
     * @param {Array} sortedRecords - Records sorted by date
     * @param {number} initialCapital - Estimated initial capital
     * @returns {Object} Drawdown metrics
     */
    calculateDrawdownMetrics(sortedRecords, initialCapital) {
        let cumulativeProfit = 0;
        let peak = 0;
        let maxDrawdown = 0;
        let maxDrawdownPercent = 0;
        let drawdownStartIndex = -1;
        let timeToRecovery = 0;
        let currentConsecutiveLosses = 0;
        let maxConsecutiveLosses = 0;
        
        sortedRecords.forEach((record, index) => {
            cumulativeProfit += record.profit;
            
            // Track peak (never let peak go below 0 at start)
            peak = Math.max(peak, cumulativeProfit, 0);
            
            // Track drawdown (difference from peak to current)
            const currentDrawdown = peak - cumulativeProfit;
            
            // Only track positive drawdowns (actual losses from peak)
            if (currentDrawdown > 0 && currentDrawdown > maxDrawdown) {
                maxDrawdown = currentDrawdown;
                if (drawdownStartIndex === -1) {
                    drawdownStartIndex = index;
                }
            } else if (currentDrawdown <= 0 && drawdownStartIndex !== -1) {
                // We've recovered - calculate recovery time
                timeToRecovery = Math.max(timeToRecovery, index - drawdownStartIndex);
                drawdownStartIndex = -1;
            }
            
            // Calculate percentage drawdown (relative to initial capital)
            if (initialCapital > 0) {
                maxDrawdownPercent = Math.max(maxDrawdownPercent, (currentDrawdown / initialCapital) * 100);
            }
            
            // Track consecutive losses
            if (record.profit < 0) {
                currentConsecutiveLosses++;
                maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
            } else {
                currentConsecutiveLosses = 0;
            }
        });
        
        // If still in drawdown at end, calculate time to recovery as remaining period
        if (drawdownStartIndex !== -1) {
            timeToRecovery = Math.max(timeToRecovery, sortedRecords.length - drawdownStartIndex);
        }
        
        // Calculate recovery factor
        const totalProfit = cumulativeProfit;
        const recoveryFactor = maxDrawdown > 0 ? totalProfit / maxDrawdown : totalProfit > 0 ? 999 : 0;
        
        return {
            maxDrawdown: this.UtilityHelper.roundNumber(maxDrawdown),
            maxDrawdownPercent: this.UtilityHelper.roundNumber(maxDrawdownPercent),
            recoveryFactor: this.UtilityHelper.roundNumber(recoveryFactor),
            maxConsecutiveLosses,
            timeToRecovery
        };
    }

    /**
     * Calculate profit factor metrics
     * @param {Array} sortedRecords - Records sorted by date
     * @returns {Object} Profit factor metrics
     */
    calculateProfitFactor(sortedRecords) {
        const grossProfits = sortedRecords.filter(r => r.profit > 0).reduce((sum, r) => sum + r.profit, 0);
        const grossLosses = Math.abs(sortedRecords.filter(r => r.profit < 0).reduce((sum, r) => sum + r.profit, 0));
        const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 999 : 0;
        
        return {
            profitFactor: this.UtilityHelper.roundNumber(profitFactor)
        };
    }

    /**
     * Calculate volatility and Sharpe ratio
     * @param {Array} sortedRecords - Records sorted by date
     * @param {number} initialCapital - Estimated initial capital
     * @returns {Object} Volatility metrics
     */
    calculateVolatilityMetrics(sortedRecords, initialCapital) {
        let cumulativeProfit = 0;
        const dailyReturns = [];
        
        sortedRecords.forEach(record => {
            cumulativeProfit += record.profit;
            
            // Calculate return percentage relative to running bankroll, not individual bet stake
            // This gives portfolio-level volatility, not individual bet volatility
            const runningBankroll = Math.max(initialCapital + cumulativeProfit, record.stake); // Prevent division by tiny numbers
            if (runningBankroll > 0) {
                dailyReturns.push((record.profit / runningBankroll) * 100);
            }
        });
        
        // Calculate volatility (standard deviation of returns)
        const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
        const volatility = Math.sqrt(variance);
        
        // Calculate Sharpe ratio (assuming 0% risk-free rate)
        const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;
        
        return {
            volatility: this.UtilityHelper.roundNumber(volatility),
            sharpeRatio: this.UtilityHelper.roundNumber(sharpeRatio)
        };
    }

    /**
     * Get risk metric display properties (color and tooltip)
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @returns {Object} Display properties with class and tooltip
     */
    getRiskMetricDisplay(metric, value) {
        const metrics = {
            maxDrawdown: {
                good: value < 10000,
                fair: value < 25000,
                tooltip: "Maximum loss from peak equity. Lower is better. <$10k=Good, <$25k=Fair, >$25k=Poor"
            },
            maxDrawdownPercent: {
                good: value < 15,
                fair: value < 30,
                tooltip: "Maximum drawdown as % of starting capital. Lower is better. <15%=Good, <30%=Fair, >30%=Poor"
            },
            recoveryFactor: {
                good: value > 3,
                fair: value > 1.5,
                tooltip: "Total profit ÷ Max drawdown. Higher is better. >3=Good, >1.5=Fair, <1.5=Poor"
            },
            profitFactor: {
                good: value > 2,
                fair: value > 1.3,
                tooltip: "Gross profits ÷ Gross losses. Higher is better. >2=Good, >1.3=Fair, <1.3=Poor"
            },
            sharpeRatio: {
                good: value > 1,
                fair: value > 0.5,
                tooltip: "Risk-adjusted return ratio. Higher is better. >1=Good, >0.5=Fair, <0.5=Poor"
            },
            maxConsecutiveLosses: {
                good: value < 5,
                fair: value < 10,
                tooltip: "Longest streak of consecutive losing bets. Lower is better. <5=Good, <10=Fair, >10=Poor"
            },
            volatility: {
                good: value < 5,
                fair: value < 15,
                tooltip: "Standard deviation of returns. Lower is better. <5%=Good, <15%=Fair, >15%=Poor"
            }
        };
        
        const config = metrics[metric];
        if (!config) return { class: 'profit-neutral', tooltip: 'No description available' };
        
        let colorClass = 'profit-negative'; // Poor (red)
        if (config.good) colorClass = 'profit-positive'; // Good (green)
        else if (config.fair) colorClass = 'profit-neutral'; // Fair (gray)
        
        return {
            class: colorClass,
            tooltip: config.tooltip
        };
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculationEngine;
}
if (typeof window !== 'undefined') {
    window.CalculationEngine = CalculationEngine;
}