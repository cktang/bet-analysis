const { chromium } = require('playwright');
const path = require('path');

const SESSION_DIR = path.join(__dirname, 'data/v2/browser-session');

async function inspectCookies() {
  const browser = await chromium.launchPersistentContext(SESSION_DIR, { 
    headless: false 
  });
  
  try {
    const page = browser.pages()[0] || await browser.newPage();
    
    console.log('🔍 Inspecting HKJC cookies in persistent session...\n');
    
    // Navigate to HKJC
    await page.goto('https://bet.hkjc.com/en/football/hdc', { 
      waitUntil: 'networkidle' 
    });
    
    // Get all cookies
    const cookies = await page.context().cookies();
    
    // Filter HKJC-related cookies
    const hkjcCookies = cookies.filter(cookie => 
      cookie.domain.includes('hkjc.com') || 
      cookie.name.toLowerCase().includes('trust') ||
      cookie.name.toLowerCase().includes('session') ||
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('device') ||
      cookie.name.toLowerCase().includes('browser')
    );
    
    console.log(`📊 Total cookies: ${cookies.length}`);
    console.log(`🎯 HKJC-related cookies: ${hkjcCookies.length}\n`);
    
    if (hkjcCookies.length > 0) {
      console.log('🍪 HKJC Cookies:');
      hkjcCookies.forEach((cookie, index) => {
        console.log(`${index + 1}. Name: ${cookie.name}`);
        console.log(`   Domain: ${cookie.domain}`);
        console.log(`   Value: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
        console.log(`   Expires: ${cookie.expires ? new Date(cookie.expires * 1000).toISOString() : 'Session'}`);
        console.log(`   HttpOnly: ${cookie.httpOnly}, Secure: ${cookie.secure}`);
        console.log(`   SameSite: ${cookie.sameSite}\n`);
      });
    } else {
      console.log('❌ No HKJC-related cookies found');
    }
    
    // Check local storage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    console.log('💾 Local Storage items:', Object.keys(localStorage).length);
    if (Object.keys(localStorage).length > 0) {
      Object.entries(localStorage).forEach(([key, value]) => {
        console.log(`   ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
      });
    }
    
    // Check session storage
    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        items[key] = sessionStorage.getItem(key);
      }
      return items;
    });
    
    console.log('\n🔒 Session Storage items:', Object.keys(sessionStorage).length);
    if (Object.keys(sessionStorage).length > 0) {
      Object.entries(sessionStorage).forEach(([key, value]) => {
        console.log(`   ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
      });
    }
    
    console.log('\n✅ Cookie inspection complete');
    
    // Keep browser open for manual inspection
    console.log('\n⏳ Browser kept open for manual inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep open indefinitely
    
  } catch (error) {
    console.error('❌ Error inspecting cookies:', error);
  } finally {
    await browser.close();
  }
}

inspectCookies().catch(console.error);