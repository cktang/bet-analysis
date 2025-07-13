import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as path from 'path';

@Injectable()
export class DataFileService {
  private readonly dataPath = path.join(process.cwd(), 'data', 'v2');

  async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  async readFile<T>(filename: string): Promise<T[]> {
    try {
      const filePath = path.join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T[];
    } catch (error) {
      // Avoid recursive logging - just console.error for file read failures
      console.error(`Failed to read ${filename}: ${(error as Error).message}`);
      return [];
    }
  }

  async writeFile<T>(filename: string, data: T[]): Promise<void> {
    try {
      const filePath = path.join(this.dataPath, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      await this.writeLog('info', `Updated ${filename} with ${data.length} records`);
    } catch (error) {
      await this.writeLog('error', `Failed to write ${filename}: ${(error as Error).message}`);
    }
  }

  async appendToFile<T>(filename: string, record: T): Promise<void> {
    try {
      const existing = await this.readFile<T>(filename);
      existing.push(record);
      await this.writeFile(filename, existing);
    } catch (error) {
      await this.writeLog('error', `Failed to append to ${filename}: ${(error as Error).message}`);
    }
  }

  async writeLog(level: 'info' | 'error' | 'warn', message: string): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    try {
      const existing = await this.readFile<any>('log.json');
      existing.push(logEntry);
      const filePath = path.join(this.dataPath, 'log.json');
      await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async getFixtures() {
    return this.readFile('fixture.json');
  }

  async setFixtures(fixtures: any[]) {
    await this.writeFile('fixture.json', fixtures);
  }



  async addBetRecord(record: any) {
    // Read existing records, add new one, and write back as proper array
    try {
      let existingRecords = [];
      const betRecordFile = path.join(this.dataPath, 'bet-record.json');
      
      if (fsSync.existsSync(betRecordFile)) {
        const data = fsSync.readFileSync(betRecordFile, 'utf8');
        if (data.trim()) {
          existingRecords = JSON.parse(data);
        }
      }
      
      // Ensure existingRecords is an array
      if (!Array.isArray(existingRecords)) {
        existingRecords = [];
      }
      
      // Add new record
      existingRecords.push(record);
      
      // Write back as proper JSON array
      fsSync.writeFileSync(betRecordFile, JSON.stringify(existingRecords, null, 2));
      
    } catch (error) {
      console.error('❌ Error adding bet record:', error);
      // Fallback to append method
      await this.appendToFile('bet-record.json', record);
    }
  }

  async addBetResult(result: any) {
    await this.appendToFile('bet-result.json', result);
  }

  async addBetDecision(decision: any) {
    await this.appendToFile('betting-decisions.json', decision);
  }





  async getBetRecords() {
    return this.readFile('bet-record.json');
  }

  async getBetResults() {
    return this.readFile('bet-result.json');
  }

  async getStrategies() {
    return this.readFile('strategy.json');
  }

  async setStrategies(strategies: any[]) {
    await this.writeFile('strategy.json', strategies);
  }

  async getBetDecisions() {
    return this.readFile('betting-decisions.json');
  }

  async setBetDecisions(decisions: any[]) {
    await this.writeFile('betting-decisions.json', decisions);
  }

  async getBetPendingDecisions() {
    return this.readFile('bet-pending-decision.json');
  }

  async setBetPendingDecisions(decisions: any[]) {
    await this.writeFile('bet-pending-decision.json', decisions);
  }

  async getLogs() {
    return this.readFile('log.json');
  }

  // 🎯 Browser Configuration Control
  getBrowserConfig() {
    return {
      headless: true, // 🎯 REAL MODE: Browser headless for production
    };
  }

  // 🎯 System Configuration Control
  getSystemConfig() {
    return {
      browser: this.getBrowserConfig(),
      mockMode: false,
      enableLiveBetting: true,
      enablePaperTrading: false,
    };
  }

  // 🎯 HKJC URLs Configuration
  getHKJCUrls() {
    return {
      // 🎯 REAL MODE: Use production URLs
      url: 'https://bet.hkjc.com/en/football/hdc?tournid=50000051',  // Specific tournament
      mockMode: false,
      timeout: 15000, // 15 seconds timeout for production
      retryAttempts: 1, // Try each URL once in production
      description: 'HKJC URLs for odds monitoring - production mode uses live URLs with strict timeouts'
    };
  }
}