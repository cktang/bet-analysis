import { test } from "@playwright/test";
import _ from "lodash";
import fs from 'fs';
import moment from "moment";
import { match } from "assert";

// user input
const startDate = moment("2022-08-01");
const endDate = moment("2023-06-01");
const dir = "2022-2023";
const timeout = 500;

const matches: any = [];

test("scrap HKJC match schedule", async ({ page }) => {
  test.setTimeout(timeout * 5000);

  const teams = {
    arsenal: "Arsenal(阿仙奴)",
    "aston villa": "Aston Villa(阿士東維拉)",
    bournemouth: "Bournemouth(般尼茅夫)",
    brentford: "Brentford(賓福特)",
    brighton: "Brighton(白禮頓)",
    chelsea: "Chelsea(車路士)",
    "crystal palace": "Crystal Palace(水晶宮)",
    everton: "Everton(愛華頓)",
    fulham: "Fulham(富咸)",
    ipswich: "Ipswich(葉士域治)",
    leicester: "Leicester(李斯特城)",
    liverpool: "Liverpool(利物浦)",
    "manchester city": "Manchester City(曼城)",
    "manchester utd": "Manchester Utd(曼聯)",
    newcastle: "Newcastle(紐卡素)",
    "nottingham forest": "Nottingham Forest(諾定咸森林)",
    southampton: "Southampton(修咸頓)",
    tottenham: "Tottenham(熱刺)",
    "west ham": "West Ham(韋斯咸)",
    wolves: "Wolves(狼隊)",

    // 2023 teams
    burnley: "Burnley(般尼)",
    luton: "Luton(盧頓)",
    "sheff utd": "Sheff Utd(錫菲聯)",

    // // 2022 teams
    Leeds: "Leeds(列斯聯)",

    // // 2021 teams
    // norwich: "Norwich(諾域治)",
    // watford: "Watford(屈福特)",

    // // 2020 teams
    // "west bromwich": "West Bromwich(西布朗)",
  };

  // login
  await page.goto("https://bet.hkjc.com/en/football/home");
  await page.setViewportSize({ width: 1080, height: 1080 });
  await page.getByRole("button", { name: "Results/Dividend" }).click();
  await page.getByRole("button", { name: "Match Results" }).click();
  await page
    .locator("header")
    .filter({ hasText: "Search" })
    .locator("div")
    .nth(1)
    .click();

  const m = moment(startDate);
  while(true) {
    m.set('date', 1).add(1, 'month').add(-1, "day");
    if (m.isAfter(endDate)) {
      break;
    }

    const month = m.format("MMMM");
    const year = m.format("YYYY");
    const date = m.isAfter(moment())? moment().format("D"): m.format("D");
    console.info("scrapping", year, month, date);

    // choose date
    await page.locator(".date-dd-arrow").click();
    await page.locator(".dateRangePickerYear").first().click();
    await page.locator(".monthDropdown").getByText(year).click();
    await page.locator(".dateRangePickerMonth").first().click();
    await page.locator(".monthDropdown").getByText(month).click();
    await page.locator(".datePickerDay").getByText("1", { exact: true }).first().click();
    await page.locator(".datePickerDay").getByText(date, { exact: true }).last().click();

    // scrap each team for a particular link in the search result page
    for (const teamName in teams) {
      // filter by team
      console.log(`scrapping ${teams[teamName]}`);
      await page.locator("#FBFilterSelectDrd").click();
      await page.getByPlaceholder("Search Team").fill(teamName);
      await page.getByTitle(teams[teamName]).click();
      await page.getByRole("button", { name: "Search" }).click();

      // loop through all match links until no more matches found to scrap in this page
      await page.getByText("Matches 1 -").click();

      // find a valid match to go into
      const tables = await page.locator(".table-row");
      const validLinks = await tables.filter({ has: page.getByTitle("Eng Premier") });
      const count = await validLinks.count();

      console.info('found links', count);
      for (let n = 0; n < count; n++) {
        const linkText = (await validLinks.nth(n).innerText())
        const arr = linkText.split(/\s+/);
        const id = moment(arr[0], "DD/MM/YYYY").format("YYYYMMDD") + "-" + arr[1];
        
        const path = require('path');
        const filename = path.join(__dirname, "../history", dir, id + ".txt");
        const fileExists = fs.existsSync(filename);
        if (!fileExists) console.info(id, filename, fileExists);

        matches.push(id);
      }
    }
    
    await page.waitForTimeout(timeout + _.random(0, timeout));
    m.add(1, 'day');
  }

  console.info("matches", matches.length);
  fs.writeFileSync("matches.json", JSON.stringify(matches, null, 2));
  
});
