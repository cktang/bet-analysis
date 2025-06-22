import { test } from '@playwright/test';
import fs from 'fs';
import _ from 'lodash';

const texts: any = [];

// Configurable seasons - can be set via environment variables or defaults
// For 2025 data, we need 2024-2025 season
const TARGET_SEASON = process.env.TARGET_SEASON || '2024-2025';
const [startYear, endYear] = TARGET_SEASON.split('-');
const years = [startYear]; // OddsPortal uses start year for season URLs
const pages = ['1', '2', '3', '4', '5', '6', '7', '8'];
const profiles = {
  "EPL": {
    name: "Eng Premier",
    url: "https://www.oddsportal.com/football/england/premier-league"
  }
};_

_(profiles).keys().each(key => {
  const profile = profiles[key];
  const url = profile.url;

  const links = [
    `${url}/results/`,
    ...pages.map((page) => years.map((year, i) => `${url}-${year}-${Number(year)+1}/results${page=='1'? '': `/#/page/${page}/`}`)).flat()
  ];
  console.log(links);

  test(`oddsPortal: ${profile.name}`, async ({ page }) => {
    test.setTimeout(1000000);
    console.warn('step 1');
    await page.goto("https://www.oddsportal.com/");
    console.warn("step 2");
    await page.setViewportSize({ width: 1080, height: 3000 });
    console.warn("step 3");
    // await page.getByText("I Accept").click();
    // console.warn("step 4");

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.info('scrapping', link);

      await page.goto(link);
      await page.waitForTimeout(2000 + _.random(1000));

      const t = await page.locator('main').innerText();
      texts.push(t);
      await page.waitForTimeout(500);
    };

    // Save with year-specific filename
    const outputFilename = `./data/raw/oddsportal/oddsportal-result-${startYear}.txt`;
    console.log(`Saving scraped data to: ${outputFilename}`);
    fs.writeFileSync(outputFilename, texts.join('\n'));
  });
});


