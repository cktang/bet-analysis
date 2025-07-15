import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, BrowserContext, Page } from 'playwright';
import { hkjc_login, hkjc_logout } from '../../parsers/others/hkjc-util.js';

export interface BrowserConfig {
  headless: boolean;
  timeout: number;
  userDataDir: string;
  debuggingPort: number;
  userAgent: string;
}

export interface HKJCCredentials {
  username: string;
  password: string;
  answers: Record<string, string>;
}

@Injectable()
export class SharedBrowserService {
  private browserInstances: Map<string, BrowserContext> = new Map();
  private pageInstances: Map<string, Page> = new Map();
  private loginStates: Map<string, boolean> = new Map();

  constructor(private configService: ConfigService) {}

  /**
   * Get or create a browser instance for a specific service
   */
  async getBrowserInstance(serviceName: string, config: BrowserConfig): Promise<BrowserContext> {
    if (this.browserInstances.has(serviceName)) {
      return this.browserInstances.get(serviceName)!;
    }

    // Ensure user data directory exists
    const fs = require('fs');
    if (!fs.existsSync(config.userDataDir)) {
      fs.mkdirSync(config.userDataDir, { recursive: true });
    }

    console.log(`🚀 Creating ISOLATED browser for ${serviceName} (port ${config.debuggingPort})...`);

    const browser = await chromium.launchPersistentContext(config.userDataDir, {
      headless: config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        `--remote-debugging-port=${config.debuggingPort}`,
        `--user-agent=${config.userAgent}`,
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--force-device-scale-factor=1'
      ],
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      acceptDownloads: false,
      bypassCSP: true,
      timeout: config.timeout
    });

    this.browserInstances.set(serviceName, browser);
    console.log(`✅ Browser instance created for ${serviceName}`);
    return browser;
  }

  /**
   * Get or create a page instance for a specific service
   */
  async getPageInstance(serviceName: string, config: BrowserConfig): Promise<Page> {
    if (this.pageInstances.has(serviceName)) {
      return this.pageInstances.get(serviceName)!;
    }

    const browser = await this.getBrowserInstance(serviceName, config);
    
    // Use the default page from persistent context or create a new one
    const pages = browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    
    await page.setExtraHTTPHeaders({
      'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ${config.userAgent}-Isolated`
    });
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    this.pageInstances.set(serviceName, page);
    console.log(`✅ Page instance created for ${serviceName}`);
    return page;
  }

  /**
   * Login to HKJC using shared utility
   */
  async loginToHKJC(serviceName: string, credentials: HKJCCredentials): Promise<void> {
    const page = this.pageInstances.get(serviceName);
    if (!page) {
      throw new Error(`No page instance found for ${serviceName}`);
    }

    console.log(`🔐 Logging into HKJC for ${serviceName}...`);
    await hkjc_login(page, credentials);
    this.loginStates.set(serviceName, true);
    console.log(`✅ Successfully logged into HKJC for ${serviceName}`);
  }

  /**
   * Logout from HKJC using shared utility
   */
  async logoutFromHKJC(serviceName: string): Promise<void> {
    const page = this.pageInstances.get(serviceName);
    if (!page || !this.loginStates.get(serviceName)) {
      return;
    }

    console.log(`🔐 Logging out from HKJC for ${serviceName}...`);
    await hkjc_logout(page);
    this.loginStates.set(serviceName, false);
    console.log(`✅ Successfully logged out from HKJC for ${serviceName}`);
  }

  /**
   * Check if service is logged in
   */
  isLoggedIn(serviceName: string): boolean {
    return this.loginStates.get(serviceName) || false;
  }

  /**
   * Get HKJC credentials from config
   */
  getHKJCCredentials(): HKJCCredentials {
    const username = this.configService.get('HKJC_USERNAME');
    const password = this.configService.get('HKJC_PASSWORD');
    const securityAnswers = this.configService.get('HKJC_SECURITY_ANSWERS');
    
    if (!username || !password || !securityAnswers) {
      throw new Error('HKJC credentials not configured');
    }
    
    let answersMap: any;
    try {
      answersMap = typeof securityAnswers === 'string' ? JSON.parse(securityAnswers) : securityAnswers;
    } catch (jsonError: any) {
      throw new Error(`Invalid HKJC_SECURITY_ANSWERS format - must be valid JSON string: ${jsonError.message}`);
    }
    
    return { username, password, answers: answersMap };
  }

  /**
   * Clean up browser instance for a specific service
   */
  async cleanupService(serviceName: string): Promise<void> {
    // Logout first if logged in
    if (this.isLoggedIn(serviceName)) {
      await this.logoutFromHKJC(serviceName);
    }

    // Close page
    const page = this.pageInstances.get(serviceName);
    if (page) {
      await page.close();
      this.pageInstances.delete(serviceName);
    }

    // Close browser
    const browser = this.browserInstances.get(serviceName);
    if (browser) {
      await browser.close();
      this.browserInstances.delete(serviceName);
    }

    this.loginStates.delete(serviceName);
    console.log(`🧹 Cleaned up browser instance for ${serviceName}`);
  }

  /**
   * Clean up all browser instances
   */
  async cleanup(): Promise<void> {
    const services = Array.from(this.browserInstances.keys());
    
    for (const service of services) {
      await this.cleanupService(service);
    }
    
    console.log('🧹 All browser instances cleaned up');
  }

  /**
   * Get status of all browser instances
   */
  getStatus(): any {
    return {
      services: Array.from(this.browserInstances.keys()),
      loginStates: Object.fromEntries(this.loginStates),
      totalInstances: this.browserInstances.size
    };
  }
}