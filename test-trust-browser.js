const { chromium } = require('playwright');
const path = require('path');

const SESSION_DIR = path.join(__dirname, 'data/v2/browser-session');

// Credentials
const credentials = {
  username: '04098071',
  password: '1glorybox',
  answers: {
    '你出生的醫院名稱是甚麼?': 'queene',
    '你最喜愛的食物?': 'eggs',
    '你第一份工作的地點?': 'metro',
    '你最喜愛的女藝人?': 'kaytse',
    '你的駕駛執照有效期至?': '2022',
  }
};

async function testTrustBrowser() {
  const browser = await chromium.launchPersistentContext(SESSION_DIR, { 
    headless: false 
  });
  
  try {
    const page = browser.pages()[0] || await browser.newPage();
    
    console.log('🔍 Testing trust browser functionality...\n');
    
    // Navigate to HKJC
    await page.goto('https://bet.hkjc.com/en/football/home');
    await page.waitForTimeout(2000);
    
    // Check if already logged in
    const isLoggedIn = await page.locator('text=Logout').count() > 0;
    console.log(`Current login status: ${isLoggedIn ? 'Logged in' : 'Not logged in'}`);
    
    if (!isLoggedIn) {
      console.log('🔐 Performing login...');
      
      // Login process
      await page.getByPlaceholder("Login name / Betting Account").click();
      await page.locator("#login-account-input").fill(credentials.username);
      await page.waitForTimeout(2000);
      await page.locator("#login-account-input").press("Tab");
      await page.locator("#login-password-input").fill(credentials.password);
      await page.waitForTimeout(2000);
      await page.getByText("Login").first().click();
      await page.waitForTimeout(3000);
      
      // Handle security question if it appears
      if (await page.locator(".login-question").count() > 0) {
        const question = await page.locator(".login-question").textContent();
        const answer = credentials.answers[question.trim()];
        console.log(`🔐 Answering security question: ${question}`);
        
        await page.locator('#betslip-panel').getByRole('textbox').fill(answer);
        await page.waitForTimeout(2000);
        await page.getByText("Confirm", { exact: true }).click();
        await page.waitForTimeout(3000);
      }
      
      // Check for trust browser dialog
      console.log('🔍 Checking for trust browser dialog...');
      
      // Look for various trust browser dialog patterns
      const trustDialogSelectors = [
        'text=Trust this browser',
        'text=信任此瀏覽器',
        'text=Remember this device',
        'text=記住此裝置',
        '[data-testid*="trust"]',
        'button[class*="trust"]',
        'input[type="checkbox"]'
      ];
      
      let trustDialogFound = false;
      for (const selector of trustDialogSelectors) {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ Found trust dialog element: ${selector}`);
          trustDialogFound = true;
          
          // Try to click the trust option
          try {
            await page.locator(selector).first().click();
            await page.waitForTimeout(1000);
            console.log(`✅ Clicked trust option: ${selector}`);
          } catch (error) {
            console.log(`⚠️ Could not click ${selector}: ${error.message}`);
          }
        }
      }
      
      if (!trustDialogFound) {
        console.log('⚠️ No trust browser dialog found - checking page content...');
        
        // Get page content to see what's available
        const bodyText = await page.locator('body').textContent();
        const trustKeywords = ['trust', 'browser', '信任', '瀏覽器', 'remember', 'device'];
        
        trustKeywords.forEach(keyword => {
          if (bodyText.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`🔍 Found keyword "${keyword}" in page content`);
          }
        });
        
        console.log('\n📄 Current page URL:', page.url());
        console.log('📄 Page title:', await page.title());
      }
      
      // Click Proceed
      await page.getByText("Proceed").click();
      await page.waitForTimeout(3000);
      
      // Verify login success
      const loginSuccess = await page.locator('text=Logout').count() > 0;
      console.log(`Login result: ${loginSuccess ? 'Success' : 'Failed'}`);
    }
    
    // Test navigation to HDC page
    console.log('🏈 Navigating to HDC page...');
    await page.goto('https://bet.hkjc.com/en/football/hdc');
    await page.waitForTimeout(3000);
    
    // Check if we get CAPTCHA or security challenge
    const hasCaptcha = await page.locator('[data-testid="captcha"], iframe[src*="captcha"], .captcha').count() > 0;
    const hasSecurityChallenge = await page.locator('text=Security verification, text=Verify your identity').count() > 0;
    
    console.log(`CAPTCHA detected: ${hasCaptcha}`);
    console.log(`Security challenge detected: ${hasSecurityChallenge}`);
    
    if (hasCaptcha || hasSecurityChallenge) {
      console.log('❌ Still getting security challenges - trust browser not working');
    } else {
      console.log('✅ No security challenges - trust browser working');
    }
    
    // Inspect cookies
    const cookies = await page.context().cookies();
    const trustCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('trust') ||
      cookie.name.toLowerCase().includes('device') ||
      cookie.name.toLowerCase().includes('remember') ||
      cookie.name.toLowerCase().includes('session')
    );
    
    console.log(`\n🍪 Total cookies: ${cookies.length}`);
    console.log(`🎯 Trust-related cookies: ${trustCookies.length}`);
    
    if (trustCookies.length > 0) {
      trustCookies.forEach(cookie => {
        console.log(`   ${cookie.name}: ${cookie.value.substring(0, 30)}...`);
      });
    }
    
    console.log('\n⏳ Browser kept open for manual inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep open indefinitely
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testTrustBrowser().catch(console.error);