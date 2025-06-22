const { writeFileSync } = require('fs');
const { chromium } = require('playwright');
const _ = require('lodash');
const moment = require('moment');
const { PAGES } = require('./teams');
const { hkjc_login, hkjc_logout, hkjc_bet_handicap } = require('./hkjc-util');

const betPlaced = [];

const trackingRules = {
    "Eng Premier": [
        match => {
            // if (Math.abs(match.ahHome) === 1.75)
            //   return match.oddsHome > match.oddsAway ? "home" : "away";
            const midOdds = 1.91;

            if (match.ahHome === -0.25) return "away";
            if (match.ahHome < -1 && match.oddsAway > midOdds) return "away";

            if (match.ahHome === -0.75) return 'home';
            if (match.ahHome === -1) return "home";
            if (match.ahHome >= 1 && match.oddsHome > midOdds) return "home";
            return null;
        },
    ],
    "Italian Division 1": [
        match => {
            if (Math.abs(match.ahHome) === 0.75) return 'away';
            return null;
        }
    ],
    "Spanish Division 1": [
        match => {
            if (match.ahHome === 0.25) return 'away';
            return null;
        }
    ],
    "German Division 1": [
        match => {
            if (match.ahHome === -1.25) return 'home';
            return null;
        }
    ],
    "French Division 1": [
        match => {
            if (match.ahHome === -0.25 && match.oddsAway > 1.91) return 'away';
            return null;
        }
    ]
}

// only bet on Eng Premier League matches
const pages = [ PAGES['Eng Premier'] ];

const BET_SIZE = 200;

console.warn('Starting bet tips tracker');
(async () => {
  const browser = await chromium.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  console.warn("Browser started");

  // Replace the selector with the actual selector for the match odds value
  const oddsSelector = ".match-row-container .match-row";

  while(true) {
    for (let i=0; i<pages.length; i++) {
        const name = "Eng Premier";
        const url = pages[i];
        console.warn("Opening page", url, moment().format("HH:mm:ss"));
        try {
            await page.goto("https://bet.hkjc.com/en/football/fgs");
            await page.goto(url);
            await page.waitForTimeout(1000 * 20);
        } catch (e) {
            console.warn(e);
            continue;
        }

        const trackOdds = async () => {
            // console.warn(name, "trackOdds", new Date().toTimeString());
            try {
                const findAh = (text) => {
                const list = text.split("/").map((v) => Number(v.trim()));
                return _(list).sum() / list.length;
                };

                let webTexts = await page.$$eval(oddsSelector, (elements) => {
                return elements
                    .filter((el) => el.offsetParent !== null) // Filter out invisible elements
                    .map((el) => el.innerText);
                });
                // console.warn(webTexts);

                const matches = webTexts
                .map((text) =>
                    _(text)
                    .split(/[\[\]\n]/)
                    .compact()
                    .value()
                )
                .map((arr) => {
                    if (arr.length === 13) {
                    //   '02/11/2024 20:30', 'FB3187',
                    //   'Newcastle',        '-0.5/-1',
                    //   'Arsenal',          '+0.5/+1',
                    //   '621',              '1',
                    //   '0',                '10',
                    //   '2nd',              '1.20',
                    //   '4.15'
                    const [
                        date,
                        id,
                        home,
                        away,
                        channel,
                        homeScore,
                        awayScore,
                        totalCorner,
                        live,
                        ahHome,
                        oddsHome,
                        ahAway,
                        oddsAway,
                    ] = arr;
                    return {
                        id,
                        home,
                        away,
                        date: date,
                        ahHome: findAh(ahHome),
                        ahAway: findAh(ahAway),
                        oddsHome: Number(oddsHome),
                        oddsAway: Number(oddsAway),
                        homeScore,
                        awayScore,
                        totalCorner,
                        live,
                    };
                    } else {
                        if (arr.length === 9) {
                            const [date, id, home, away, channel, ahHome, oddsHome, ahAway, oddsAway] = arr;
                            return {
                                id,
                                home,
                                away,
                                date: date,
                                ahHome: findAh(ahHome),
                                ahAway: findAh(ahAway),
                                oddsHome: Number(oddsHome),
                                oddsAway: Number(oddsAway),
                            };
                        } else if (arr.length === 8) {
                            const [date, id, home, away, ahHome, oddsHome, ahAway, oddsAway] = arr;
                            return {
                                id,
                                home,
                                away,
                                date: date,
                                ahHome: findAh(ahHome),
                                ahAway: findAh(ahAway),
                                oddsHome: Number(oddsHome),
                                oddsAway: Number(oddsAway),
                            };
                        } else {
                            // console.warn('Unknown format', arr);
                            return null;
                        }
                    }
                })
                .filter(match => {
                    if (!match) return false;
                    const decision = _(trackingRules[name]).map(rule => rule(match)).compact().value();
                    console.warn(name, moment(match.date, "DD/MM/YYYY HH:mm").fromNow(), match.home, "vs", match.away, { side: decision[0], handicap: match.ahHome, home: match.oddsHome, odds: match[`odds${_.capitalize(decision[0])}`] });
                    // console.warn(match, decision);
    
                    if (decision.length > 0) {
                        match.decision = decision;
                        return true;
                    }
                    return false;
                });

                for(let i=0; i<matches.length; i++) {
                    const match = matches[i];

                    // bet when match is about to begin
                    const mins = moment(match.date, "DD/MM/YYYY HH:mm").diff(moment(), "minutes");
                    if (mins < 0) return;
                    if (mins < 15) {
                        if (betPlaced.includes(match.id)) {
                            console.warn("Already placed bet", match.id);
                        } else {
                            console.warn('placing bet', match.id, mins);
                            await hkjc_login(page);
                            await hkjc_bet_handicap(page, match, BET_SIZE);
                            await hkjc_logout(page);

                            betPlaced.push(match.id);
                            writeFileSync(`./../../betPlaced/${moment().format("YYYY-MM-DD")}-${match.id}.json`, JSON.stringify(match));
                        }
                    }
                }
            } catch (e) {
                console.warn(e);
                browser.close();
                process.exit(1);
            }
        };

        await trackOdds();
        await page.waitForTimeout(1000 * 20);
    };
  }

})();