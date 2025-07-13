import { Injectable } from '@nestjs/common';
import { DataFileService } from './data-file.service';

@Injectable()
export class MockDataFileService extends DataFileService {
  // Mock strategy data - only thing we need to override
  private mockStrategies = [
    {
      name: "Mock-Strategy-Home",
      side: { betSide: "home" },
      size: { expression: "200", stakingMethod: "fixed" }, // 200 is HKJC minimum
      factors: [
        {
          key: "mock",
          expression: "parseInt(matchId.replace('FB', '')) % 2 === 1", // Odd match IDs
          description: "Mock factor for odd match IDs"
        }
      ],
      performance: { roi: 10.0, totalBets: 100, winRate: 55.0, totalProfit: 1000 }
    },
    {
      name: "Mock-Strategy-Away", 
      side: { betSide: "away" },
      size: { expression: "200", stakingMethod: "fixed" },
      factors: [
        {
          key: "mock",
          expression: "parseInt(matchId.replace('FB', '')) % 2 === 0", // Even match IDs
          description: "Mock factor for even match IDs"
        }
      ],
      performance: { roi: 10.0, totalBets: 100, winRate: 55.0, totalProfit: 1000 }
    }
  ];

  // 🎭 OVERRIDE: Only strategies are mocked, everything else uses parent methods
  async getStrategies() {
    console.log(`🎭 MockDataFileService: Returning ${this.mockStrategies.length} mock strategies`);
    return this.mockStrategies;
  }

  // 🎭 OVERRIDE: Mock logging - just console instead of file
  async writeLog(level: 'info' | 'error' | 'warn', message: string): Promise<void> {
    console.log(`🎭 MockDataFileService: [${level.toUpperCase()}] ${message}`);
  }

  // 🎭 OVERRIDE: Browser Configuration - visible in mock mode
  getBrowserConfig() {
    return {
      headless: false, // 🎭 MOCK MODE: Browser visible for testing
    };
  }

  // 🎭 OVERRIDE: System Configuration - mock settings
  getSystemConfig() {
    return {
      browser: this.getBrowserConfig(),
      mockMode: true,
      enableLiveBetting: true,
      enablePaperTrading: false,
    };
  }

  // 🎭 OVERRIDE: HKJC URLs Configuration - relaxed timeouts for demo
  getHKJCUrls() {
    return {
      url: 'https://bet.hkjc.com/en/football/hdc',  // Base URL - works well for demo
      mockMode: true,
      timeout: 30000, // 30 seconds timeout for demo
      retryAttempts: 2, // Try URL twice before giving up
      description: 'HKJC URLs for odds monitoring - mock mode uses demo URLs with relaxed timeouts'
    };
  }

  // All other methods (readFile, writeFile, getFixtures, etc.) inherit from DataFileService
}