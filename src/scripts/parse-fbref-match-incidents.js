const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

/**
 * Parse FBRef match page to extract incident data
 * @param {string} matchUrl - FBRef match report URL
 * @returns {Object} - Match incident data
 */
async function parseMatchIncidents(matchUrl) {
    try {
        console.log(`Parsing match: ${matchUrl}`);
        
        const response = await axios.get(matchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract team names from the page title more carefully
        const pageTitle = $('title').text();
        console.log('Page title:', pageTitle);
        
        // Try different patterns to extract team names
        let homeTeam, awayTeam, matchDate;
        
        // Pattern 1: "Team1 vs Team2 Match Report"
        let titleMatch = pageTitle.match(/^(.+?)\s+vs\.?\s+(.+?)\s+Match Report/i);
        if (titleMatch) {
            homeTeam = titleMatch[1].trim();
            awayTeam = titleMatch[2].trim();
        } else {
            // Pattern 2: "Team1 vs Team2 - Date - Competition"
            titleMatch = pageTitle.match(/^(.+?)\s+vs\s+(.+?)\s*[-–]\s*(.+?)\s*[-–]/);
            if (titleMatch) {
                homeTeam = titleMatch[1].trim();
                awayTeam = titleMatch[2].trim();
                matchDate = titleMatch[3].trim();
            } else {
                // Fallback: use h1 or simple split
                const h1Text = $('h1').text();
                const parts = h1Text.split(' vs ');
                homeTeam = parts[0]?.trim() || 'Home Team';
                awayTeam = parts[1]?.split(' - ')[0]?.trim() || 'Away Team';
            }
        }
        
        // Extract date if not found
        if (!matchDate) {
            const dateMatch = pageTitle.match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
            matchDate = dateMatch ? dateMatch[1] : 'Unknown Date';
        }
        
        console.log('Extracted teams:', { homeTeam, awayTeam, matchDate });
        
        // Initialize incidents object
        const incidents = {
            goals: [],
            yellowCards: [],
            redCards: [],
            penalties: [],
            substitutions: []
        };
        
        // Extract final score from the page
        let homeScore = 0;
        let awayScore = 0;
        
        // Try to get final score from the last event's score display
        const lastEvent = $('#events_wrap .event').last();
        if (lastEvent.length > 0) {
            const lastEventText = lastEvent.text();
            const finalScoreMatch = lastEventText.match(/(\d+):(\d+)/);
            if (finalScoreMatch) {
                homeScore = parseInt(finalScoreMatch[1]);
                awayScore = parseInt(finalScoreMatch[2]);
            }
        }
        
        // Parse events from the events_wrap section
        $('#events_wrap .event').each((i, element) => {
            const $event = $(element);
            
            // Get minute - look for patterns like "23'" or "45+1'" with Unicode quote
            const minuteText = $event.text();
            const minuteMatch = minuteText.match(/(\d+)(?:\+(\d+))?\s*['′''\u2019]/);
            if (!minuteMatch) return;
            
            const minute = parseInt(minuteMatch[1]);
            const addedTime = minuteMatch[2] ? parseInt(minuteMatch[2]) : 0;
            const fullMinute = minute + addedTime;
            
            // Get player info
            const playerLink = $event.find('a[href*="/players/"]').first();
            const playerName = playerLink.text().trim();
            const playerId = playerLink.attr('href') ? playerLink.attr('href').split('/')[3] : null;
            
            // Get event text and clean it
            const eventText = $event.text().replace(/\s+/g, ' ').trim();
            const eventHtml = $event.html();
            
            // Determine team from event structure
            let team = awayTeam; // default to away
            
            // Method 1: Check team logos
            const teamLogos = $event.find('img[alt]');
            if (teamLogos.length > 0) {
                const logoAlt = teamLogos.first().attr('alt') || '';
                const homeTeamKey = homeTeam.toLowerCase().split(' ')[0];
                if (logoAlt.toLowerCase().includes(homeTeamKey)) {
                    team = homeTeam;
                }
            }
            
            // Method 2: Check event position/structure (left vs right side)
            const eventClass = $event.attr('class') || '';
            
            // Method 3: Look for team indicators in the event text/structure
            if (eventText.includes(homeTeam) || eventHtml.includes(homeTeam)) {
                team = homeTeam;
            } else if (eventText.includes(awayTeam) || eventHtml.includes(awayTeam)) {
                team = awayTeam;
            }
            
            // Method 4: Use event position heuristic (home events often on left/first)
            const eventIndex = $event.index();
            const totalEvents = $('#events_wrap .event').length;
            
            // Look for event type indicators in the HTML structure
            const eventIcon = $event.find('.event_icon, [class*="icon"]');
            
            // Check for goal events - look for score changes AND goal indicators
            const scoreMatch = eventText.match(/(\d+):(\d+)/);
            
            // Simple heuristic: if we can't determine team, alternate based on score progression
            if (team === awayTeam && scoreMatch) {
                const currentHomeScore = parseInt(scoreMatch[1]);
                const currentAwayScore = parseInt(scoreMatch[2]);
                
                // If this goal increases home score, it's likely a home team goal
                const prevEvent = $event.prev('.event');
                if (prevEvent.length > 0) {
                    const prevScoreMatch = prevEvent.text().match(/(\d+):(\d+)/);
                    if (prevScoreMatch) {
                        const prevHomeScore = parseInt(prevScoreMatch[1]);
                        if (currentHomeScore > prevHomeScore) {
                            team = homeTeam;
                        }
                    }
                } else if (currentHomeScore > 0 && currentAwayScore === 0) {
                    // First goal and it's for home team
                    team = homeTeam;
                }
            }
            
            const hasGoalIndicator = eventText.toLowerCase().includes('goal') || 
                                   eventHtml.includes('goal') || 
                                   eventIcon.hasClass('goal');
            
            if (scoreMatch && hasGoalIndicator) {
                // This is a goal event
                const isPenalty = eventText.toLowerCase().includes('penalty');
                
                // Clean assist extraction
                let assist = '';
                const assistMatch = eventText.match(/Assist:\s*([^\n\t—]+)/);
                if (assistMatch) {
                    assist = assistMatch[1].trim().replace(/\s+/g, ' ');
                    // Remove any trailing artifacts
                    assist = assist.split('—')[0].trim();
                }
                
                incidents.goals.push({
                    minute: fullMinute,
                    player: playerName,
                    playerId,
                    team,
                    isPenalty,
                    assist
                });
                
                if (isPenalty) {
                    incidents.penalties.push({
                        minute: fullMinute,
                        player: playerName,
                        playerId,
                        team,
                        type: 'goal'
                    });
                }
            }
            // Check for yellow card events
            else if (eventText.toLowerCase().includes('yellow') || 
                     eventHtml.includes('yellow') || 
                     eventIcon.hasClass('yellow_card')) {
                incidents.yellowCards.push({
                    minute: fullMinute,
                    player: playerName,
                    playerId,
                    team
                });
            }
            // Check for red card events
            else if (eventText.toLowerCase().includes('red') || 
                     eventHtml.includes('red') || 
                     eventIcon.hasClass('red_card')) {
                incidents.redCards.push({
                    minute: fullMinute,
                    player: playerName,
                    playerId,
                    team
                });
            }
            // Check for substitution events
            else if (eventText.toLowerCase().includes('substitution') || 
                     eventHtml.includes('substitute') || 
                     eventIcon.hasClass('substitute_in') || 
                     eventIcon.hasClass('substitute_out')) {
                incidents.substitutions.push({
                    minute: fullMinute,
                    player: playerName,
                    playerId,
                    team,
                    type: eventIcon.hasClass('substitute_in') ? 'in' : 'out'
                });
            }
        });
        
        // Extract penalty statistics from player stats tables
        const penaltyStats = {
            home: { won: 0, conceded: 0, made: 0, attempted: 0 },
            away: { won: 0, conceded: 0, made: 0, attempted: 0 }
        };
        
        // Look for penalty stats in the stats tables
        $('table[id*="stats"] tbody tr').each((i, row) => {
            const $row = $(row);
            const pensWon = parseInt($row.find('[data-stat="pens_won"]').text()) || 0;
            const pensConceded = parseInt($row.find('[data-stat="pens_conceded"]').text()) || 0;
            const pensMade = parseInt($row.find('[data-stat="pens_made"]').text()) || 0;
            const pensAttempted = parseInt($row.find('[data-stat="pens_att"]').text()) || 0;
            
            if (pensWon > 0 || pensConceded > 0 || pensMade > 0 || pensAttempted > 0) {
                // Determine if this is home or away team stats
                const isHomeTeam = i < 11; // Rough heuristic
                const teamStats = isHomeTeam ? penaltyStats.home : penaltyStats.away;
                teamStats.won += pensWon;
                teamStats.conceded += pensConceded;
                teamStats.made += pensMade;
                teamStats.attempted += pensAttempted;
            }
        });
        
        // Calculate cleanliness score
        const cleanliness = calculateCleanliness(incidents, penaltyStats);
        
        return {
            url: matchUrl,
            homeTeam,
            awayTeam,
            matchDate,
            score: `${homeScore}-${awayScore}`,
            homeScore,
            awayScore,
            incidents,
            penaltyStats,
            cleanliness,
            summary: {
                totalGoals: incidents.goals.length,
                penaltyGoals: incidents.goals.filter(g => g.isPenalty).length,
                yellowCards: incidents.yellowCards.length,
                redCards: incidents.redCards.length,
                penalties: incidents.penalties.length,
                substitutions: incidents.substitutions.length
            }
        };
        
    } catch (error) {
        console.error('Error parsing match:', error.message);
        throw error;
    }
}

/**
 * Calculate match cleanliness score
 * @param {Object} incidents - Match incidents
 * @param {Object} penaltyStats - Penalty statistics
 * @returns {Object} - Cleanliness assessment
 */
function calculateCleanliness(incidents, penaltyStats) {
    let score = 0;
    const factors = {
        redCards: incidents.redCards.length,
        penalties: incidents.penalties.length,
        yellowCards: incidents.yellowCards.length,
        earlyRedCard: 0,
        multipleRedCards: 0
    };
    
    // Red card penalties
    incidents.redCards.forEach(card => {
        score += card.minute < 30 ? 5 : 3; // Early red cards are more disruptive
        if (card.minute < 30) factors.earlyRedCard++;
    });
    
    if (factors.redCards > 1) {
        score += 3; // Multiple red cards
        factors.multipleRedCards = factors.redCards - 1;
    }
    
    // Penalty penalties
    score += factors.penalties * 2;
    
    // Yellow card penalties (minor)
    score += Math.floor(factors.yellowCards / 3); // Every 3 yellow cards adds 1 point
    
    // Categorize cleanliness
    let category;
    if (score === 0) category = 'clean';
    else if (score <= 2) category = 'minor_incidents';
    else if (score <= 5) category = 'moderate_incidents';
    else category = 'major_incidents';
    
    return {
        score,
        category,
        factors
    };
}

/**
 * Test the parser with a specific match
 */
async function testParser() {
    console.log('Testing FBRef match incident parser...\\n');
    
    // Test with Tottenham vs Liverpool match (high-scoring game)
    const testUrl = 'https://fbref.com/en/matches/1e1cea4c/Tottenham-Hotspur-Liverpool-December-22-2024-Premier-League';
    
    try {
        const result = await parseMatchIncidents(testUrl);
        
        console.log('=== MATCH ANALYSIS ===');
        console.log(`Match: ${result.homeTeam} vs ${result.awayTeam}`);
        console.log(`Date: ${result.matchDate}`);
        console.log(`Score: ${result.score}`);
        console.log(`Cleanliness Category: ${result.cleanliness.category}`);
        console.log(`Cleanliness Score: ${result.cleanliness.score}`);
        
        console.log('\\n=== INCIDENTS ===');
        console.log(`Goals: ${result.summary.totalGoals} (${result.summary.penaltyGoals} penalties)`);
        console.log(`Yellow Cards: ${result.summary.yellowCards}`);
        console.log(`Red Cards: ${result.summary.redCards}`);
        console.log(`Penalties: ${result.summary.penalties}`);
        
        console.log('\\n=== DETAILED EVENTS ===');
        result.incidents.goals.forEach(goal => {
            console.log(`${goal.minute}' - GOAL: ${goal.player} (${goal.team})${goal.isPenalty ? ' [PENALTY]' : ''}${goal.assist ? ` - Assist: ${goal.assist}` : ''}`);
        });
        
        result.incidents.redCards.forEach(card => {
            console.log(`${card.minute}' - RED CARD: ${card.player} (${card.team})`);
        });
        
        result.incidents.penalties.forEach(pen => {
            console.log(`${pen.minute}' - PENALTY: ${pen.player} (${pen.team}) [${pen.type}]`);
        });
        
        console.log('\\n=== RECOMMENDATION ===');
        if (result.cleanliness.category === 'clean') {
            console.log('✅ This match is suitable for predictive analysis (clean game)');
        } else if (result.cleanliness.category === 'minor_incidents') {
            console.log('⚠️  This match had minor incidents - use with caution');
        } else {
            console.log('❌ This match was significantly influenced by incidents - consider excluding');
        }
        
        // Save detailed results
        const outputPath = path.join(process.cwd(), 'output', 'test-match-incidents.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`\\nDetailed results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testParser();
}

module.exports = { parseMatchIncidents, calculateCleanliness }; 