const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Read and parse the files
const fbrefData = fs.readFileSync(path.join(__dirname, 'parsed', 'fbref', 'fbref_2023_2024_data.csv'), 'utf-8');
const allMatchesData = fs.readFileSync(path.join(__dirname, 'parsed', 'Eng Premier', 'all-matches.csv'), 'utf-8');

// Parse CSV data
const fbrefRecords = csv.parse(fbrefData, {
    columns: true,
    skip_empty_lines: true
});

const allMatchesRecords = csv.parse(allMatchesData, {
    columns: true,
    skip_empty_lines: true
});

// Team name mapping (FBref name -> all-matches name)
const teamNameMapping = {
    "Nott'ham Forest": "Nottingham Forest",
    "Sheffield Utd": "Sheffield United",
    "Newcastle Utd": "Newcastle",
    // Add other mappings here if needed
};

// Function to get the mapped team name
const getMappedTeamName = (name) => {
    return teamNameMapping[name] || name; // Return mapped name or original if no mapping exists
};

// Create a map of matches from all-matches.csv for easy lookup
const allMatchesMap = new Map();
allMatchesRecords.forEach(record => {
    const key = `${record.date}_${record.home}_${record.away}`;
    allMatchesMap.set(key, record);
});

// Merge the data
const mergedData = fbrefRecords.map(fbrefRecord => {
    const date = fbrefRecord.Date;
    // Apply mapping to team names
    const homeTeam = getMappedTeamName(fbrefRecord.HomeTeam);
    const awayTeam = getMappedTeamName(fbrefRecord.AwayTeam);
    const key = `${date}_${homeTeam}_${awayTeam}`;
    
    const allMatchesRecord = allMatchesMap.get(key);
    
    if (allMatchesRecord) {
        return {
            ...fbrefRecord,
            id: allMatchesRecord.id,
            isVoid: allMatchesRecord.isVoid,
            htScore: allMatchesRecord.htScore,
            score: allMatchesRecord.score,
            homeScore: allMatchesRecord.homeScore,
            awayScore: allMatchesRecord.awayScore,
            line: allMatchesRecord.line,
            hiLo: allMatchesRecord.hiLo,
            'hkjc-had-cut': allMatchesRecord['hkjc-had-cut'],
            'hkjc-oe-cut': allMatchesRecord['hkjc-oe-cut'],
            'hkjc-ah-cut': allMatchesRecord['hkjc-ah-cut'],
            'hkjc-ah': allMatchesRecord['hkjc-ah'],
            'hkjc-real-ah': allMatchesRecord['hkjc-real-ah'],
            'hkjc-ah-accuracy': allMatchesRecord['hkjc-ah-accuracy'],
            'hkjc-team-ah': allMatchesRecord['hkjc-team-ah'],
            'hkjcVsPublic-result': allMatchesRecord['hkjcVsPublic-result'],
            result: allMatchesRecord.result,
            'ah-result': allMatchesRecord['ah-result'],
            oe: allMatchesRecord.oe,
            'odds-correctScore': allMatchesRecord['odds-correctScore'],
            'odds-had': allMatchesRecord['odds-had'],
            'odds-oddsEven': allMatchesRecord['odds-oddsEven'],
            'odds-ah': allMatchesRecord['odds-ah'],
            'odds-ah-home': allMatchesRecord['odds-ah-home'],
            'odds-ah-away': allMatchesRecord['odds-ah-away'],
            'hkjc-ah-bet-100-home': allMatchesRecord['hkjc-ah-bet-100-home'],
            'hkjc-ah-bet-100-away': allMatchesRecord['hkjc-ah-bet-100-away']
        };
    }
    
    return fbrefRecord;
});

// Write the merged data to a new CSV file
const output = stringify(mergedData, {
    header: true,
    columns: Object.keys(mergedData[0])
});

fs.writeFileSync(path.join(__dirname, 'parsed', 'merged_data.csv'), output);

console.log('Data merged successfully!'); 