import { test } from "@playwright/test";
import _ from "lodash";
import fs from 'fs';
import moment from "moment";
import { timeout } from "rxjs";

test(`scrap HKJC teams`, async ({ page }) => {
  await page.goto("https://bet.hkjc.com/en/football/results");
  await page.setViewportSize({ width: 1080, height: 1080 });

  await page.locator(".searchBoxExpand").click();

  // choose date
  const year = "2024";
  const month = "October";
  await page.locator(".date-dd-arrow").click();
  await page.locator(".dateRangePickerYear").first().click();
  await page.locator(".monthDropdown").getByText(year).click();
  await page.locator(".dateRangePickerMonth").first().click();
  await page.locator(".monthDropdown").getByText(month).click();
  await page.locator(".datePickerDay").getByText("1", { exact: true }).first().click();
  await page.locator(".datePickerDay").getByText("28", { exact: true }).first().click();


  await page.locator("#FBFilterSelectDrd").click();
  const items = await page
    .locator("ul.filterItem")
    .innerText();
  const teams = items.split("\n");
  teams.shift();
  console.log(teams);
  await page.locator("#FBFilterSelectDrd").click();

  // const teamNamesMap = items.reduce((acc, item) => {
  //   const match = item.match(/(.+)\((.+)\)/);
  //   if (match) {
  //     const [, name, chiName] = match;
  //     acc[name] = item;
  //     acc[chiName] = item;
  //   }
  //   return acc;
  // }, {} as Record<string, string>);
  // console.log(teamNamesMap);
  // fs.writeFileSync(
  //   "parsed/team-names.json",
  //   JSON.stringify(teamNamesMap, null, 2)
  // );

  const timeout = 500;
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    console.log("scrap", team);
    await page.waitForTimeout(timeout * 2);

    await page.locator("#FBFilterSelectDrd").click();
    await page.getByPlaceholder("Search Team").fill(team);
    await page.getByTitle(team).click();
    await page.getByRole("button", { name: "Search" }).click();
  };
});