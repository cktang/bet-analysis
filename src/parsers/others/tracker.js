const { writeFileSync } = require('fs');
const { chromium } = require('playwright');
const { interval } = require('rxjs');
const _ = require('lodash');
const moment = require('moment');
const { GetMatchKey } = require('./util');

console.warn('Starting tracker');
(async () => {
    const browser = await chromium.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1080, height: 1080 });
    await page.goto("https://bet.hkjc.com/en/football/hdc?tournid=50000051");

    // Replace the selector with the actual selector for the match odds value
    const oddsSelector = '.match-row-container .match-row';

    let lastMatches;
    const trackOdds = async () => {
        // console.warn('trackOdds', new Date().toTimeString());
        try {        
            const findAh = (text) => {
                const list = text.split("/").map((v) => Number(v.trim()));
                return _(list).sum() / list.length;
            };

            let webTexts = await page.$$eval(oddsSelector, (elements) => {
                return elements
                    .filter((el) => el.offsetParent !== null) // Filter out invisible elements
                    .map((el) => el.innerText);
            })

            const matches = webTexts
                .map((text) => _(text).split(/[\[\]\n]/).compact().value())
                .map(arr => {
                    if (arr.length === 13) {
//   '02/11/2024 20:30', 'FB3187',
//   'Newcastle',        '-0.5/-1',
//   'Arsenal',          '+0.5/+1',
//   '621',              '1',
//   '0',                '10',
//   '2nd',              '1.20',
//   '4.15'
                        const [date, id, home, ahHome, away, ahAway, channel, homeScore, awayScore, totalCorner, live, oddsHome, oddsAway] = arr;
                        return { 
                            id, home, away,
                            date: date, 
                            ahHome: findAh(ahHome), 
                            ahAway: findAh(ahAway), 
                            oddsHome: Number(oddsHome), 
                            oddsAway: Number(oddsAway),
                            homeScore, awayScore, totalCorner, live
                        }
                    } else {
                        const [date, id, home, ahHome, away, ahAway, channel, oddsHome, oddsAway] = arr;
                        return { 
                            id, home, away,
                            date: date, 
                            ahHome: findAh(ahHome), 
                            ahAway: findAh(ahAway), 
                            oddsHome: Number(oddsHome), 
                            oddsAway: Number(oddsAway)
                        }
                    }
                });
                
            const updatedRecords = matches.filter(match => {
                if (!lastMatches) {
                  console.warn(match);
                  return true;
                }

                const record = lastMatches.find(m => GetMatchKey(m) === GetMatchKey(match));
                const hasChanged = (record, recordNew) => {
                    return record && (
                        record.oddsHome !== recordNew.oddsHome ||
                        record.oddsAway !== recordNew.oddsAway
                    );
                };

                const isValid = match => {
                    return isFinite(match.oddsHome) && isFinite(match.oddsAway) && match.oddsHome > 0 && match.oddsAway > 0;
                }

                const isExpired = match => {
                    const matchDateTime = moment(match.date, 'DD/MM/YYYY HH:mm');
                    return matchDateTime.isBefore(moment());
                };

                // console.warn(record, hasChanged(record, match), isValid(match));
                if (record && hasChanged(record, match) && isValid(match)) {
                    console.log('Odds Changed:', moment().format());
                    console.log(match);
                    return true;
                }

                return false;
            });


            if (updatedRecords.length > 0) {
                // console.warn(updatedRecords);
                lastMatches = matches;

                const ts = new Date().getTime();
                const output = updatedRecords.map(match => {
                    return {
                        ...match, 
                        ts, 
                        ...{date: moment(match.date, 'DD/MM/YYYY').format("YYYY-MM-DD")} 
                    };
                });
                writeFileSync(`./../../tracker/odds-movement/${new Date().getTime()}.json`, JSON.stringify(output, null, 2));
            }
        } catch(e) {
            console.warn(e);
            browser.close();
            process.exit(1);
        }
    };

    console.warn('starting interval');
    interval(2000).subscribe(n => {
        trackOdds();
    });
})();