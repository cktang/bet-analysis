const fs = require('fs');
const path = require('path');

function compareStrategies() {
    console.log('🔍 STRATEGY COMPARISON ANALYSIS');
    console.log('================================');
    
    try {
        // Load Single_earlySeasonConfusion results
        const confusionPath = path.join(__dirname, 'results/Single_earlySeasonConfusion_betting_records.json');
        const confusionData = JSON.parse(fs.readFileSync(confusionPath, 'utf8'));
        
        // Load our current away team strategy results
        const awayPath = path.join(__dirname, 'all_away_team_early_season_variable_stake_results.json');
        const awayData = JSON.parse(fs.readFileSync(awayPath, 'utf8'));
        
        console.log('\n📊 SUMMARY COMPARISON:');
        console.log('=====================');
        console.log(`Single_earlySeasonConfusion:`);
        console.log(`  - Total Bets: ${confusionData.summary.totalBets}`);
        console.log(`  - Total Staked: $${confusionData.summary.totalStaked?.toLocaleString() || 'N/A'}`);
        console.log(`  - Total Profit: $${confusionData.summary.totalProfit?.toLocaleString() || 'N/A'}`);
        console.log(`  - ROI: ${confusionData.summary.roi}`);
        console.log(`  - Win Rate: ${confusionData.summary.winRate}`);
        
        console.log(`\nAway Team Strategy:`);
        console.log(`  - Total Bets: ${awayData.summary.totalBets}`);
        console.log(`  - Total Staked: $${parseFloat(awayData.summary.totalStaked).toLocaleString()}`);
        console.log(`  - Total Profit: $${parseFloat(awayData.summary.totalProfit).toLocaleString()}`);
        console.log(`  - ROI: ${awayData.summary.totalROI}%`);
        console.log(`  - Win Rate: ${awayData.summary.winRate}%`);
        
        // Compare specific matches
        console.log('\n🔍 MATCH-BY-MATCH COMPARISON:');
        console.log('============================');
        
        // Get first few matches from each strategy
        const confusionMatches = confusionData.bettingRecords?.slice(0, 10) || [];
        const awayMatches = [];
        
        // Extract matches from our strategy
        Object.values(awayData.weeklyBreakdown).forEach(week => {
            if (week.matches) {
                awayMatches.push(...week.matches);
            }
        });
        
        console.log(`\nSingle_earlySeasonConfusion (first 10 matches):`);
        confusionMatches.forEach((match, index) => {
            console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} ${match.score}`);
            console.log(`   Handicap: ${match.handicapLine} @ ${match.betOdds} | Stake: $${match.betSize} | ${match.outcome} | ${match.profit >= 0 ? '+' : ''}$${match.profit}`);
        });
        
        console.log(`\nAway Team Strategy (first 10 matches):`);
        awayMatches.slice(0, 10).forEach((match, index) => {
            console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} ${match.homeScore}-${match.awayScore}`);
            console.log(`   Handicap: ${match.handicap} @ ${match.odds} | Stake: $${match.betSize} | ${match.outcome} | ${match.profit}`);
        });
        
        // Find common matches
        console.log('\n🎯 COMMON MATCHES ANALYSIS:');
        console.log('===========================');
        
        let commonMatches = 0;
        let profitDifferences = [];
        
        confusionMatches.forEach(confusionMatch => {
            const commonMatch = awayMatches.find(awayMatch => 
                awayMatch.homeTeam === confusionMatch.homeTeam && 
                awayMatch.awayTeam === confusionMatch.awayTeam
            );
            
            if (commonMatch) {
                commonMatches++;
                const confusionProfit = parseFloat(confusionMatch.profit);
                const awayProfit = parseFloat(commonMatch.profit);
                const difference = confusionProfit - awayProfit;
                profitDifferences.push(difference);
                
                console.log(`Match: ${confusionMatch.homeTeam} vs ${confusionMatch.awayTeam}`);
                console.log(`  Confusion: $${confusionProfit} | Away: $${awayProfit} | Diff: ${difference >= 0 ? '+' : ''}$${difference.toFixed(2)}`);
                console.log(`  Confusion Stake: $${confusionMatch.betSize} @ ${confusionMatch.betOdds} | Away Stake: $${commonMatch.betSize} @ ${commonMatch.odds}`);
                console.log(`  Confusion Handicap: ${confusionMatch.handicapLine} | Away Handicap: ${commonMatch.handicap}`);
                console.log('');
            }
        });
        
        console.log(`\n📈 ANALYSIS SUMMARY:`);
        console.log(`===================`);
        console.log(`Common matches found: ${commonMatches}`);
        
        if (profitDifferences.length > 0) {
            const avgDifference = profitDifferences.reduce((sum, diff) => sum + diff, 0) / profitDifferences.length;
            console.log(`Average profit difference: ${avgDifference >= 0 ? '+' : ''}$${avgDifference.toFixed(2)} (Confusion vs Away)`);
        }
        
        // Check for potential causes
        console.log('\n🔧 POTENTIAL CAUSES:');
        console.log('====================');
        console.log('1. Different staking calculations');
        console.log('2. Different handicap interpretation (home vs away perspective)');
        console.log('3. Different outcome calculation logic');
        console.log('4. Different data filtering criteria');
        console.log('5. Different bet sizing parameters');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Run the comparison
compareStrategies(); 