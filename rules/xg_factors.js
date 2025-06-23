// Expected Goals factors using only pre-match and historical data
function getXGFactors(match) {
    const factors = {};
    
    // Use preMatch data for pre-match XG (if available)
    const preMatch = match.preMatch;
    const timeSeries = match.timeSeries;
    
    // Pre-match Expected Goals (if available from betting markets or pre-match analysis)
    if (preMatch?.fbref?.homeXG !== undefined && preMatch?.fbref?.awayXG !== undefined) {
        // NOTE: FBRef XG is typically post-match, but if it's in preMatch, treat as pre-match prediction
        factors.preMatchHomeXG = preMatch.fbref.homeXG;
        factors.preMatchAwayXG = preMatch.fbref.awayXG;
        factors.xgLine = preMatch.fbref.homeXG - preMatch.fbref.awayXG;
        factors.xgTotal = preMatch.fbref.homeXG + preMatch.fbref.awayXG;
        
        // Market-derived XG expectations
        if (preMatch.enhanced) {
            factors.xgLineMarket = preMatch.enhanced.xgLine;
            factors.xgTotalMarket = preMatch.enhanced.xgTotal;
        }
    }
    
    // Historical XG averages from timeSeries (legitimate pre-match data)
    if (timeSeries?.home?.averages && timeSeries?.away?.averages) {
        const homeAvg = timeSeries.home.averages;
        const awayAvg = timeSeries.away.averages;
        
        // Overall historical XG averages
        factors.homeHistoricalXGFor = homeAvg.overall?.xGFor || 0;
        factors.homeHistoricalXGAgainst = homeAvg.overall?.xGAgainst || 0;
        factors.awayHistoricalXGFor = awayAvg.overall?.xGFor || 0;
        factors.awayHistoricalXGAgainst = awayAvg.overall?.xGAgainst || 0;
        
        // Venue-specific historical XG
        factors.homeVenueXGFor = homeAvg.venue?.xGFor || 0;
        factors.homeVenueXGAgainst = homeAvg.venue?.xGAgainst || 0;
        factors.awayVenueXGFor = awayAvg.venue?.xGFor || 0;
        factors.awayVenueXGAgainst = awayAvg.venue?.xGAgainst || 0;
        
        // Recent form XG (last 5 matches)
        factors.homeRecentXGFor = homeAvg.recent?.xGFor || 0;
        factors.homeRecentXGAgainst = homeAvg.recent?.xGAgainst || 0;
        factors.awayRecentXGFor = awayAvg.recent?.xGFor || 0;
        factors.awayRecentXGAgainst = awayAvg.recent?.xGAgainst || 0;
        
        // XG efficiency from historical data
        if (timeSeries.home.patterns && timeSeries.away.patterns) {
            factors.homeXGEfficiency = timeSeries.home.patterns.xGEfficiency || 0;
            factors.awayXGEfficiency = timeSeries.away.patterns.xGEfficiency || 0;
            factors.homeXGDefensiveEfficiency = timeSeries.home.patterns.xGDefensiveEfficiency || 0;
            factors.awayXGDefensiveEfficiency = timeSeries.away.patterns.xGDefensiveEfficiency || 0;
        }
        
        // Derived XG predictions based on historical data
        factors.predictedHomeXG = (factors.homeVenueXGFor + factors.awayVenueXGAgainst) / 2;
        factors.predictedAwayXG = (factors.awayVenueXGFor + factors.homeVenueXGAgainst) / 2;
        factors.predictedXGLine = factors.predictedHomeXG - factors.predictedAwayXG;
        factors.predictedXGTotal = factors.predictedHomeXG + factors.predictedAwayXG;
        
        // XG vs actual goals historical patterns
        factors.homeGoalsXGDiff = (homeAvg.overall?.goalsFor || 0) - (homeAvg.overall?.xGFor || 0);
        factors.awayGoalsXGDiff = (awayAvg.overall?.goalsFor || 0) - (awayAvg.overall?.xGFor || 0);
    }
    
    return factors;
}

module.exports = { getXGFactors }; 