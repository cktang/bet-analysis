/**
 * AH Value vs Week Timing Factors
 * 
 * These rules combine Asian Handicap line values with specific week ranges
 * to identify profitable betting patterns based on seasonal timing.
 */

module.exports = {
    name: "AH Week Timing Factors",
    description: "Asian Handicap line values combined with week timing patterns",
    enabled: true,
    
    factors: [
        {
            name: "ahLine",
            expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])",
            description: "Asian Handicap line value"
        },
        {
            name: "weekNumber", 
            expression: "fbref.week",
            description: "Week number in season"
        },
        {
            name: "ahLineSeverity",
            expression: "Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]))",
            description: "Absolute value of handicap line"
        }
    ],
    
    combinations: [
        // Early Season AH Patterns
        {
            name: "Early_Season_Small_AH_Home",
            factors: ["(fbref.week <= 6 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.5 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= 0) ? 1 : 0"],
            hypothesis: "Early season close handicaps favor home teams due to home advantage uncertainty",
            type: "single"
        },
        
        {
            name: "Early_Season_Small_AH_Away", 
            factors: ["(fbref.week <= 6 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 0 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= 0.5) ? 1 : 0"],
            hypothesis: "Early season small away advantages provide value due to market overreaction",
            type: "single"
        },
        
        {
            name: "Early_Season_Large_AH_Fade",
            factors: ["(fbref.week <= 6 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) >= 1.5) ? 1 : 0"],
            hypothesis: "Early season large handicaps should be faded - limited data causes market inefficiency",
            type: "single"
        },
        
        // Mid Season AH Patterns
        {
            name: "Mid_Season_Moderate_AH_Home",
            factors: ["(fbref.week >= 15 && fbref.week <= 25 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -1.5 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5) ? 1 : 0"],
            hypothesis: "Mid season moderate home favorites are more reliable with sufficient form data",
            type: "single"
        },
        
        {
            name: "Mid_Season_Close_AH_Value",
            factors: ["(fbref.week >= 15 && fbref.week <= 25 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.5) ? 1 : 0"],
            hypothesis: "Mid season close handicaps show true form with adequate sample size",
            type: "single"
        },
        
        // Late Season AH Patterns
        {
            name: "Late_Season_Large_AH_Fade",
            factors: ["(fbref.week >= 30 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -1.5) ? 1 : 0"],
            hypothesis: "Late season pressure causes strong favorites to underperform against handicap",
            type: "single"
        },
        
        {
            name: "Late_Season_Moderate_AH_Away",
            factors: ["(fbref.week >= 30 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 0.5 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= 1.5) ? 1 : 0"],
            hypothesis: "Late season away teams with moderate advantage benefit from reduced pressure",
            type: "single"
        },
        
        {
            name: "Late_Season_Close_AH_Pressure",
            factors: ["(fbref.week >= 30 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.5 && ((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6)) ? 1 : 0"],
            hypothesis: "Late season close games with top 6 teams create pressure-induced value",
            type: "single"
        },
        
        // Specific AH Range Patterns
        {
            name: "Heavy_Home_Favorites_All_Season",
            factors: ["parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -2 ? 1 : 0"],
            hypothesis: "Heavy home favorites (AH <= -2) tend to be overpriced by market",
            type: "single"
        },
        
        {
            name: "Heavy_Away_Favorites_All_Season", 
            factors: ["parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 2 ? 1 : 0"],
            hypothesis: "Heavy away favorites (AH >= 2) face additional travel/pressure challenges",
            type: "single"
        },
        
        {
            name: "Pick_Em_Games_All_Season",
            factors: ["parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) === 0 ? 1 : 0"],
            hypothesis: "Pick em games (AH = 0) provide pure value betting opportunities",
            type: "single"
        },
        
        // Combined Week + AH + Position Patterns
        {
            name: "Early_Season_AH_Top_Six",
            factors: ["(fbref.week <= 6 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) >= 1 && ((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6)) ? 1 : 0"],
            hypothesis: "Early season large handicaps involving top 6 teams show market overconfidence",
            type: "single"
        },
        
        {
            name: "Late_Season_AH_Bottom_Three",
            factors: ["(fbref.week >= 30 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 1 && ((timeSeries.home.leaguePosition || 20) >= 18 || (timeSeries.away.leaguePosition || 20) >= 18)) ? 1 : 0"],
            hypothesis: "Late season relegation battles with small handicaps create desperate team value",
            type: "single"
        },
        
        // Analysis Factors  
        {
            name: "Handicap_Line_Severity",
            factors: ["Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]))"],
            hypothesis: "The magnitude of handicap line predicts market confidence and potential value",
            type: "single"
        },
        
        {
            name: "Week_Handicap_Interaction",
            factors: ["(fbref.week || 20) * Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]))"],
            hypothesis: "Interaction between week and handicap severity reveals seasonal betting patterns",
            type: "single"
        }
    ]
};