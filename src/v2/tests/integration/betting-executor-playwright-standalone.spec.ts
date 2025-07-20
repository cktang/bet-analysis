import { chromium, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { hkjc_login } from '../../../utils/hkjc-util.js';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { ConfigService } from '@nestjs/config';
import { DataFileService } from '../../core/data-file.service';

describe('BettingExecutorService Playwright Standalone Test', () => {
  let browser: BrowserContext;
  let page: Page;
  let bettingExecutorService: BettingExecutorService;
  let configService: ConfigService;
  let dataFileService: DataFileService;

  // Mock betting decision for testing
  const mockBettingDecision = {
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
  };

  beforeAll(async () => {
    console.log('🚀 Starting Playwright standalone test setup...');
    
    // Load HKJC credentials
    const configPath = path.join(process.cwd(), 'config', 'live-betting.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const credentials = config.hkjcCredentials;

    console.log('📋 Loaded HKJC credentials');

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
    console.log(`🌐 Launching browser with session: ${userDataDir}`);
    
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
    // Inject the page into the service using the proper method
    bettingExecutorService.setPage(page);
    
    console.log('✅ Test setup completed');
  }, 120000); // 2 minute timeout for setup

  afterAll(async () => {
    console.log('🧹 Cleaning up test resources...');
    if (browser) {
      await browser.close();
    }
    console.log('✅ Cleanup completed');
  });

  it('should place a HOME bet using actual BettingExecutorService', async () => {
    console.log(`🎯 Testing HOME bet placement: ${mockBettingDecision.matchId} - $${mockBettingDecision.stakeAmount}`);

    // Navigate to HKJC football page
    await page.goto('https://bet.hkjc.com/en/football/home');
    await page.waitForTimeout(2000);

    // Use the actual BettingExecutorService to place the bet
    const result = await bettingExecutorService.executeBet(mockBettingDecision);

    // Verify the result
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.betId).toBe(mockBettingDecision.id);
    expect(result.betSide).toBe(mockBettingDecision.betSide);
    expect(result.stakeAmount).toBe(mockBettingDecision.stakeAmount);

    console.log('✅ HOME bet placed successfully using BettingExecutorService');
  }, 60000);

  it('should verify login status', async () => {
    console.log('🔍 Verifying login status...');
    
    // Check if we're logged in by looking for user-specific elements
    await page.goto('https://bet.hkjc.com/en/football/home');
    await page.waitForTimeout(2000);

    // Look for elements that indicate we're logged in
    const isLoggedIn = await page.locator('.user-info, .account-info, [data-testid="user-menu"]').count() > 0;
    expect(isLoggedIn).toBe(true);
    
    console.log('✅ Login status verified');
  }, 30000);
}); 