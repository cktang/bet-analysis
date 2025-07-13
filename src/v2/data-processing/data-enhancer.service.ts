import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataEnhancerService {
  private isRunning = false;

  async onModuleInit() {
    console.log('✨ Data Enhancer Service initialized');
  }

  @Cron('0 30 */2 * * *') // Every 2 hours at 30 minutes past
  async enhanceProcessedData() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('✨ Starting data enhancement...');
    
    try {
      await this.enhanceCurrentSeason();
      console.log('✅ Data enhancement completed');
    } catch (error) {
      console.error('❌ Data enhancement failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async enhanceCurrentSeason() {
    const currentSeason = this.getCurrentSeason();
    console.log(`🎯 Enhancing data for season ${currentSeason}`);
    
    // Load processed data
    const processedPath = path.join(process.cwd(), 'data', 'processed', `year-${currentSeason}.json`);
    if (!fs.existsSync(processedPath)) {
      console.log(`No processed data found for ${currentSeason}`);
      return;
    }
    
    const processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
    
    // Load FBRef incidents
    const incidentsDir = path.join(process.cwd(), 'data', 'fbref-incidents');
    let fbrefData = [];
    
    if (fs.existsSync(incidentsDir)) {
      const incidentFiles = fs.readdirSync(incidentsDir).filter(file => file.endsWith('.json'));
      fbrefData = incidentFiles.map(file => {
        const filePath = path.join(incidentsDir, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      });
    }
    
    // Enhance each match
    const enhancedData = processedData.map(match => this.enhanceMatch(match, fbrefData));
    
    // Save enhanced data
    const enhancedPath = path.join(process.cwd(), 'data', 'enhanced', `year-${currentSeason}-enhanced.json`);
    await fs.promises.writeFile(enhancedPath, JSON.stringify(enhancedData, null, 2));
    
    console.log(`✨ Enhanced ${enhancedData.length} matches for ${currentSeason}`);
  }

  private enhanceMatch(match: any, fbrefData: any[]) {
    // Find matching FBRef data
    const fbrefMatch = fbrefData.find(fb => 
      fb.homeTeam === match.homeTeam && 
      fb.awayTeam === match.awayTeam &&
      this.isSameDate(fb.date, match.date)
    );
    
    const enhanced = {
      ...match,
      enhanced: !!fbrefMatch,
      enhancedAt: Date.now()
    };
    
    if (fbrefMatch) {
      // Calculate enhancement metrics
      enhanced.matchCleanlinessScore = this.calculateCleanlinessScore(fbrefMatch.incidents);
      enhanced.cardDisciplineIndex = this.calculateCardDisciplineIndex(fbrefMatch.incidents);
      enhanced.goalTimingAnalysis = this.calculateGoalTiming(fbrefMatch.incidents);
      enhanced.substitutionPatterns = this.calculateSubstitutionPatterns(fbrefMatch.incidents);
      enhanced.incidentDensity = this.calculateIncidentDensity(fbrefMatch.incidents);
      enhanced.fbrefIncidents = fbrefMatch.incidents;
    } else {
      // Default values for non-enhanced matches
      enhanced.matchCleanlinessScore = 0.5;
      enhanced.cardDisciplineIndex = 0.5;
      enhanced.goalTimingAnalysis = { early: 0, late: 0 };
      enhanced.substitutionPatterns = { tactical: 0, injury: 0 };
      enhanced.incidentDensity = 0.5;
    }
    
    return enhanced;
  }

  private calculateCleanlinessScore(incidents: any[]): number {
    if (!incidents || incidents.length === 0) return 0.5;
    
    const totalIncidents = incidents.length;
    const cardIncidents = incidents.filter(i => 
      i.action?.includes('Yellow') || i.action?.includes('Red')
    ).length;
    
    const penaltyIncidents = incidents.filter(i => 
      i.action?.includes('Penalty')
    ).length;
    
    // Lower score = cleaner match
    const cleanlinessScore = Math.max(0, 1 - (cardIncidents + penaltyIncidents * 2) / totalIncidents);
    return Math.round(cleanlinessScore * 100) / 100;
  }

  private calculateCardDisciplineIndex(incidents: any[]): number {
    if (!incidents || incidents.length === 0) return 0.5;
    
    const yellowCards = incidents.filter(i => i.action?.includes('Yellow')).length;
    const redCards = incidents.filter(i => i.action?.includes('Red')).length;
    
    // Higher score = more disciplined (fewer cards)
    const disciplineScore = Math.max(0, 1 - (yellowCards + redCards * 3) / 10);
    return Math.round(disciplineScore * 100) / 100;
  }

  private calculateGoalTiming(incidents: any[]): any {
    if (!incidents || incidents.length === 0) return { early: 0, late: 0 };
    
    const goals = incidents.filter(i => i.action?.includes('Goal') && i.minute);
    const earlyGoals = goals.filter(g => g.minute <= 30).length;
    const lateGoals = goals.filter(g => g.minute >= 70).length;
    
    return { early: earlyGoals, late: lateGoals };
  }

  private calculateSubstitutionPatterns(incidents: any[]): any {
    if (!incidents || incidents.length === 0) return { tactical: 0, injury: 0 };
    
    const substitutions = incidents.filter(i => i.action?.includes('Substitution'));
    const tacticalSubs = substitutions.filter(s => s.minute >= 60).length;
    const injurySubs = substitutions.filter(s => s.minute < 60).length;
    
    return { tactical: tacticalSubs, injury: injurySubs };
  }

  private calculateIncidentDensity(incidents: any[]): number {
    if (!incidents || incidents.length === 0) return 0.5;
    
    // Normalize incident density to 0-1 scale
    const density = Math.min(1, incidents.length / 20);
    return Math.round(density * 100) / 100;
  }

  private isSameDate(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
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

  async manualEnhanceData() {
    console.log('✨ Manual data enhancement triggered');
    await this.enhanceProcessedData();
  }
}