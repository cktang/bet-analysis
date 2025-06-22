const fs = require('fs');
const path = require('path');

/**
 * Deep League Position Data Accuracy Check
 * Cross-reference with known Premier League table positions
 */
function deepPositionCheck() {
    console.log('🔍 DEEP LEAGUE POSITION DATA ACCURACY CHECK\n');
    
    // Load 2023-2024 season data (complete season)
    const filePath = path.join(__dirname, 'data/processed/year-2023-2024.json');
    if (!fs.existsSync(filePath)) {
        console.log('❌ 2023-2024 data file not found');
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const matches = Object.values(data.matches);
    
    console.log(`📊 Analyzing 2023-2024 season: ${matches.length} matches\n`);
    
    // Check known facts about 2023-2024 Premier League season
    console.log('🏆 KNOWN 2023-2024 PREMIER LEAGUE FACTS:\n');
    console.log('Final Table (actual):');
    console.log('1. Manchester City (champions)');
    console.log('2. Arsenal');  
    console.log('3. Liverpool');
    console.log('4. Aston Villa');
    console.log('...');
    console.log('18. Luton (relegated)');
    console.log('19. Burnley (relegated)');
    console.log('20. Sheffield United (relegated)\n');
    
    // Check specific matches with known outcomes
    const knownFactChecks = [
        {
            description: 'Manchester City should be top 4 all season',
            team: 'Manchester City',
            expectedMaxPosition: 4
        },
        {
            description: 'Sheffield United should be bottom 3 late season',
            team: 'Sheffield Utd',
            expectedMinPositionLate: 18,
            weekThreshold: 25
        },
        {
            description: 'Arsenal should be top 4 all season',
            team: 'Arsenal', 
            expectedMaxPosition: 4
        }
    ];
    
    console.log('🔍 FACT-CHECKING AGAINST KNOWN RESULTS:\n');
    
    knownFactChecks.forEach(check => {
        console.log(`Testing: ${check.description}`);
        
        const teamMatches = matches.filter(match => 
            (match.match.homeTeam === check.team || match.match.awayTeam === check.team) &&
            match.timeSeries?.home?.leaguePosition && 
            match.timeSeries?.away?.leaguePosition &&
            match.fbref?.week
        );
        
        let violations = [];
        
        teamMatches.forEach(match => {
            const week = match.fbref.week;
            const position = match.match.homeTeam === check.team ? 
                match.timeSeries.home.leaguePosition : 
                match.timeSeries.away.leaguePosition;
            
            // Check max position violation
            if (check.expectedMaxPosition && position > check.expectedMaxPosition) {
                violations.push({
                    week,
                    position,
                    violation: `Position ${position} > expected max ${check.expectedMaxPosition}`,
                    opponent: match.match.homeTeam === check.team ? match.match.awayTeam : match.match.homeTeam,
                    date: match.match.date
                });
            }
            
            // Check min position violation (late season)
            if (check.expectedMinPositionLate && check.weekThreshold && 
                week >= check.weekThreshold && position < check.expectedMinPositionLate) {
                violations.push({
                    week,
                    position,
                    violation: `Late season position ${position} < expected min ${check.expectedMinPositionLate}`,
                    opponent: match.match.homeTeam === check.team ? match.match.awayTeam : match.match.homeTeam,
                    date: match.match.date
                });
            }
        });
        
        if (violations.length === 0) {
            console.log(`  ✅ PASS: ${check.team} positions look correct`);
        } else {
            console.log(`  ❌ FAIL: ${check.team} has ${violations.length} position violations:`);
            violations.slice(0, 5).forEach(v => {
                console.log(`    Week ${v.week}: ${v.violation} vs ${v.opponent}`);
            });
        }
        console.log();
    });
    
    // Check for impossible position jumps
    console.log('📊 CHECKING FOR IMPOSSIBLE POSITION JUMPS:\n');
    
    const teamPositionHistory = {};
    
    // Build position history for each team
    matches.forEach(match => {
        const week = match.fbref?.week;
        if (!week) return;
        
        if (match.timeSeries?.home?.leaguePosition) {
            const team = match.match.homeTeam;
            const position = match.timeSeries.home.leaguePosition;
            
            if (!teamPositionHistory[team]) teamPositionHistory[team] = [];
            teamPositionHistory[team].push({ week, position, date: match.match.date });
        }
        
        if (match.timeSeries?.away?.leaguePosition) {
            const team = match.match.awayTeam;
            const position = match.timeSeries.away.leaguePosition;
            
            if (!teamPositionHistory[team]) teamPositionHistory[team] = [];
            teamPositionHistory[team].push({ week, position, date: match.match.date });
        }
    });
    
    // Check for massive position jumps between consecutive weeks
    let suspiciousJumps = [];
    
    Object.keys(teamPositionHistory).forEach(team => {
        const history = teamPositionHistory[team].sort((a, b) => a.week - b.week);
        
        for (let i = 1; i < history.length; i++) {
            const prev = history[i-1];
            const curr = history[i];
            
            // Check for jumps > 10 positions in consecutive weeks
            const jump = Math.abs(curr.position - prev.position);
            if (jump > 10 && Math.abs(curr.week - prev.week) <= 2) {
                suspiciousJumps.push({
                    team,
                    fromWeek: prev.week,
                    toWeek: curr.week,
                    fromPosition: prev.position,
                    toPosition: curr.position,
                    jump
                });
            }
        }
    });
    
    if (suspiciousJumps.length > 0) {
        console.log(`❌ Found ${suspiciousJumps.length} suspicious position jumps (>10 positions):`);
        suspiciousJumps.slice(0, 10).forEach(jump => {
            console.log(`  ${jump.team}: Week ${jump.fromWeek} pos ${jump.fromPosition} → Week ${jump.toWeek} pos ${jump.toPosition} (jump: ${jump.jump})`);
        });
    } else {
        console.log('✅ No suspicious position jumps found');
    }
    
    // Sample some late season positions for manual verification
    console.log('\n🔍 LATE SEASON POSITIONS SAMPLE (Week 35+):\n');
    
    const lateSeason = matches.filter(m => m.fbref?.week >= 35)
        .filter(m => m.timeSeries?.home?.leaguePosition && m.timeSeries?.away?.leaguePosition)
        .slice(0, 15);
    
    lateSeason.forEach(match => {
        console.log(`Week ${match.fbref.week}: ${match.match.homeTeam}(${match.timeSeries.home.leaguePosition}) vs ${match.match.awayTeam}(${match.timeSeries.away.leaguePosition})`);
    });
    
    // Check correlation between position and actual match outcomes
    console.log('\n📊 POSITION vs ACTUAL RESULTS CORRELATION:\n');
    
    let positionPredictionCheck = {
        higherPositionWins: 0,
        lowerPositionWins: 0,
        draws: 0,
        total: 0
    };
    
    matches.forEach(match => {
        const homePos = match.timeSeries?.home?.leaguePosition;
        const awayPos = match.timeSeries?.away?.leaguePosition;
        const homeScore = match.match.homeScore;
        const awayScore = match.match.awayScore;
        
        if (homePos && awayPos && homeScore !== null && awayScore !== null) {
            positionPredictionCheck.total++;
            
            if (homeScore > awayScore) {
                // Home wins - check if home had better position (lower number)
                if (homePos < awayPos) {
                    positionPredictionCheck.higherPositionWins++;
                } else {
                    positionPredictionCheck.lowerPositionWins++;
                }
            } else if (awayScore > homeScore) {
                // Away wins - check if away had better position (lower number)
                if (awayPos < homePos) {
                    positionPredictionCheck.higherPositionWins++;
                } else {
                    positionPredictionCheck.lowerPositionWins++;
                }
            } else {
                positionPredictionCheck.draws++;
            }
        }
    });
    
    const higherPosWinRate = (positionPredictionCheck.higherPositionWins / positionPredictionCheck.total * 100).toFixed(1);
    
    console.log(`Total matches analyzed: ${positionPredictionCheck.total}`);
    console.log(`Higher positioned team wins: ${positionPredictionCheck.higherPositionWins} (${higherPosWinRate}%)`);
    console.log(`Lower positioned team wins: ${positionPredictionCheck.lowerPositionWins}`);
    console.log(`Draws: ${positionPredictionCheck.draws}`);
    
    if (parseFloat(higherPosWinRate) < 50) {
        console.log('❌ WARNING: Higher positioned teams win less than 50% - data may be incorrect!');
    } else if (parseFloat(higherPosWinRate) > 70) {
        console.log('❌ WARNING: Higher positioned teams win too often - data may be artificial!');
    } else {
        console.log('✅ Position prediction rate looks reasonable');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('If position data is accurate, higher positioned teams should win ~55-60% of matches');
    console.log('If win rate is too high (>70%), it suggests position data is somehow corrupted or artificial');
}

deepPositionCheck();