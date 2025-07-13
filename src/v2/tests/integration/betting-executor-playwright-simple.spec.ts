import { chromium, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { hkjc_login, hkjc_logout } from '../../../parsers/others/hkjc-util.js';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { ConfigService } from '@nestjs/config';
import { DataFileService } from '../../core/data-file.service';

describe('HKJC login test', () => {
  let browser: BrowserContext;
  let page: Page;
  let bettingExecutorService: BettingExecutorService;
  let configService: ConfigService;
  let dataFileService: DataFileService;

  beforeAll(async () => {
    console.log('🚀 Starting Playwright simple test setup...');
    
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

    await hkjc_logout(page);
  });

  it('should successfully login to HKJC', async () => {
    console.log('🔍 Verifying login status...');
    
    // Navigate to HKJC football page
    await page.goto('https://bet.hkjc.com/en/football/home');
    await page.waitForTimeout(3000);

    // Look for logout button which indicates successful login
    const logoutButton = await page.locator('text=Logout').count();
    // If logout button not found, check for other login indicators
    if (logoutButton === 0) {
      const userMenu = await page.locator('.user-menu, .account-menu, [data-testid="user-menu"]').count();
      expect(userMenu).toBeGreaterThan(0);
    } else {
      expect(logoutButton).toBeGreaterThan(0);
    }
    
    console.log('✅ Login status verified - logout button found');
  }, 30000);

}); 