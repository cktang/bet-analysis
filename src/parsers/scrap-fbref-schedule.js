const { chromium } = require('playwright');
const fs = require('fs');
const { parse } = require('json2csv');

// Function to get season URL
function getSeasonUrl(season) {
    // Example season: "2023-2024"
    // Adjust base URL/path format if needed based on FBref structure
    return `https://fbref.com/en/comps/9/${season}/schedule/${season}-Premier-League-Scores-and-Fixtures`;
}

// Function to parse score string (e.g., "1–0") into FTHG, FTAG
function parseScore(scoreString) {
    if (!scoreString || !scoreString.includes('–')) { // Use en dash
        return { FTHG: null, FTAG: null };
    }
    const parts = scoreString.split('–');
    const fthg = parseInt(parts[0], 10);
    const ftag = parseInt(parts[1], 10);
    return {
        FTHG: isNaN(fthg) ? null : fthg,
        FTAG: isNaN(ftag) ? null : ftag,
    };
}


async function scrapeFbrefSchedule(season) {
    const url = getSeasonUrl(season);
    console.error(`Scraping FBref schedule for season: ${season} from URL: ${url}`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // --- Scroll Down to Trigger Lazy Loading ---
        console.error('Scrolling down the page...');
        await page.evaluate(async () => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            let lastHeight = document.body.scrollHeight;
            while (true) {
                window.scrollTo(0, document.body.scrollHeight);
                await delay(1000); // Wait for potential content loading
                let newHeight = document.body.scrollHeight;
                if (newHeight === lastHeight) {
                    break; // Stop scrolling if height doesn't change
                }
                lastHeight = newHeight;
            }
        });
        console.error('Finished scrolling.');
        // --- End Scrolling ---

        // Wait for the main schedule table using combined ID and class
        const tableSelector = 'table.stats_table';
        console.error(`Waiting for schedule table: ${tableSelector}`);
        await page.waitForSelector(tableSelector, { timeout: 60000 });
        console.error('Schedule table found.');

        // Evaluate directly on the page again
        const matches = await page.evaluate((selector) => {
            const scheduleTable = document.querySelector(selector);
            if (!scheduleTable || !scheduleTable.tBodies[0]) {
                console.error(`Could not find the schedule table (${selector}) or its tbody.`);
                return [];
            }
            const rows = Array.from(scheduleTable.tBodies[0].querySelectorAll('tr'));
            const data = [];

            for (const row of rows) {
                 // Skip spacer rows if they exist (FBref sometimes uses them)
                if (row.classList.contains('spacer') || row.classList.contains('thead')) continue;

                const cells = row.querySelectorAll('th, td'); // Header cell for Wk, data cells for others

                // Basic check for expected number of cells
                if (cells.length < 10) continue;

                const matchData = {
                    Wk: cells[0]?.textContent?.trim() || null,
                    Day: cells[1]?.textContent?.trim() || null,
                    Date: cells[2]?.querySelector('a')?.href ? new URL(cells[2].querySelector('a').href).pathname.split('/')[3] : cells[2]?.textContent?.trim() || null, // Extract YYYY-MM-DD from link
                    Time: cells[3]?.textContent?.trim() || null,
                    HomeTeam: cells[4]?.textContent?.trim() || null,
                    Home_xG: cells[5]?.textContent?.trim() || null,
                    Score: cells[6]?.textContent?.trim() || null,
                    Away_xG: cells[7]?.textContent?.trim() || null,
                    AwayTeam: cells[8]?.textContent?.trim() || null,
                    Attendance: cells[9]?.textContent?.trim().replace(/,/g, '') || null, // Remove commas from attendance
                    Venue: cells[10]?.textContent?.trim() || null,
                    Referee: cells[11]?.textContent?.trim() || null,
                    Match_Report_URL: cells[12]?.querySelector('a')?.href || null,
                };
                
                // Convert numerical fields
                matchData.Wk = matchData.Wk ? parseInt(matchData.Wk, 10) : null;
                matchData.Home_xG = matchData.Home_xG ? parseFloat(matchData.Home_xG) : null;
                matchData.Away_xG = matchData.Away_xG ? parseFloat(matchData.Away_xG) : null;
                matchData.Attendance = matchData.Attendance ? parseInt(matchData.Attendance, 10) : null;

                data.push(matchData);
            }
            return data;
        }, tableSelector); // Pass selector to evaluate

        console.error(`Scraped ${matches.length} potential match rows.`);

        // Further process to extract FTHG/FTAG and clean up
        const processedMatches = matches.map(match => {
            const { FTHG, FTAG } = parseScore(match.Score);
            return {
                Wk: match.Wk,
                Day: match.Day,
                Date: match.Date,
                Time: match.Time,
                HomeTeam: match.HomeTeam,
                AwayTeam: match.AwayTeam,
                FTHG: FTHG,
                FTAG: FTAG,
                Home_xG: match.Home_xG,
                Away_xG: match.Away_xG,
                Referee: match.Referee,
                Venue: match.Venue,
                Attendance: match.Attendance,
                Match_Report_URL: match.Match_Report_URL
            };
        }).filter(match => match.Date && match.HomeTeam && match.AwayTeam); // Filter out invalid rows

        console.error(`Processed ${processedMatches.length} valid matches.`);

        // Convert to CSV
         if (processedMatches.length > 0) {
            const fields = Object.keys(processedMatches[0]);
            const opts = { fields };
            const csv = parse(processedMatches, opts);
            console.log(csv); // Output CSV to console (stdout)
        } else {
            console.error("No valid match data found to output.");
        }


    } catch (error) {
        console.error(`Error scraping season ${season}:`, error);
    } finally {
        await browser.close();
    }
}

// --- Main Execution ---
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Usage: node scrap-fbref-schedule.js <season>');
    console.error('Example: node scrap-fbref-schedule.js 2023-2024');
    process.exit(1);
}

const seasonToScrape = args[0];
scrapeFbrefSchedule(seasonToScrape); 