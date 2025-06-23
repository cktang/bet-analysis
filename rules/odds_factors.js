// Odds-based factors using only pre-match data
function getOddsFactors(match) {
    const factors = {};
    
    // Use preMatch data only
    const preMatch = match.preMatch;
    if (!preMatch?.match) return factors;
    
    const { homeWinOdds, awayWinOdds, drawOdds, over2_5Odds, under2_5Odds } = preMatch.match;
    
    // Basic odds ratios (pre-match only)
    if (homeWinOdds && awayWinOdds) {
        factors.homeWinOdds = homeWinOdds;
        factors.awayWinOdds = awayWinOdds;
        factors.oddsRatio = homeWinOdds / awayWinOdds;
        factors.favoriteOdds = Math.min(homeWinOdds, awayWinOdds);
        factors.underdogOdds = Math.max(homeWinOdds, awayWinOdds);
    }
    
    // Market efficiency from pre-match enhanced data
    if (preMatch.enhanced) {
        factors.marketEfficiency = preMatch.enhanced.marketEfficiency;
        factors.hadCut = preMatch.enhanced.hadCut;
        factors.ouCut = preMatch.enhanced.ouCut;
        factors.homeImpliedProb = preMatch.enhanced.homeImpliedProb;
        factors.awayImpliedProb = preMatch.enhanced.awayImpliedProb;
        factors.homeValueBet = preMatch.enhanced.homeValueBet;
    }
    
    // Over/Under odds
    if (over2_5Odds && under2_5Odds) {
        factors.over2_5Odds = over2_5Odds;
        factors.under2_5Odds = under2_5Odds;
        factors.ouRatio = over2_5Odds / under2_5Odds;
    }
    
    // Asian Handicap odds (pre-match)
    if (preMatch.match.asianHandicapOdds) {
        factors.ahHomeOdds = preMatch.match.asianHandicapOdds.homeOdds;
        factors.ahAwayOdds = preMatch.match.asianHandicapOdds.awayOdds;
        factors.ahHandicap = parseFloat(preMatch.match.asianHandicapOdds.homeHandicap.replace(/[^\d.-]/g, ''));
    }
    
    return factors;
}

module.exports = { getOddsFactors }; 