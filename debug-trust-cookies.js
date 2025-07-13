const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.join(__dirname, 'data/v2/browser-session-betting');

async function debugTrustCookies() {
  console.log('🔍 Debugging trust browser cookies persistence...\n');
  
  // Check if session directory exists and what's in it
  if (fs.existsSync(SESSION_DIR)) {
    const files = fs.readdirSync(SESSION_DIR, { withFileTypes: true });
    console.log('📁 Session directory contents:');
    files.forEach(file => {
      try {
        const fullPath = path.join(SESSION_DIR, file.name);
        const stats = fs.statSync(fullPath);
        console.log(`   ${file.name} (${file.isDirectory() ? 'dir' : 'file'}) - Modified: ${stats.mtime.toISOString()}`);
      } catch (error) {
        console.log(`   ${file.name} - Error reading: ${error.message}`);
      }
    });
    console.log('');
  } else {
    console.log('❌ Session directory does not exist\n');
    // Create the directory if it doesn't exist
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    console.log('✅ Created session directory\n');
  }
  
  const browser = await chromium.launchPersistentContext(SESSION_DIR, { 
    headless: false 
  });
  
  try {
    const page = browser.pages()[0] || await browser.newPage();
    
    console.log('🌐 Navigating to HKJC...');
    await page.goto('https://bet.hkjc.com/en/football/hdc', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Get all cookies for HKJC domains
    const allCookies = await page.context().cookies();
    const hkjcCookies = allCookies.filter(cookie => 
      cookie.domain.includes('hkjc.com') || cookie.domain.includes('.hkjc.com')
    );
    
    console.log(`\n🍪 Total cookies: ${allCookies.length}`);
    console.log(`🎯 HKJC cookies: ${hkjcCookies.length}\n`);
    
    if (hkjcCookies.length > 0) {
      console.log('📋 HKJC Cookies Analysis:');
      hkjcCookies.forEach((cookie, index) => {
        const expires = cookie.expires ? new Date(cookie.expires * 1000) : null;
        const isExpired = expires && expires < new Date();
        const timeToExpiry = expires ? Math.round((expires - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        console.log(`${index + 1}. ${cookie.name}`);
        console.log(`   Domain: ${cookie.domain}`);
        console.log(`   Path: ${cookie.path}`);
        console.log(`   Value: ${cookie.value.substring(0, 40)}${cookie.value.length > 40 ? '...' : ''}`);
        console.log(`   Expires: ${expires ? expires.toISOString() : 'Session cookie'}`);
        console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
        if (timeToExpiry !== null) {
          console.log(`   Time to expiry: ${timeToExpiry} days`);
        }
        console.log(`   HttpOnly: ${cookie.httpOnly}, Secure: ${cookie.secure}, SameSite: ${cookie.sameSite}`);
        console.log('');
      });
    }
    
    // Look for specific trust-related cookies
    const trustCookies = hkjcCookies.filter(cookie => 
      cookie.name.toLowerCase().includes('trust') ||
      cookie.name.toLowerCase().includes('device') ||
      cookie.name.toLowerCase().includes('remember') ||
      cookie.name.toLowerCase().includes('browser') ||
      cookie.name.toLowerCase().includes('persistent') ||
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.includes('session') ||
      cookie.name.includes('JSESSIONID') ||
      cookie.name.includes('_hkjc_')
    );
    
    console.log(`🔐 Trust/Auth related cookies: ${trustCookies.length}`);
    if (trustCookies.length > 0) {
      trustCookies.forEach(cookie => {
        console.log(`   🔑 ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
      });
    } else {
      console.log('   ⚠️ No obvious trust-related cookies found');
    }
    
    // Check current page state
    const pageTitle = await page.title();
    const currentUrl = page.url();
    const hasCaptcha = await page.locator('[class*="captcha"], [id*="captcha"], iframe[src*="captcha"]').count() > 0;
    const hasVerification = await page.locator('text=verification, text=verify, text=security').count() > 0;
    
    console.log(`\n📄 Current page: ${currentUrl}`);
    console.log(`📄 Page title: ${pageTitle}`);
    console.log(`🤖 CAPTCHA present: ${hasCaptcha}`);
    console.log(`🔒 Security verification: ${hasVerification}`);
    
    // Check localStorage and sessionStorage for any additional trust data
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    
    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        items[key] = window.sessionStorage.getItem(key);
      }
      return items;
    });
    
    console.log(`\n💾 localStorage items: ${Object.keys(localStorage).length}`);
    if (Object.keys(localStorage).length > 0) {
      Object.entries(localStorage).forEach(([key, value]) => {
        console.log(`   ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      });
    }
    
    console.log(`\n🔒 sessionStorage items: ${Object.keys(sessionStorage).length}`);
    if (Object.keys(sessionStorage).length > 0) {
      Object.entries(sessionStorage).forEach(([key, value]) => {
        console.log(`   ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      });
    }
    
    // Save cookie analysis to file for comparison
    const cookieReport = {
      timestamp: new Date().toISOString(),
      totalCookies: allCookies.length,
      hkjcCookies: hkjcCookies.length,
      trustCookies: trustCookies.length,
      cookies: hkjcCookies.map(cookie => ({
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires ? new Date(cookie.expires * 1000).toISOString() : null,
        isExpired: cookie.expires ? new Date(cookie.expires * 1000) < new Date() : false,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        valueLength: cookie.value.length
      })),
      localStorage,
      sessionStorage,
      pageState: {
        url: currentUrl,
        title: pageTitle,
        hasCaptcha,
        hasVerification
      }
    };
    
    const reportPath = path.join(__dirname, `cookie-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(cookieReport, null, 2));
    console.log(`\n📊 Cookie report saved to: ${reportPath}`);
    
    // Save as "good state" if no trust issues detected
    if (!hasCaptcha && !hasVerification) {
      const goodStatePath = path.join(__dirname, 'cookie-good-state.json');
      fs.writeFileSync(goodStatePath, JSON.stringify(cookieReport, null, 2));
      console.log(`💚 Good state saved to: ${goodStatePath}`);
    }
    
    console.log('\n⏳ Browser kept open for manual inspection. Press Ctrl+C to close.');
    
    // Keep browser open for manual inspection
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugTrustCookies().catch(console.error);