// Market efficiency factors using only pre-match data
function getMarketEfficiencyFactors(match) {
    const factors = {};
    
    // Use preMatch data only
    const preMatch = match.preMatch;
    if (!preMatch?.enhanced && !preMatch?.marketEfficiency) return factors;
    
    // Market efficiency metrics from pre-match enhanced data
    if (preMatch.enhanced) {
        factors.marketEfficiency = preMatch.enhanced.marketEfficiency;
        factors.hadCut = preMatch.enhanced.hadCut;
        factors.ouCut = preMatch.enhanced.ouCut;
        factors.homeValueBet = preMatch.enhanced.homeValueBet;
        
        // Implied probabilities
        factors.homeImpliedProb = preMatch.enhanced.homeImpliedProb;
        factors.drawImpliedProb = preMatch.enhanced.drawImpliedProb;
        factors.awayImpliedProb = preMatch.enhanced.awayImpliedProb;
        factors.over2_5ImpliedProb = preMatch.enhanced.over2_5ImpliedProb;
        factors.under2_5ImpliedProb = preMatch.enhanced.under2_5ImpliedProb;
    }
    
    // Market efficiency from dedicated object
    if (preMatch.marketEfficiency) {
        factors.totalImpliedProb = preMatch.marketEfficiency.totalImpliedProb;
        factors.marketEfficiencyAlt = preMatch.marketEfficiency.marketEfficiency;
    }
    
    // Derived market efficiency indicators
    if (preMatch.match) {
        const { homeWinOdds, awayWinOdds, drawOdds, over2_5Odds, under2_5Odds } = preMatch.match;
        
        if (homeWinOdds && awayWinOdds && drawOdds) {
            // Calculate our own market efficiency metrics
            const homeProb = 1 / homeWinOdds;
            const awayProb = 1 / awayWinOdds;
            const drawProb = 1 / drawOdds;
            const totalProb = homeProb + awayProb + drawProb;
            
            factors.calculatedMarketCut = (totalProb - 1) * 100;
            factors.favoriteImpliedProb = Math.max(homeProb, awayProb);
            factors.underdogImpliedProb = Math.min(homeProb, awayProb);
            factors.probSpread = factors.favoriteImpliedProb - factors.underdogImpliedProb;
        }
        
        if (over2_5Odds && under2_5Odds) {
            const overProb = 1 / over2_5Odds;
            const underProb = 1 / under2_5Odds;
            const ouTotalProb = overProb + underProb;
            
            factors.calculatedOUCut = (ouTotalProb - 1) * 100;
            factors.overImpliedProb = overProb;
            factors.underImpliedProb = underProb;
        }
        
        // Value betting indicators
        factors.lowMarketCut = factors.hadCut < 5 ? 1 : 0;
        factors.highMarketCut = factors.hadCut > 10 ? 1 : 0;
        factors.efficientMarket = Math.abs(factors.marketEfficiency) < 2 ? 1 : 0;
        factors.inefficientMarket = Math.abs(factors.marketEfficiency) > 8 ? 1 : 0;
    }
    
    return factors;
}

module.exports = { getMarketEfficiencyFactors }; 