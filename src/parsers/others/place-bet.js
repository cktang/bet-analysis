const { chromium } = require('playwright');
const _ = require('lodash');
const moment = require('moment');
const { PAGES } = require('./teams');
const { GetMatchKey } = require('./util');
const { hkjc_login, hkjc_logout } = require('../../tests/hkjc-util');


console.warn('Starting bet placer');
(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  console.warn("Browser started");

  await hkjc_login(page);

  await hkjc_logout(page);

  console.warn("Closing browser");
  page.close();
  process.exit(0);
})();