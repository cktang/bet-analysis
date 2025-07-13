const { chromium } = require('playwright');
const path = require('path');

const HKJC_URL = 'https://bet.hkjc.com/en/football';
const SESSION_DIR = path.join(__dirname, 'data/v2/browser-session');
const LOGIN_CYCLES = 5; // Number of login/logout cycles

const USERNAME = process.env.HKJC_USERNAME;
const PASSWORD = process.env.HKJC_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error('❌ Please set HKJC_USERNAME and HKJC_PASSWORD environment variables.');
  process.exit(1);
}

async function login(page) {
  await page.goto(HKJC_URL, { waitUntil: 'domcontentloaded' });
  // Wait for login form or logout button
  if (await page.$('text=Logout')) {
    console.log('✅ Already logged in');
    return true;
  }
  await page.click('text=Login');
  await page.fill('input[name="loginname"]', USERNAME);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for logout button
  await page.waitForSelector('text=Logout', { timeout: 10000 });
  console.log('✅ Login successful');
  return true;
}

async function logout(page) {
  // Click logout if available
  if (await page.$('text=Logout')) {
    await page.click('text=Logout');
    await page.waitForSelector('input[name="loginname"]', { timeout: 10000 });
    console.log('✅ Logout successful');
    return true;
  } else {
    console.log('ℹ️ Already logged out');
    return false;
  }
}

async function verifyLoggedIn(page) {
  return !!(await page.$('text=Logout'));
}

async function verifyLoggedOut(page) {
  return !!(await page.$('input[name="loginname"]'));
}

(async () => {
  let browser, context, page;
  try {
    for (let i = 1; i <= LOGIN_CYCLES; i++) {
      console.log(`\n🔄 Cycle ${i} of ${LOGIN_CYCLES}`);
      browser = await chromium.launchPersistentContext(SESSION_DIR, { headless: true });
      page = await browser.newPage();
      // Login
      await login(page);
      if (!(await verifyLoggedIn(page))) throw new Error('Login verification failed');
      // Logout
      await logout(page);
      if (!(await verifyLoggedOut(page))) throw new Error('Logout verification failed');
      await browser.close();
    }
    // Test session persistence
    console.log('\n🔄 Testing session persistence after login...');
    browser = await chromium.launchPersistentContext(SESSION_DIR, { headless: true });
    page = await browser.newPage();
    await login(page);
    await browser.close();
    // Reopen browser and check if still logged in
    browser = await chromium.launchPersistentContext(SESSION_DIR, { headless: true });
    page = await browser.newPage();
    await page.goto(HKJC_URL, { waitUntil: 'domcontentloaded' });
    if (await verifyLoggedIn(page)) {
      console.log('✅ Session persistence: Still logged in after browser restart');
    } else {
      console.error('❌ Session persistence failed: Not logged in after browser restart');
    }
    await browser.close();
    console.log('\n🎉 Login/logout/session persistence test completed!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
})(); 