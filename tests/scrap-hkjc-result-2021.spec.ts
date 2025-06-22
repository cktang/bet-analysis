import { test } from "@playwright/test";
import _ from "lodash";
import fs from 'fs';
import moment from "moment";

// user input
const startDate = moment("2021-08-01");
const endDate = moment("2022-06-01");
const folder = "2021-2022";

let matchCount = 0;
const timeout = 500;

test("scrap HKJC EPL team result", async ({ page }) => {
  test.setTimeout(timeout * 50000);

  const teams = {
    arsenal: "Arsenal(阿仙奴)",
    "aston villa": "Aston Villa(阿士東維拉)",
    brentford: "Brentford(賓福特)",
    brighton: "Brighton(白禮頓)",
    chelsea: "Chelsea(車路士)",
    "crystal palace": "Crystal Palace(水晶宮)",
    everton: "Everton(愛華頓)",
    leicester: "Leicester(李斯特城)",
    liverpool: "Liverpool(利物浦)",
    "manchester city": "Manchester City(曼城)",
    "manchester utd": "Manchester Utd(曼聯)",
    newcastle: "Newcastle(紐卡素)",
    southampton: "Southampton(修咸頓)",
    tottenham: "Tottenham(熱刺)",
    "west ham": "West Ham(韋斯咸)",
    wolves: "Wolves(狼隊)",

    // 2023 teams
    burnley: "Burnley(般尼)",

    // // 2022 teams
    Leeds: "Leeds(列斯聯)",

    // // 2021 teams
    norwich: "Norwich(諾域治)",
    watford: "Watford(屈福特)",
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
    console.info(moment().format("HH:mm"), "searching DATE ", year, month, date);

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
      console.log(`searching ${teams[teamName]}`);
      await page.locator("#FBFilterSelectDrd").click();
      await page.getByPlaceholder("Search Team").fill(teamName);
      await page.getByTitle(teams[teamName]).click();
      await page.getByRole("button", { name: "Search" }).click();

      // loop through all match links until no more matches found to scrap in this page
      while (true) {
        await page.getByText("Matches 1 -").click();

        // find a valid match to go into
        const tables = await page.locator(".fb-results-mip-table div.table-row");
        const validLinks = await tables.filter({ has: page.getByTitle("Eng Premier") });
        const count = await validLinks.count();
        // console.info('found links', count);
        if (count == 0) {
          console.info(`Cannot find link for ${teamName}`);
          await page.waitForTimeout(timeout + _.random(0, timeout));
          break;
        }

        let linkText = "";
        let linkTexts;

        let linkClicked = false;
        const getFilename = (folder, date, id) => {
          const d = moment(date, "DD/MM/YYYY").format("YYYYMMDD");
        //   console.info(`./history/${folder}/${d}-${id}.txt`);
          return `./history/${folder}/${d}-${id}.txt`;
        }

        for (let n = 0; n < count; n++) {
          linkText = (await validLinks.nth(n).innerText())
          linkTexts = linkText.split(/\s+/);
        //   console.info(linkText);
        //   console.info(linkTexts);

          // check if already scrapped
          const proposeId = await validLinks.nth(n).locator('.matchNo-cell').innerText();
          if (fs.existsSync(getFilename(folder, linkTexts[0], proposeId))) {
            // console.info(`skipping ${proposeId} for already scrapped`);
            continue;
          }
          await validLinks.nth(n).locator(".last-odds").click();
          linkClicked = true;
          break;
        }

        if (!linkClicked) {
          // console.info(`no link found, done with team ${teamName}`);
          await page.waitForTimeout(timeout + _.random(0, timeout));
          break;
        }
        //////////////////////////

        // scrap
        const id = (await page.locator(".frontendid").first().innerText()).replace("Event ID: ", "");
        console.warn(`scrapping MATCH ${id}`);
        matchCount++;
        await page.locator(".coupon");

        let retries = 5;
        let text = "";
        while(retries > 0) {
          await page.waitForTimeout(timeout * 3);
          text = await page.locator(".fb-result-detail-container").first().innerText();

          if (!text.includes("Home/Away/Draw")) {
            console.warn("retrying", text);
            await page.waitForTimeout(timeout * 3);
            retries--;
          } else break;
        }

        // save to file
        fs.writeFile(
          getFilename(folder, linkTexts[0], id),
          linkTexts.join("\n") + text,
          (err) => err && console.warn(err)
        );

        await page
          .locator("div")
          .filter({ hasText: /^Previous page$/ })
          .locator("div")
          .click();
        await page.waitForTimeout(timeout + _.random(0, timeout));
      }
    } 
    
    m.add(1, 'day');
  }
  
});
