import { test } from "@playwright/test";
import _ from "lodash";
import fs from 'fs';
import moment from "moment";

const teams = {
  Arsenal: "Arsenal(阿仙奴)",
  "Aston Villa": "Aston Villa(阿士東維拉)",
  Bournemouth: "Bournemouth(般尼茅夫)",
  Brentford: "Brentford(賓福特)",
  Brighton: "Brighton(白禮頓)",
  Chelsea: "Chelsea(車路士)",
  "Crystal Palace": "Crystal Palace(水晶宮)",
  Everton: "Everton(愛華頓)",
  Fulham: "Fulham(富咸)",
  Ipswich: "Ipswich(葉士域治)",
  Leicester: "Leicester(李斯特城)",
  Liverpool: "Liverpool(利物浦)",
  "Manchester City": "Manchester City(曼城)",
  "Manchester Utd": "Manchester Utd(曼聯)",
  Newcastle: "Newcastle(紐卡素)",
  "Nottingham Forest": "Nottingham Forest(諾定咸森林)",
  Southampton: "Southampton(修咸頓)",
  Tottenham: "Tottenham(熱刺)",
  "West Ham": "West Ham(韋斯咸)",
  Wolves: "Wolves(狼隊)",

  // 2023 teams
  Burnley: "Burnley(般尼)",
  Luton: "Luton(盧頓)",
  "Sheff Utd": "Sheff Utd(錫菲聯)",

  // // 2022 teams
  Leeds: "Leeds(列斯聯)",

  // // 2021 teams
  Norwich: "Norwich(諾域治)",
  Watford: "Watford(屈福特)",

  // // 2020 teams
  "West Bromwich": "West Bromwich(西布朗)",
};

// user input
let files = fs.readdirSync("./history/corrupted").filter((file) => !file.startsWith("."));
let data = files.map((file) => {
    const [date, id] = file.replace(".txt", "").split("-");
    const content = fs.readFileSync("./history/corrupted/" + file, "ascii");
    let teamName = "";
    for (const line of content.split("\n")) {
      if (_(teams).keys().value().includes(line)) {
        teamName = teams[line];
      }
    }

    return { date, id, teamName };
});

const timeout = 2000;

test("fix corrupt scrap HKJC result", async ({ page }) => {
  test.setTimeout(timeout * 5000);

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

  for (const item of data) {
      const m = moment(item.date, "YYYYMMDD");
      const month = m.format("MMMM");
      const year = m.format("YYYY");
      const date = m.format("D");
      console.info("scrapping", item.teamName, item.date, item.id);

      // choose date
      await page.locator(".date-dd-arrow").click();
      await page.locator(".dateRangePickerYear").first().click();
      await page.locator(".monthDropdown").getByText(year).click();
      await page.locator(".dateRangePickerMonth").first().click();
      await page.locator(".monthDropdown").getByText(month).click();
      if (Number(date) > 15) {
        await page.locator(".datePickerDay").getByText(date, { exact: true }).last().click();
        await page.locator(".datePickerDay").getByText(date, { exact: true }).last().click();
      } else {
        await page.locator(".datePickerDay").getByText(date, { exact: true }).first().click();
        await page.locator(".datePickerDay").getByText(date, { exact: true }).first().click();
      }

      // filter by team
      await page.locator("#FBFilterSelectDrd").click();
      await page.getByPlaceholder("Search Team").fill(item.teamName);
      await page.getByText(item.teamName).first().click();
      await page.getByRole("button", { name: "Search" }).click();
      await page.getByText("Matches 1 -").click();

      // find a valid match to go into
      const tables = await page.locator(".table-row");
      const validLinks = tables.filter({ has: page.getByText(item.id) });
      const count = await validLinks.count();
      if (count == 0) {
        console.info(`Cannot find link for ${item.teamName}`);
        await page.waitForTimeout(timeout + _.random(0, 2000));
        break;
      }

      let linkText = "";
      let linkTexts;

      const getFilename = (folder, date, id) => {
        const d = moment(date, "DD/MM/YYYY").format("YYYYMMDD");
        return `./history/${folder}/${d}-${id}.txt`;
      };

      const validLink = validLinks.nth(0);
      linkText = await validLink.innerText();
      linkTexts = linkText.split(/\s+/);

      await validLink.locator(".last-odds").click();
      //////////////////////////

      // scrap
      const id = (
        await page.locator(".frontendid").first().innerText()
      ).replace("Event ID: ", "");
      await page.locator(".coupon");
      await page.waitForTimeout(timeout * 3);

      const text = await page
        .locator(".fb-result-detail-container")
        .first()
        .innerText();

      // save to file
      fs.writeFile(
        getFilename("./", linkTexts[0], id),
        linkTexts.join("\n") + text,
        (err) => err && console.warn(err)
      );

      await page.getByText("Previous page").click();
      await page.waitForTimeout(timeout + _.random(0, 2000));
  }
});

