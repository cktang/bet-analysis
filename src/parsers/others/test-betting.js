const { chromium } = require('playwright');
const _ = require('lodash');
const { hkjc_login, hkjc_logout, hkjc_bet_handicap } = require('./hkjc-util');

console.warn('Starting bet test');
(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  console.warn("Browser started");

  await hkjc_login(page);

  await hkjc_bet_handicap(page, {
    id: "FB4827",
    decision: "home",
  }, 20);

  await hkjc_logout(page);

})();