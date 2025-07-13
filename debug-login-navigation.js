const { chromium } = require('playwright');

async function debugLoginNavigation() {
  console.log('🔍 Debugging login -> navigation issue...');
  
  const browser = await chromium.launchPersistentContext('./data/v2/browser-session-betting', {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = browser.pages()[0] || await browser.newPage();
  
  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    await page.goto('https://bet.hkjc.com/en/football/home');
    await page.waitForTimeout(2000);
    
    // Check if already logged in
    try {
      await page.getByText("Logout").waitFor({ timeout: 3000 });
      console.log('✅ Already logged in');
    } catch {
      console.log('Need to login...');
      // Add login steps here if needed
    }
    
    // Step 2: Check cookies before navigation
    console.log('2️⃣ Checking cookies before navigation...');
    const cookiesBefore = await page.context().cookies();
    console.log(`Cookies before: ${cookiesBefore.length}`);
    
    // Step 3: Navigate to HDC
    console.log('3️⃣ Navigating to HDC page...');
    await page.goto('https://bet.hkjc.com/en/football/hdc');
    await page.waitForTimeout(3000);
    
    // Step 4: Check login status after navigation
    console.log('4️⃣ Checking login status after navigation...');
    try {
      await page.getByText("Logout").waitFor({ timeout: 5000 });
      console.log('✅ Still logged in after navigation');
    } catch {
      console.log('❌ Login lost after navigation');
    }
    
    // Step 5: Check cookies after navigation
    console.log('5️⃣ Checking cookies after navigation...');
    const cookiesAfter = await page.context().cookies();
    console.log(`Cookies after: ${cookiesAfter.length}`);
    
    // Compare cookies
    const cookiesDiff = cookiesAfter.length - cookiesBefore.length;
    console.log(`Cookie difference: ${cookiesDiff}`);
    
    // Check page content
    console.log('6️⃣ Checking page content...');
    const pageTitle = await page.title();
    const currentUrl = page.url();
    console.log(`Page title: ${pageTitle}`);
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for login form (indicates session lost)
    const hasLoginForm = await page.locator('#login-account-input').count() > 0;
    console.log(`Has login form: ${hasLoginForm}`);
    
    console.log('\n📊 Summary:');
    console.log(`- Cookies before navigation: ${cookiesBefore.length}`);
    console.log(`- Cookies after navigation: ${cookiesAfter.length}`);
    console.log(`- Has logout button: ${await page.getByText("Logout").count() > 0}`);
    console.log(`- Has login form: ${hasLoginForm}`);
    console.log(`- Page title: ${pageTitle}`);
    
    console.log('\n⏳ Browser kept open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep open
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugLoginNavigation();