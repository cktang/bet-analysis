const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.join(__dirname, 'data/v2/browser-session');

async function clearAndTestSession() {
  console.log('🧹 Clearing browser session and testing trust browser persistence...\n');
  
  // Clear existing session directory
  if (fs.existsSync(SESSION_DIR)) {
    console.log('🗑️ Removing existing session directory...');
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  }
  
  // Create fresh session directory
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  console.log('✅ Created fresh session directory\n');
  
  // Test 1: First time login and trust browser
  console.log('🔑 TEST 1: First login - should see trust browser dialog');
  let browser = await chromium.launchPersistentContext(SESSION_DIR, { 
    headless: false 
  });
  
  try {
    let page = browser.pages()[0] || await browser.newPage();
    
    await page.goto('https://bet.hkjc.com/en/football/home');
    await page.waitForTimeout(3000);
    
    // Manual login process - let user handle it
    console.log('👤 Please manually log in and click "Trust this browser" when prompted');
    console.log('⏳ Once logged in, press Enter to continue...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    // Capture cookies after login and trust
    const postLoginCookies = await page.context().cookies();
    const hkjcCookies = postLoginCookies.filter(cookie => 
      cookie.domain.includes('hkjc.com')
    );
    
    console.log(`\n📊 After login and trust: ${hkjcCookies.length} HKJC cookies`);
    
    // Save cookie snapshot
    const cookieSnapshot = {
      timestamp: new Date().toISOString(),
      test: 'after_trust_browser',
      cookies: hkjcCookies.map(cookie => ({
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires ? new Date(cookie.expires * 1000).toISOString() : null,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        valueLength: cookie.value.length
      }))
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'cookies-after-trust.json'), 
      JSON.stringify(cookieSnapshot, null, 2)
    );
    
    await browser.close();
    console.log('✅ Session 1 complete - cookies saved\n');
    
  } catch (error) {
    console.error('❌ Error in test 1:', error);
    if (browser) await browser.close();
    return;
  }
  
  // Test 2: Immediate reload - should not ask for trust again
  console.log('🔄 TEST 2: Immediate reload - should be trusted');
  browser = await chromium.launchPersistentContext(SESSION_DIR, { 
    headless: false 
  });
  
  try {
    let page = browser.pages()[0] || await browser.newPage();
    
    await page.goto('https://bet.hkjc.com/en/football/hdc');
    await page.waitForTimeout(3000);
    
    const hasCaptcha = await page.locator('[class*="captcha"], [id*="captcha"]').count() > 0;
    const hasVerification = await page.locator('text=verification, text=verify').count() > 0;
    
    console.log(`   CAPTCHA present: ${hasCaptcha ? '❌ YES' : '✅ NO'}`);
    console.log(`   Security verification: ${hasVerification ? '❌ YES' : '✅ NO'}`);
    
    if (!hasCaptcha && !hasVerification) {
      console.log('✅ Trust browser working immediately after login');
    } else {
      console.log('❌ Trust browser NOT working immediately');
    }
    
    await browser.close();
    console.log('✅ Session 2 complete\n');
    
  } catch (error) {
    console.error('❌ Error in test 2:', error);
    if (browser) await browser.close();
  }
  
  console.log('⏳ Now wait a few hours and run this test again to see if trust persists...');
  console.log('💡 You can run: node test-trust-persistence.js');
  
  // Create a follow-up test script
  const followUpScript = `const { chromium } = require('playwright');
const path = require('path');

const SESSION_DIR = path.join(__dirname, 'data/v2/browser-session');

(async () => {
  console.log('🕐 Testing trust browser persistence after time delay...');
  
  const browser = await chromium.launchPersistentContext(SESSION_DIR, { 
    headless: false 
  });
  
  try {
    const page = browser.pages()[0] || await browser.newPage();
    
    await page.goto('https://bet.hkjc.com/en/football/hdc');
    await page.waitForTimeout(3000);
    
    const hasCaptcha = await page.locator('[class*="captcha"], [id*="captcha"]').count() > 0;
    const hasVerification = await page.locator('text=verification, text=verify').count() > 0;
    
    console.log(\`   CAPTCHA present: \${hasCaptcha ? '❌ YES - Trust expired!' : '✅ NO'}\`);
    console.log(\`   Security verification: \${hasVerification ? '❌ YES - Trust expired!' : '✅ NO'}\`);
    
    // Check cookies
    const cookies = await page.context().cookies();
    const hkjcCookies = cookies.filter(cookie => cookie.domain.includes('hkjc.com'));
    
    console.log(\`\\n🍪 Current HKJC cookies: \${hkjcCookies.length}\`);
    
    // Compare with saved cookies
    const fs = require('fs');
    const savedCookies = JSON.parse(fs.readFileSync('cookies-after-trust.json', 'utf8'));
    
    console.log(\`📊 Saved cookies from trust: \${savedCookies.cookies.length}\`);
    console.log(\`📊 Current cookies: \${hkjcCookies.length}\`);
    
    // Check for expired cookies
    const expiredCookies = savedCookies.cookies.filter(cookie => {
      if (!cookie.expires) return false;
      return new Date(cookie.expires) < new Date();
    });
    
    console.log(\`⏰ Expired cookies: \${expiredCookies.length}\`);
    
    if (expiredCookies.length > 0) {
      console.log('❌ Some trust cookies have expired:');
      expiredCookies.forEach(cookie => {
        console.log(\`   \${cookie.name} expired at \${cookie.expires}\`);
      });
    }
    
    console.log('\\n⏳ Browser kept open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();`;
  
  fs.writeFileSync('test-trust-persistence.js', followUpScript);
  console.log('📝 Created test-trust-persistence.js for later testing');
}

clearAndTestSession().catch(console.error);