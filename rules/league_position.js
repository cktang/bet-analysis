// League position and standings-based factors using only historical data
function getLeaguePositionFactors(match) {
    const factors = {};
    
    // Use timeSeries for historical league positions
    const timeSeries = match.timeSeries;
    if (!timeSeries?.home || !timeSeries?.away) return factors;
    
    const homePosition = timeSeries.home.leaguePosition;
    const awayPosition = timeSeries.away.leaguePosition;
    
    if (homePosition && awayPosition) {
        factors.homePosition = homePosition;
        factors.awayPosition = awayPosition;
        factors.positionDiff = homePosition - awayPosition;
        factors.positionSum = homePosition + awayPosition;
        
        // Top 6 battle indicators
        factors.homeTopSix = homePosition <= 6;
        factors.awayTopSix = awayPosition <= 6;
        factors.topSixBattle = homePosition <= 6 && awayPosition <= 6;
        
        // Relegation battle indicators
        factors.homeRelegationZone = homePosition >= 18;
        factors.awayRelegationZone = awayPosition >= 18;
        factors.relegationBattle = homePosition >= 18 || awayPosition >= 18;
        factors.relegationPressure = Math.max(0, 18 - Math.min(homePosition, awayPosition));
        
        // Mid-table vs extremes
        factors.midTableClash = homePosition > 6 && homePosition < 18 && awayPosition > 6 && awayPosition < 18;
        factors.extremePositions = Math.abs(homePosition - awayPosition) > 10;
        
        // European competition pressure
        factors.europeanPressure = (homePosition <= 7 || awayPosition <= 7) ? 1 : 0;
        
        // Title race indicators
        factors.titleRacePressure = (homePosition <= 4 || awayPosition <= 4) ? 1 : 0;
    }
    
    return factors;
}

module.exports = { getLeaguePositionFactors }; 