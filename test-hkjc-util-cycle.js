const { chromium } = require('playwright');
const path = require('path');
const { hkjc_login, hkjc_logout } = require('./src/utils/hkjc-util');

// Credentials and answers (from your test file)
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

const SESSION_DIR = path.join(__dirname, 'data/v2/browser-session');
const LOGIN_CYCLES = 5; // Number of login/logout cycles
const HKJC_URL = 'https://bet.hkjc.com/en/football/hdc';

async function verifyLoggedIn(page) {
  return !!(await page.$('text=Logout'));
}

async function verifyLoggedOut(page) {
  return !!(await page.$('input.login-account-input'));
}

(async () => {
  let browser, page;
  try {
    browser = await chromium.launchPersistentContext(SESSION_DIR, { headless: false });
    page = browser.pages()[0] || await browser.newPage();
    
    for (let i = 1; i <= LOGIN_CYCLES; i++) {
      console.log(`\n🔄 Cycle ${i} of ${LOGIN_CYCLES}`);
      // Login
      await hkjc_login(page, credentials);
      if (!(await verifyLoggedIn(page))) throw new Error('Login verification failed');
      // Logout
      await hkjc_logout(page);
      if (!(await verifyLoggedOut(page))) throw new Error('Logout verification failed');
    }
    // Test session persistence
    console.log('\n🔄 Testing session persistence after login...');
    await hkjc_login(page, credentials);
    // Reopen browser and check if still logged in
    await page.close();
    await browser.close();

    browser = await chromium.launchPersistentContext(SESSION_DIR, { headless: false });
    page = browser.pages()[0] || await browser.newPage();
    await page.goto(HKJC_URL, { waitUntil: 'domcontentloaded' });

    // do it one more time to test session persistence
    // make sure no captcha
    await hkjc_login(page, credentials);
    if (!(await verifyLoggedIn(page))) throw new Error('Login verification failed');
    // Logout
    await hkjc_logout(page);
    if (!(await verifyLoggedOut(page))) throw new Error('Logout verification failed');

    await browser.close();
    console.log('\n🎉 HKJC util login/logout/session persistence test completed!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
})(); 