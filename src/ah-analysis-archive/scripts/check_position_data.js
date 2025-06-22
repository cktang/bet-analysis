const fs = require('fs');
const path = require('path');

/**
 * Check League Position Data Accuracy
 */
function checkPositionData() {
    console.log('🔍 CHECKING LEAGUE POSITION DATA ACCURACY\n');
    
    // Load 2024-2025 season data
    const filePath = path.join(__dirname, 'data/processed/year-2024-2025.json');
    if (!fs.existsSync(filePath)) {
        console.log('❌ 2024-2025 data file not found');
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const matches = Object.values(data.matches);
    
    console.log(`📊 Total matches in 2024-2025: ${matches.length}\n`);
    
    // Check specific problematic examples from betting records
    const suspiciousExamples = [
        { date: '2024-08-23', homeTeam: 'Tottenham', awayTeam: 'Everton' },
        { date: '2024-08-30', homeTeam: 'Everton', awayTeam: 'Bournemouth' },
        { date: '2024-08-31', homeTeam: 'Chelsea', awayTeam: 'Crystal Palace' },
        { date: '2024-09-14', homeTeam: 'Wolves', awayTeam: 'Newcastle' }
    ];
    
    console.log('🔍 CHECKING SUSPICIOUS POSITION EXAMPLES:\n');
    
    suspiciousExamples.forEach(example => {
        const match = matches.find(m => 
            m.match.date.includes(example.date) && 
            m.match.homeTeam === example.homeTeam && 
            m.match.awayTeam === example.awayTeam
        );
        
        if (match) {
            console.log(`📅 ${example.date}: ${example.homeTeam} vs ${example.awayTeam}`);
            
            if (match.timeSeries?.home?.leaguePosition) {
                console.log(`   ${example.homeTeam} position: ${match.timeSeries.home.leaguePosition}`);
            } else {
                console.log(`   ${example.homeTeam} position: NOT FOUND`);
            }
            
            if (match.timeSeries?.away?.leaguePosition) {
                console.log(`   ${example.awayTeam} position: ${match.timeSeries.away.leaguePosition}`);
            } else {
                console.log(`   ${example.awayTeam} position: NOT FOUND`);
            }
            
            console.log(`   Match week: ${match.fbref?.week || 'Unknown'}`);
            console.log();
        } else {
            console.log(`❌ Match not found: ${example.date} ${example.homeTeam} vs ${example.awayTeam}\n`);
        }
    });
    
    // Check early season position data availability
    console.log('📊 POSITION DATA AVAILABILITY BY WEEK:\n');
    
    const weeklyPositionData = {};
    
    matches.forEach(match => {
        const week = match.fbref?.week;
        if (week) {
            if (!weeklyPositionData[week]) {
                weeklyPositionData[week] = {
                    totalMatches: 0,
                    matchesWithPositions: 0
                };
            }
            
            weeklyPositionData[week].totalMatches++;
            
            if (match.timeSeries?.home?.leaguePosition && match.timeSeries?.away?.leaguePosition) {
                weeklyPositionData[week].matchesWithPositions++;
            }
        }
    });
    
    const sortedWeeks = Object.keys(weeklyPositionData).sort((a, b) => parseInt(a) - parseInt(b));
    
    console.log('Week | Total Matches | With Positions | Coverage');
    console.log('-----|---------------|----------------|----------');
    
    sortedWeeks.slice(0, 15).forEach(week => {
        const data = weeklyPositionData[week];
        const coverage = ((data.matchesWithPositions / data.totalMatches) * 100).toFixed(1);
        console.log(`${week.padStart(4)} | ${data.totalMatches.toString().padStart(13)} | ${data.matchesWithPositions.toString().padStart(14)} | ${coverage}%`);
    });
    
    // Sample some actual position values from early season
    console.log('\n🔍 SAMPLE EARLY SEASON POSITIONS (Week 3-5):\n');
    
    const earlyMatches = matches.filter(m => m.fbref?.week >= 3 && m.fbref?.week <= 5)
        .filter(m => m.timeSeries?.home?.leaguePosition && m.timeSeries?.away?.leaguePosition)
        .slice(0, 10);
    
    earlyMatches.forEach(match => {
        console.log(`Week ${match.fbref.week}: ${match.match.homeTeam}(${match.timeSeries.home.leaguePosition}) vs ${match.match.awayTeam}(${match.timeSeries.away.leaguePosition})`);
    });
    
    // Check if positions make sense (1-20 range)
    console.log('\n⚠️  POSITION DATA VALIDATION:\n');
    
    let invalidPositions = [];
    
    matches.forEach((match, index) => {
        if (match.timeSeries?.home?.leaguePosition) {
            const pos = match.timeSeries.home.leaguePosition;
            if (pos < 1 || pos > 20 || !Number.isInteger(pos)) {
                invalidPositions.push({
                    matchIndex: index,
                    team: match.match.homeTeam,
                    position: pos,
                    date: match.match.date
                });
            }
        }
        
        if (match.timeSeries?.away?.leaguePosition) {
            const pos = match.timeSeries.away.leaguePosition;
            if (pos < 1 || pos > 20 || !Number.isInteger(pos)) {
                invalidPositions.push({
                    matchIndex: index,
                    team: match.match.awayTeam,
                    position: pos,
                    date: match.match.date
                });
            }
        }
    });
    
    if (invalidPositions.length > 0) {
        console.log(`❌ Found ${invalidPositions.length} invalid positions:`);
        invalidPositions.slice(0, 10).forEach(invalid => {
            console.log(`   ${invalid.team}: position ${invalid.position} on ${invalid.date}`);
        });
    } else {
        console.log('✅ All positions are in valid range (1-20)');
    }
    
    console.log('\n📋 SUMMARY:');
    const totalWithPositions = matches.filter(m => 
        m.timeSeries?.home?.leaguePosition && m.timeSeries?.away?.leaguePosition
    ).length;
    
    console.log(`Total matches: ${matches.length}`);
    console.log(`Matches with position data: ${totalWithPositions}`);
    console.log(`Position data coverage: ${((totalWithPositions/matches.length)*100).toFixed(1)}%`);
    console.log(`Invalid positions found: ${invalidPositions.length}`);
}

checkPositionData();