const fs = require('fs');
const path = require('path');

// Debug why we have 0 matches with complete AH and XG data
function debugDataFilter() {
    console.log('🔍 Debugging data filter issue...\n');
    
    const seasonPath = path.join(__dirname, '../../data/processed/year-2023-2024.json');
    const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
    const matches = Object.values(seasonData.matches).slice(0, 5);
    
    console.log('Sample match structure:');
    matches.forEach((match, i) => {
        console.log(`\nMatch ${i+1}: ${match.match?.homeTeam} vs ${match.match?.awayTeam}`);
        console.log('Has enhanced.asianHandicapBetting?', !!match.enhanced?.asianHandicapBetting);
        console.log('Has enhanced.asianHandicapBetting.homeProfit?', !!match.enhanced?.asianHandicapBetting?.homeProfit);
        console.log('Has enhanced.asianHandicapBetting.awayProfit?', !!match.enhanced?.asianHandicapBetting?.awayProfit);
        console.log('Has fbref.homeXG?', !!match.fbref?.homeXG);
        console.log('Has fbref.awayXG?', !!match.fbref?.awayXG);
        
        // Check if this would pass the filter
        const passesFilter = (
            match.enhanced?.asianHandicapBetting?.homeProfit !== undefined &&
            match.enhanced?.asianHandicapBetting?.awayProfit !== undefined &&
            match.fbref?.homeXG !== undefined &&
            match.fbref?.awayXG !== undefined
        );
        console.log('Would pass filter?', passesFilter);
    });
    
    // Check the whole season
    const allMatches = Object.values(seasonData.matches);
    const validMatches = allMatches.filter(match => 
        match.enhanced?.asianHandicapBetting?.homeProfit !== undefined &&
        match.enhanced?.asianHandicapBetting?.awayProfit !== undefined &&
        match.fbref?.homeXG !== undefined &&
        match.fbref?.awayXG !== undefined
    );
    
    console.log(`\nTotal matches in season: ${allMatches.length}`);
    console.log(`Valid matches: ${validMatches.length}`);
    
    if (validMatches.length === 0) {
        console.log('\n❌ NO VALID MATCHES FOUND');
        console.log('Checking what data is missing...');
        
        const missingAH = allMatches.filter(m => !m.enhanced?.asianHandicapBetting?.homeProfit).length;
        const missingXG = allMatches.filter(m => !m.fbref?.homeXG).length;
        
        console.log(`Missing AH profit data: ${missingAH}/${allMatches.length}`);
        console.log(`Missing XG data: ${missingXG}/${allMatches.length}`);
    }
}

debugDataFilter();