import { chromium, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { hkjc_login, hkjc_logout } from '../../../parsers/others/hkjc-util.js';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { ConfigService } from '@nestjs/config';
import { DataFileService } from '../../core/data-file.service';

describe('BettingExecutorService Playwright Advanced Integration Tests', () => {
  let browser: BrowserContext;
  let page: Page;
  let bettingExecutorService: BettingExecutorService;
  let configService: ConfigService;
  let dataFileService: DataFileService;

  // Mock betting decisions for testing
  const mockBettingDecisions = [
    {
      id: 'FB3187',
      matchId: 'FB3187',
      homeTeam: 'Arsenal',
      awayTeam: 'Liverpool',
      betSide: 'home' as const,
      handicap: '-0.5',
      confidence: 0.75,
      stakeAmount: 10,
      expectedOdds: 1.85,
      strategy: 'playwright_test_home',
      timestamp: new Date().toISOString(),
      reasoning: 'Playwright integration test for home bet'
    },
    {
      id: 'FB3188',
      matchId: 'FB3188',
      homeTeam: 'Manchester City',
      awayTeam: 'Chelsea',
      betSide: 'away' as const,
      handicap: '+0.5',
      confidence: 0.80,
      stakeAmount: 15,
      expectedOdds: 2.10,
      strategy: 'playwright_test_away',
      timestamp: new Date().toISOString(),
      reasoning: 'Playwright integration test for away bet'
    }
  ];

  beforeAll(async () => {
    // Load HKJC credentials
    const configPath = path.join(process.cwd(), 'config', 'live-betting.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const credentials = config.hkjcCredentials;

    // Initialize services
    configService = new ConfigService({
      ENABLE_LIVE_BETTING: true,
      ENABLE_PAPER_TRADING: false,
      HEADLESS_BROWSER: false,
      HKJC_USERNAME: credentials.username,
      HKJC_PASSWORD: credentials.password,
      HKJC_SECURITY_ANSWER: credentials.securityAnswer
    });

    dataFileService = new DataFileService();

    // Launch browser with persistent session
    const userDataDir = path.join(process.cwd(), 'data', 'v2', 'browser-session-test');
    browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      slowMo: 1000,
      viewport: { width: 1920, height: 1080 }
    });

    // Use existing page or create new one
    const pages = browser.pages();
    page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Login using hkjc-util
    console.log('🔐 Logging in using hkjc-util...');
    await hkjc_login(page, credentials);
    console.log('✅ Login completed successfully');

    // Initialize BettingExecutorService with the logged-in page
    bettingExecutorService = new BettingExecutorService(configService, dataFileService);
    // Inject the page into the service (we'll need to modify the service to accept this)
    (bettingExecutorService as any).page = page;
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    if (browser) {
      await hkjc_logout(page);
      await browser.close();
    }
  });

  describe('Real Browser Betting Integration', () => {
    it('should place a HOME bet using actual BettingExecutorService', async () => {
      const decision = mockBettingDecisions[0];
      console.log(`🎯 Testing HOME bet placement: ${decision.matchId} - $${decision.stakeAmount}`);

      // Navigate to HKJC football page
      await page.goto('https://bet.hkjc.com/en/football/home');
      await page.waitForTimeout(2000);

      // Use the actual BettingExecutorService to place the bet
      const result = await bettingExecutorService.executeBet(decision);

      // Verify the result
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.betId).toBe(decision.id);
      expect(result.betSide).toBe(decision.betSide);
      expect(result.stakeAmount).toBe(decision.stakeAmount);

      console.log('✅ HOME bet placed successfully using BettingExecutorService');
    }, 30000);

    it('should place an AWAY bet using actual BettingExecutorService', async () => {
      const decision = mockBettingDecisions[1];
      console.log(`🎯 Testing AWAY bet placement: ${decision.matchId} - $${decision.stakeAmount}`);

      // Navigate to HKJC football page
      await page.goto('https://bet.hkjc.com/en/football/home');
      await page.waitForTimeout(2000);

      // Use the actual BettingExecutorService to place the bet
      const result = await bettingExecutorService.executeBet(decision);

      // Verify the result
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.betId).toBe(decision.id);
      expect(result.betSide).toBe(decision.betSide);
      expect(result.stakeAmount).toBe(decision.stakeAmount);

      console.log('✅ AWAY bet placed successfully using BettingExecutorService');
    }, 30000);

    it('should handle multiple bets in sequence', async () => {
      console.log('🎯 Testing multiple bet placement in sequence');

      const results: any[] = [];

      for (const decision of mockBettingDecisions) {
        console.log(`🎯 Processing: ${decision.matchId} - ${decision.betSide} bet`);

        // Navigate to HKJC football page for each bet
        await page.goto('https://bet.hkjc.com/en/football/home');
        await page.waitForTimeout(2000);

        // Use the actual BettingExecutorService
        const result = await bettingExecutorService.executeBet(decision);
        results.push(result);

        // Verify each result
        expect(result.status).toBe('success');
        expect(result.betId).toBe(decision.id);
        expect(result.betSide).toBe(decision.betSide);
      }

      expect(results).toHaveLength(mockBettingDecisions.length);
      console.log('✅ Multiple bets placed successfully');
    }, 60000);

    it('should handle bet placement errors gracefully', async () => {
      const invalidDecision = {
        id: 'INVALID_MATCH',
        matchId: 'INVALID_MATCH',
        homeTeam: 'Invalid Team',
        awayTeam: 'Invalid Team',
        betSide: 'home' as const,
        stakeAmount: 10,
        strategy: 'error_test',
        timestamp: new Date().toISOString(),
        reasoning: 'Testing error handling'
      };

      console.log('🎯 Testing error handling with invalid match');

      // Navigate to HKJC football page
      await page.goto('https://bet.hkjc.com/en/football/home');
      await page.waitForTimeout(2000);

      // This should throw an error or return a failed result
      try {
        const result = await bettingExecutorService.executeBet(invalidDecision);
        // If it doesn't throw, it should return a failed status
        expect(result.status).toBe('failed');
      } catch (error) {
        // Expected error for invalid match
        expect(error).toBeDefined();
        console.log('✅ Error handling working correctly');
      }
    }, 30000);
  });

}); 