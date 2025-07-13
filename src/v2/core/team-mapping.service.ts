import { Injectable } from '@nestjs/common';

@Injectable()
export class TeamMappingService {
  
  // EPL team mappings for HKJC (copied from tests but now part of our V2 codebase)
  private readonly eplTeamMappings = {
    'arsenal': 'Arsenal(阿仙奴)',
    'aston villa': 'Aston Villa(阿士東維拉)',
    'bournemouth': 'Bournemouth(般尼茅夫)',
    'brentford': 'Brentford(賓福特)',
    'brighton': 'Brighton(白禮頓)',
    'chelsea': 'Chelsea(車路士)',
    'crystal palace': 'Crystal Palace(水晶宮)',
    'everton': 'Everton(愛華頓)',
    'fulham': 'Fulham(富咸)',
    'ipswich': 'Ipswich(葉士域治)',
    'leicester': 'Leicester(李斯特城)',
    'liverpool': 'Liverpool(利物浦)',
    'manchester city': 'Manchester City(曼城)',
    'manchester utd': 'Manchester Utd(曼聯)',
    'newcastle': 'Newcastle(紐卡素)',
    'nottingham forest': 'Nottingham Forest(諾定咸森林)',
    'southampton': 'Southampton(修咸頓)',
    'tottenham': 'Tottenham(熱刺)',
    'west ham': 'West Ham(韋斯咸)',
    'wolves': 'Wolves(狼隊)',
  };

  private readonly eplTeamList = [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich',
    'Leicester', 'Liverpool', 'Manchester City', 'Manchester Utd',
    'Newcastle', 'Nottingham Forest', 'Southampton', 'Tottenham',
    'West Ham', 'Wolves'
  ];

  getHkjcTeamMappings(): Record<string, string> {
    return { ...this.eplTeamMappings };
  }

  getEplTeamList(): string[] {
    return [...this.eplTeamList];
  }

  isEplTeam(teamName: string): boolean {
    return this.eplTeamList.some(team => 
      teamName.toLowerCase().includes(team.toLowerCase()) ||
      team.toLowerCase().includes(teamName.toLowerCase())
    );
  }

  normalizeTeamName(teamName: string): string {
    // Normalize team names for consistency
    const normalized = teamName.trim().toLowerCase();
    
    const mappings = {
      'man city': 'manchester city',
      'man utd': 'manchester utd',
      'man united': 'manchester utd',
      'tottenham hotspur': 'tottenham',
      'spurs': 'tottenham',
      'west ham united': 'west ham',
      'wolves': 'wolves',
      'wolverhampton': 'wolves',
      'nottingham forest': 'nottingham forest',
      'forest': 'nottingham forest'
    };

    return mappings[normalized] || normalized;
  }

  getTeamSearchKey(teamName: string): string | null {
    const normalized = this.normalizeTeamName(teamName);
    
    for (const [key, value] of Object.entries(this.eplTeamMappings)) {
      if (key === normalized || value.toLowerCase().includes(normalized)) {
        return key;
      }
    }
    
    return null;
  }
}