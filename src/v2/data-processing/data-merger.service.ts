import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataMergerService {
  private isRunning = false;

  async onModuleInit() {
    console.log('🔄 Data Merger Service initialized');
  }

  @Cron('0 0 */1 * * *') // Every hour
  async processNewData() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Starting data merger processing...');
    
    try {
      await this.mergeFootballData();
      console.log('✅ Data merger processing completed');
    } catch (error) {
      console.error('❌ Data merger failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async mergeFootballData() {
    const currentSeason = this.getCurrentSeason();
    console.log(`🎯 Processing data for season ${currentSeason}`);
    
    // Load existing processed data
    const processedPath = path.join(process.cwd(), 'data', 'processed', `year-${currentSeason}.json`);
    let processedData = [];
    
    if (fs.existsSync(processedPath)) {
      processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
    }

    // Load new match data from organized matches
    const matchesDir = path.join(process.cwd(), 'data', 'matches-organized');
    const matchFiles = fs.readdirSync(matchesDir).filter(file => file.endsWith('.json'));

    let newMatches = 0;
    
    for (const file of matchFiles) {
      const matchPath = path.join(matchesDir, file);
      const matchData = JSON.parse(fs.readFileSync(matchPath, 'utf8'));
      
      // Check if match already exists
      const existingMatch = processedData.find(m => 
        m.homeTeam === matchData.homeTeam && 
        m.awayTeam === matchData.awayTeam &&
        m.date === matchData.date
      );
      
      if (!existingMatch) {
        // Process and add new match
        const processedMatch = this.processMatchData(matchData);
        processedData.push(processedMatch);
        newMatches++;
      }
    }

    // Generate timeSeries for all teams
    const teams = [...new Set(processedData.flatMap(m => [m.homeTeam, m.awayTeam]))];
    
    for (const match of processedData) {
      match.timeSeries = this.generateTimeSeries(match, processedData, teams);
    }

    // Save updated processed data
    await fs.promises.writeFile(processedPath, JSON.stringify(processedData, null, 2));
    console.log(`📊 Processed ${newMatches} new matches for ${currentSeason}`);
  }

  private processMatchData(matchData: any) {
    return {
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      date: matchData.date,
      homeScore: matchData.homeScore,
      awayScore: matchData.awayScore,
      handicap: matchData.handicap || 0,
      homeOdds: matchData.homeOdds || 1.0,
      awayOdds: matchData.awayOdds || 1.0,
      season: this.getCurrentSeason(),
      processed: true,
      processedAt: Date.now()
    };
  }

  private generateTimeSeries(match: any, allMatches: any[], teams: string[]) {
    const matchDate = new Date(match.date);
    const previousMatches = allMatches.filter(m => new Date(m.date) < matchDate);
    
    const timeSeries: any = {};
    
    // Generate time series for each team
    for (const team of teams) {
      const teamMatches = previousMatches.filter(m => 
        m.homeTeam === team || m.awayTeam === team
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      timeSeries[team] = {
        position: this.calculatePosition(team, teamMatches),
        form: this.calculateForm(team, teamMatches),
        goals: this.calculateGoals(team, teamMatches),
        matches: teamMatches.length
      };
    }
    
    return timeSeries;
  }

  private calculatePosition(team: string, matches: any[]) {
    let points = 0;
    let goalDiff = 0;
    
    for (const match of matches) {
      if (match.homeTeam === team) {
        if (match.homeScore > match.awayScore) points += 3;
        else if (match.homeScore === match.awayScore) points += 1;
        goalDiff += match.homeScore - match.awayScore;
      } else {
        if (match.awayScore > match.homeScore) points += 3;
        else if (match.awayScore === match.homeScore) points += 1;
        goalDiff += match.awayScore - match.homeScore;
      }
    }
    
    return { points, goalDiff, played: matches.length };
  }

  private calculateForm(team: string, matches: any[]) {
    const recent = matches.slice(-5);
    const form = recent.map(match => {
      if (match.homeTeam === team) {
        return match.homeScore > match.awayScore ? 'W' : 
               match.homeScore === match.awayScore ? 'D' : 'L';
      } else {
        return match.awayScore > match.homeScore ? 'W' : 
               match.awayScore === match.homeScore ? 'D' : 'L';
      }
    });
    
    return form.join('');
  }

  private calculateGoals(team: string, matches: any[]) {
    let scored = 0;
    let conceded = 0;
    
    for (const match of matches) {
      if (match.homeTeam === team) {
        scored += match.homeScore;
        conceded += match.awayScore;
      } else {
        scored += match.awayScore;
        conceded += match.homeScore;
      }
    }
    
    return { scored, conceded, average: matches.length > 0 ? scored / matches.length : 0 };
  }

  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Season runs from August to May
    if (month >= 7) { // August onwards
      return `${year}-${year + 1}`;
    } else { // January to July
      return `${year - 1}-${year}`;
    }
  }

  async manualProcessData() {
    console.log('🔄 Manual data processing triggered');
    await this.processNewData();
  }
}