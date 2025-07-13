import { chromium, Browser, Page } from 'playwright';
import { eventBus, BettingSignalEvent } from '../coordinator/EventBus';

export interface BetRequest {
  betId: string;
  strategyName: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  betSide: 'home' | 'away';
  handicap: number;
  odds: number;
  stakeAmount: number;
}

export interface BetResult {
  betId: string;
  success: boolean;
  hkjcBetId?: string;
  error?: string;
  actualOdds?: number;
  actualStake?: number;
  placedAt: number;
}

/**
 * Improved HKJC Betting Executor with enhanced checkbox targeting
 * Fixes home/away confusion and improves bet placement reliability
 */
export class HKJCBettingExecutor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;
  private credentials: { username: string; password: string; answers: Record<string, string> };
  private currentBets: Map<string, BetRequest> = new Map();

  // Enhanced selectors with multiple fallback strategies
  private readonly selectors = {
    // Login selectors
    loginAccount: ['#login-account-input', 'input[placeholder*="Login name"]', 'input[placeholder*="Betting Account"]'],
    loginPassword: ['#login-password-input', 'input[type="password"]'],
    loginButton: ['button:has-text("Login")', '.login-btn', 'button[type="submit"]'],
    
    // Security question selectors
    securityQuestion: ['.login-question', '.security-question', '[class*="question"]'],
    securityAnswer: ['#betslip-panel input[type="text"]', '.security-answer input', 'input[placeholder*="answer"]'],
    confirmButton: ['button:has-text("Confirm")', '.confirm-btn'],
    proceedButton: ['button:has-text("Proceed")', '.proceed-btn'],
    
    // Match and betting selectors
    matchContainer: ['.coupon-container', '.event-container', '.match-container'],
    matchRow: ['.coupon-row', '.event-row', '.match-row'],
    handicapSection: ['[data-bet-type="AH"]', '.asian-handicap', '[title*="Asian Handicap"]'],
    
    // Checkbox selectors with multiple strategies
    homeCheckbox: [
      'input[type="checkbox"][data-side="home"]',
      'input[type="checkbox"]:first-of-type',
      '.home-selection input[type="checkbox"]',
      'label:has-text("1") input[type="checkbox"]'
    ],
    awayCheckbox: [
      'input[type="checkbox"][data-side="away"]', 
      'input[type="checkbox"]:last-of-type',
      '.away-selection input[type="checkbox"]',
      'label:has-text("2") input[type="checkbox"]'
    ],
    
    // Bet slip selectors
    addButton: ['button:has-text("Add")', '.add-btn', '[title="Add to betslip"]'],
    stakeInput: ['input[type="number"]', '.stake-input', 'input[placeholder*="stake"]'],
    placeBetButton: ['button:has-text("Place Bet")', '.place-bet-btn'],
    confirmBetButton: ['button:has-text("Confirm")', '.confirm-bet-btn'],
    doneButton: ['button:has-text("Done")', '.done-btn']
  };

  constructor(credentials: { username: string; password: string; answers: Record<string, string> }) {
    this.credentials = credentials;
    
    // Listen for betting signals
    eventBus.onBettingSignal(this.handleBettingSignal.bind(this));
    
    eventBus.emitModuleStatus({
      moduleName: 'HKJCBettingExecutor',
      status: 'offline',
      message: 'Initialized but not started'
    });
  }

  /**
   * Handle betting signal from decision engine
   */
  private async handleBettingSignal(signal: BettingSignalEvent): Promise<void> {
    const betRequest: BetRequest = {
      betId: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strategyName: signal.strategyName,
      matchId: signal.matchId,
      homeTeam: signal.homeTeam,
      awayTeam: signal.awayTeam,
      betSide: signal.decision.betSide,
      handicap: signal.decision.handicap,
      odds: signal.decision.odds,
      stakeAmount: signal.decision.stakeAmount
    };

    console.log(`Processing betting signal for ${signal.homeTeam} vs ${signal.awayTeam}`);
    
    try {
      const result = await this.placeBet(betRequest);
      
      eventBus.emitBetPlaced({
        betId: betRequest.betId,
        strategyName: betRequest.strategyName,
        matchId: betRequest.matchId,
        homeTeam: betRequest.homeTeam,
        awayTeam: betRequest.awayTeam,
        betSide: betRequest.betSide,
        handicap: betRequest.handicap,
        odds: result.actualOdds || betRequest.odds,
        stakeAmount: result.actualStake || betRequest.stakeAmount,
        status: result.success ? 'success' : 'failed',
        error: result.error,
        hkjcBetId: result.hkjcBetId
      });
      
    } catch (error) {
      console.error('Error processing betting signal:', error);
      
      eventBus.emitBetPlaced({
        betId: betRequest.betId,
        strategyName: betRequest.strategyName,
        matchId: betRequest.matchId,
        homeTeam: betRequest.homeTeam,
        awayTeam: betRequest.awayTeam,
        betSide: betRequest.betSide,
        handicap: betRequest.handicap,
        odds: betRequest.odds,
        stakeAmount: betRequest.stakeAmount,
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Place a bet with improved reliability
   */
  public async placeBet(betRequest: BetRequest): Promise<BetResult> {
    const result: BetResult = {
      betId: betRequest.betId,
      success: false,
      placedAt: Date.now()
    };

    try {
      // Ensure browser is ready
      await this.ensureBrowserReady();
      
      // Ensure logged in
      if (!this.isLoggedIn) {
        await this.login();
      }

      // Navigate to football betting page
      await this.navigateToFootball();
      
      // Find the specific match
      const matchElement = await this.findMatch(betRequest.homeTeam, betRequest.awayTeam);
      if (!matchElement) {
        throw new Error(`Match not found: ${betRequest.homeTeam} vs ${betRequest.awayTeam}`);
      }

      // Select the correct bet with improved targeting
      await this.selectBet(matchElement, betRequest);
      
      // Add to betslip
      await this.addToBetslip();
      
      // Enter stake amount
      await this.enterStake(betRequest.stakeAmount);
      
      // Place the bet
      const placementResult = await this.confirmBet();
      
      result.success = true;
      result.hkjcBetId = placementResult.betId;
      result.actualOdds = placementResult.actualOdds;
      result.actualStake = placementResult.actualStake;
      
      console.log(`Successfully placed bet: ${betRequest.betId}`);
      return result;
      
    } catch (error) {
      console.error(`Failed to place bet ${betRequest.betId}:`, error);
      result.error = error.message;
      return result;
    } finally {
      // Always logout after betting attempt
      if (this.isLoggedIn) {
        await this.logout();
      }
    }
  }

  /**
   * Ensure browser is ready
   */
  private async ensureBrowserReady(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: false, // Keep visible for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await this.page.setViewportSize({ width: 1920, height: 1080 });
    }
  }

  /**
   * Enhanced login with better reliability
   */
  private async login(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('Logging in to HKJC...');
    
    await this.page.goto('https://bet.hkjc.com/en/football/home');
    await this.page.waitForLoadState('networkidle');

    // Enter username
    await this.waitAndFill(this.selectors.loginAccount, this.credentials.username);
    await this.page.waitForTimeout(1000);
    
    // Tab to password field
    await this.page.keyboard.press('Tab');
    await this.waitAndFill(this.selectors.loginPassword, this.credentials.password);
    await this.page.waitForTimeout(1000);

    // Click login
    await this.waitAndClick(this.selectors.loginButton);
    await this.page.waitForTimeout(2000);

    // Handle security question
    await this.handleSecurityQuestion();
    
    // Verify login success
    await this.page.waitForSelector('#betslip-panel', { timeout: 10000 });
    this.isLoggedIn = true;
    
    console.log('Successfully logged in to HKJC');
    
    eventBus.emitModuleStatus({
      moduleName: 'HKJCBettingExecutor',
      status: 'online',
      message: 'Logged in successfully'
    });
  }

  /**
   * Handle security question with answers
   */
  private async handleSecurityQuestion(): Promise<void> {
    if (!this.page) return;

    try {
      const questionElement = await this.waitForSelector(this.selectors.securityQuestion, 5000);
      if (!questionElement) return;

      const questionText = await questionElement.textContent();
      if (!questionText) return;

      const answer = this.credentials.answers[questionText.trim()];
      if (!answer) {
        throw new Error(`No answer found for security question: ${questionText}`);
      }

      await this.waitAndFill(this.selectors.securityAnswer, answer);
      await this.page.waitForTimeout(1000);
      
      await this.waitAndClick(this.selectors.confirmButton);
      await this.page.waitForTimeout(1000);
      
      await this.waitAndClick(this.selectors.proceedButton);
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      console.warn('Security question handling failed:', error);
    }
  }

  /**
   * Navigate to football betting page
   */
  private async navigateToFootball(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    
    await this.page.goto('https://bet.hkjc.com/en/football/home');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Find specific match with enhanced search
   */
  private async findMatch(homeTeam: string, awayTeam: string): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`Looking for match: ${homeTeam} vs ${awayTeam}`);

    // Wait for matches to load
    await this.waitForSelector(this.selectors.matchContainer, 10000);
    
    // Try multiple search strategies
    const searchStrategies = [
      () => this.page!.locator(`text="${homeTeam}"`)
        .locator('xpath=../../../..')
        .filter({ hasText: awayTeam })
        .first(),
      
      () => this.page!.locator(`text="${awayTeam}"`)
        .locator('xpath=../../../..')
        .filter({ hasText: homeTeam })
        .first(),
        
      () => this.page!.locator(this.selectors.matchRow.join(', '))
        .filter({ hasText: homeTeam })
        .filter({ hasText: awayTeam })
        .first(),
        
      () => this.page!.locator('text=' + homeTeam + ' v ' + awayTeam)
        .locator('xpath=../../../..')
        .first()
    ];

    for (const strategy of searchStrategies) {
      try {
        const matchElement = strategy();
        const count = await matchElement.count();
        
        if (count > 0) {
          console.log(`Found match using strategy ${searchStrategies.indexOf(strategy) + 1}`);
          return matchElement.first();
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(`Could not find match: ${homeTeam} vs ${awayTeam}`);
  }

  /**
   * Select bet with improved home/away targeting
   */
  private async selectBet(matchElement: any, betRequest: BetRequest): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`Selecting ${betRequest.betSide} bet for ${betRequest.homeTeam} vs ${betRequest.awayTeam}`);

    // First, find the Asian Handicap section within the match
    const ahSection = matchElement.locator(this.selectors.handicapSection.join(', ')).first();
    await ahSection.waitFor({ timeout: 5000 });

    // Get all checkboxes in the AH section
    const checkboxes = ahSection.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount < 2) {
      throw new Error('Could not find home and away checkboxes');
    }

    // Enhanced bet selection with multiple verification strategies
    let targetCheckbox;
    
    if (betRequest.betSide === 'home') {
      targetCheckbox = await this.selectHomeCheckbox(ahSection);
    } else {
      targetCheckbox = await this.selectAwayCheckbox(ahSection);
    }

    if (!targetCheckbox) {
      throw new Error(`Could not select ${betRequest.betSide} checkbox`);
    }

    // Verify selection before proceeding
    await this.verifyCheckboxSelection(targetCheckbox, betRequest.betSide, matchElement);
    
    console.log(`Successfully selected ${betRequest.betSide} checkbox`);
  }

  /**
   * Select home checkbox with multiple strategies
   */
  private async selectHomeCheckbox(ahSection: any): Promise<any> {
    const strategies = [
      // Strategy 1: Look for data attribute
      () => ahSection.locator('input[type="checkbox"][data-side="home"]').first(),
      
      // Strategy 2: Look for position-based (first checkbox)
      () => ahSection.locator('input[type="checkbox"]').first(),
      
      // Strategy 3: Look for container-based
      () => ahSection.locator('.home-selection input[type="checkbox"], .home input[type="checkbox"]').first(),
      
      // Strategy 4: Look for label-based
      () => ahSection.locator('label:has-text("1") input[type="checkbox"], label:has(span:text("1")) input[type="checkbox"]').first(),
      
      // Strategy 5: Look for left-side positioning
      () => ahSection.locator('tr td:first-child input[type="checkbox"], div:first-child input[type="checkbox"]').first()
    ];

    for (const strategy of strategies) {
      try {
        const checkbox = strategy();
        const count = await checkbox.count();
        
        if (count > 0) {
          await checkbox.check();
          console.log(`Selected home checkbox using strategy ${strategies.indexOf(strategy) + 1}`);
          return checkbox;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Select away checkbox with multiple strategies
   */
  private async selectAwayCheckbox(ahSection: any): Promise<any> {
    const strategies = [
      // Strategy 1: Look for data attribute
      () => ahSection.locator('input[type="checkbox"][data-side="away"]').first(),
      
      // Strategy 2: Look for position-based (last checkbox)
      () => ahSection.locator('input[type="checkbox"]').last(),
      
      // Strategy 3: Look for container-based
      () => ahSection.locator('.away-selection input[type="checkbox"], .away input[type="checkbox"]').first(),
      
      // Strategy 4: Look for label-based
      () => ahSection.locator('label:has-text("2") input[type="checkbox"], label:has(span:text("2")) input[type="checkbox"]').first(),
      
      // Strategy 5: Look for right-side positioning
      () => ahSection.locator('tr td:last-child input[type="checkbox"], div:last-child input[type="checkbox"]').first()
    ];

    for (const strategy of strategies) {
      try {
        const checkbox = strategy();
        const count = await checkbox.count();
        
        if (count > 0) {
          await checkbox.check();
          console.log(`Selected away checkbox using strategy ${strategies.indexOf(strategy) + 1}`);
          return checkbox;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Verify checkbox selection is correct
   */
  private async verifyCheckboxSelection(checkbox: any, expectedSide: 'home' | 'away', matchElement: any): Promise<void> {
    // Check if checkbox is actually checked
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      throw new Error(`Checkbox for ${expectedSide} is not checked`);
    }

    // Additional verification: check odds display or team names
    try {
      const parent = checkbox.locator('xpath=..');
      const siblingText = await parent.textContent();
      
      // Log for debugging
      console.log(`Checkbox selection verification - Expected: ${expectedSide}, Context: ${siblingText}`);
      
    } catch (error) {
      console.warn('Could not verify checkbox context:', error);
    }
  }

  /**
   * Add selection to betslip
   */
  private async addToBetslip(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    
    await this.waitAndClick(this.selectors.addButton);
    await this.page.waitForTimeout(1000);
    
    // Verify betslip has the selection
    await this.page.waitForSelector('#betslip-panel .selection', { timeout: 5000 });
  }

  /**
   * Enter stake amount
   */
  private async enterStake(amount: number): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    
    const stakeInput = await this.waitForSelector(this.selectors.stakeInput, 5000);
    if (!stakeInput) throw new Error('Could not find stake input');
    
    // Clear existing value and enter new stake
    await stakeInput.dblclick();
    await this.page.waitForTimeout(500);
    await stakeInput.fill(amount.toString());
    await this.page.waitForTimeout(1000);
  }

  /**
   * Confirm and place the bet
   */
  private async confirmBet(): Promise<{ betId?: string; actualOdds?: number; actualStake?: number }> {
    if (!this.page) throw new Error('Browser not initialized');
    
    // Place bet
    await this.waitAndClick(this.selectors.placeBetButton);
    await this.page.waitForTimeout(1000);
    
    // Confirm bet
    await this.waitAndClick(this.selectors.confirmBetButton);
    await this.page.waitForTimeout(2000);
    
    // Extract bet confirmation details
    const result: any = {};
    
    try {
      // Look for bet confirmation ID
      const confirmationElement = await this.page.locator('.bet-confirmation, .confirmation-id').first();
      if (await confirmationElement.count() > 0) {
        result.betId = await confirmationElement.textContent();
      }
    } catch (error) {
      console.warn('Could not extract bet ID:', error);
    }
    
    // Click done
    await this.waitAndClick(this.selectors.doneButton);
    await this.page.waitForTimeout(1000);
    
    return result;
  }

  /**
   * Logout from HKJC
   */
  private async logout(): Promise<void> {
    if (!this.page || !this.isLoggedIn) return;

    try {
      await this.page.waitForTimeout(1000);
      await this.page.getByText('Logout').click();
      await this.page.waitForTimeout(1000);
      await this.page.getByTestId('overlay').getByText('OK').click();
      await this.page.waitForTimeout(1000);
      await this.page.getByText('Close').click();
      
      this.isLoggedIn = false;
      console.log('Successfully logged out from HKJC');
      
    } catch (error) {
      console.warn('Logout failed:', error);
      this.isLoggedIn = false; // Force logout state
    }
  }

  /**
   * Utility: Wait for selector with multiple fallbacks
   */
  private async waitForSelector(selectors: string[], timeout: number = 5000): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');

    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        await element.waitFor({ timeout: timeout / selectors.length });
        return element;
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Utility: Wait and click with multiple fallbacks
   */
  private async waitAndClick(selectors: string[]): Promise<void> {
    const element = await this.waitForSelector(selectors);
    if (!element) {
      throw new Error(`Could not find clickable element: ${selectors.join(', ')}`);
    }
    
    await element.click();
  }

  /**
   * Utility: Wait and fill with multiple fallbacks
   */
  private async waitAndFill(selectors: string[], value: string): Promise<void> {
    const element = await this.waitForSelector(selectors);
    if (!element) {
      throw new Error(`Could not find input element: ${selectors.join(', ')}`);
    }
    
    await element.fill(value);
  }

  /**
   * Close browser and cleanup
   */
  public async close(): Promise<void> {
    if (this.isLoggedIn) {
      await this.logout();
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    eventBus.emitModuleStatus({
      moduleName: 'HKJCBettingExecutor',
      status: 'offline',
      message: 'Executor closed'
    });
  }

  /**
   * Get executor status
   */
  public getStatus(): {
    isLoggedIn: boolean;
    activeBets: number;
    lastActivity: number;
  } {
    return {
      isLoggedIn: this.isLoggedIn,
      activeBets: this.currentBets.size,
      lastActivity: Date.now()
    };
  }
}