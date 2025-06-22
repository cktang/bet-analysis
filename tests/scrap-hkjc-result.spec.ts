import { test } from "@playwright/test";
import _ from "lodash";
import fs from 'fs';
import moment from "moment";
import { LEAGUES, TEAMS, YEARS } from "../src/parsers/others/teams";

// Only process English Premier League
const leagues = ["Eng Premier"];
const folders = ["2024-2025"]; // Only process 2024-2025 season for April-June 2025 data

for (const league of leagues) {
  for (const folder of folders) {
    test(`scrap HKJC: ${league} ${folder}`, async ({ page }) => {
      // user input
      // const currentMonth = moment().format("MM");
      // const startDate = moment(folder.split("-")[0] + `-${currentMonth}-01`);
      // const endDate = moment().set("date", 1).add(1, "month");

      // const startDate = moment(`2024-11-01`); // Original target
      // const endDate = moment(`2024-12-01`);   // Original target

      // Configurable date range - can be set via environment variables or defaults
      const START_MONTH = process.env.START_MONTH || '04'; // April
      const START_YEAR = process.env.START_YEAR || '2025';
      const END_MONTH = process.env.END_MONTH || '06'; // June
      const END_YEAR = process.env.END_YEAR || '2025';
      
      const startDate = moment(`${START_YEAR}-${START_MONTH}-01`);
      const endDate = moment(`${END_YEAR}-${END_MONTH}-01`).endOf('month'); 

      const timeout = 300;
      test.setTimeout(timeout * 500000);

      const teams = TEAMS[league][folder] ?? [];
      console.warn(teams);

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

      // --- Corrected Date Loop Logic ---
      let currentMonthStart = moment(startDate).startOf('month');
      const finalEndDate = moment(); // Use today as the actual end date

      while (currentMonthStart.isSameOrBefore(finalEndDate, 'month')) {
        const currentMonthEnd = moment(currentMonthStart).endOf('month');
        // Ensure we don't go past the overall end date for the last month
        const actualEndDateForMonth = moment.min(currentMonthEnd, finalEndDate);

        const month = currentMonthStart.format("MMMM");
        const year = currentMonthStart.format("YYYY");
        // Use 1 for the start day, and the calculated last day for the end day
        const firstDayOfMonth = "1"; 
        const lastDayOfMonth = actualEndDateForMonth.format("D");

        console.info(`Processing month: ${year} ${month} (Days ${firstDayOfMonth} to ${lastDayOfMonth})`);

        // Choose date range in picker
        try {
          await page.locator(".date-dd-arrow").click();
          await page.locator(".dateRangePickerYear").first().click();
          await page.locator(".monthDropdown").getByText(year).click();
          await page.locator(".dateRangePickerMonth").first().click();
          await page.locator(".monthDropdown").getByText(month).click();
          await page
            .locator(".datePickerDay")
            .getByText(firstDayOfMonth, { exact: true })
            .first() // Ensure clicking the correct element if duplicates exist
            .click();
          await page
            .locator(".datePickerDay")
            .getByText(lastDayOfMonth, { exact: true })
            .last() // Ensure clicking the correct element if duplicates exist
            .click();
        } catch (e) {
            console.error(`Error selecting date range ${year}-${month}: ${e}`);
            // Optionally skip this month or exit
            currentMonthStart.add(1, 'month'); // Move to next month regardless
            continue; 
        }

        // scrap each team for the selected month range
        for (const teamName in teams) {
          // filter by team
          console.log(`scrapping ${teams[teamName]}`);
          await page.locator("#FBFilterSelectDrd").click();
          await page.getByPlaceholder("Search Team").fill(teams[teamName]);
          await page.getByTitle(teams[teamName]).click();
          await page.getByRole("button", { name: "Search" }).click();

          // loop through all match links until no more matches found to scrap in this page
          while (true) {
            // await page.getByText("Matches 1 -").click();
            await page.waitForTimeout(timeout * 2);
            const isLoading =
              (await page.locator(".loading-container").count()) > 0;
            const noMatch = (await page.locator(".noMatchResult").count()) > 0;
            if (isLoading) {
              console.info(`loading...`);
              continue;
            }
            if (noMatch) {
              console.info(`no matches for ${teamName}`);
              break;
            }

            // find a valid match to go into
            const tables = await page.locator(".table-row");
            const validLinks = tables.filter({ has: page.getByTitle(league) });
            const count = await validLinks.count();
            if (count == 0) {
              console.info(`Cannot find link for ${teamName}`);
              await page.waitForTimeout(timeout + _.random(0, 2000));
              break;
            }

            let linkText = "";
            let linkTexts;

            let linkClicked = false;
            const getFilename = (league, folder, date, id) => {
              const d = moment(date, "DD/MM/YYYY").format("YYYYMMDD");
              return `./data/raw/${league}/${folder}/${d}-${id}.txt`;
            };
            for (let i = 0; i < count; i++) {
              const validLink = validLinks.nth(i);
              linkText = await validLink.innerText();
              linkTexts = linkText.split(/\s+/);

              // check if already scrapped
              const proposeId = linkTexts[1];
              if (
                fs.existsSync(
                  getFilename(league, folder, linkTexts[0], proposeId)
                )
              ) {
                console.info(`skipping ${proposeId} for already scrapped`);
                continue;
              } else {
                console.warn(`scrapping ${proposeId}`);
              }
              await validLink.locator(".last-odds").click();
              linkClicked = true;
              break;
            }

            if (!linkClicked) {
              console.info(`no link found, done with team ${teamName}`);
              await page.waitForTimeout(timeout + _.random(0, 2000));
              break;
            }
            //////////////////////////

            // scrap
            const id = (
              await page.locator(".frontendid").first().innerText()
            ).replace("Event ID: ", "");
            await page.locator(".coupon");

            let retries = 5;
            let text = "";
            while (retries > 0) {
              await page.waitForTimeout(timeout * 3);
              text = await page
                .locator("section.LAST_ODDS")
                .first()
                .innerText();

              if (!text.includes("Home/Away/Draw")) {
                console.warn("retrying", text);
                await page.waitForTimeout(timeout * 3);
                retries--;
              } else break;
            }

            // save to file
            fs.writeFile(
              getFilename(league, folder, linkTexts[0], id),
              linkTexts.join("\n") + text,
              (err) => err && console.warn(err)
            );

            page.click("text=Previous page");
            await page.waitForTimeout(timeout + _.random(0, 2000));
          }
        }

        // Move to the next month
        currentMonthStart.add(1, 'month');
      } // --- End of Corrected Date Loop ---
    });
  }
}
