const { match } = require("assert");
const fs = require("fs");
const _ = require("lodash");
const moment = require("moment");
const { TEAMS, LEAGUES } = require("./others/teams");

// Get year from command line argument or default to current year
const targetYear = process.argv[2] || new Date().getFullYear().toString();
console.log(`Processing OddsPortal data for year: ${targetYear}`);

for (const league of LEAGUES) {
  const filename = `./../../data/raw/oddsportal/oddsportal-result-${targetYear}.txt`;
  const outFilename = `./../../data/raw/oddsportal/oddsportal-parsed-${targetYear}.json`;

  // Check if input file exists
  if (!fs.existsSync(filename)) {
    console.warn(`Input file not found: ${filename}`);
    console.warn(`Falling back to default: oddsportal-result.txt`);
    const fallbackFilename = `./../../data/raw/oddsportal/oddsportal-result.txt`;
    if (!fs.existsSync(fallbackFilename)) {
      console.error(`No input file found for processing.`);
      continue;
    }
    // Copy fallback to year-specific filename for consistency
    fs.copyFileSync(fallbackFilename, filename);
  }

  const teams = _(TEAMS[league])
    .keys()
    .map((year) => {
      return TEAMS[league][year];
    })
    .reduce((acc, val) => {
      return { ...acc, ...val };
    }, {});
  console.warn(teams);

  const rules = {
    dateToday: {
      matcher: (line) => line.match(/Today/),
    },

    dateYesterday: {
      matcher: (line) => line.match(/Yesterday/),
    },

    date: {
      matcher: (line) => line.match(/(\d{2} [A-Z][a-z]{2} \d{4})/),
    },

    time: {
      matcher: (line) => line.match(/(\d{2}:\d{2})/),
    },

    teams: {
      matcher: (line) => _(teams).keys().value().includes(line),
      linesFollow: 14,
    },
  };

  const data = fs.readFileSync(filename, "utf8");
  const lines = data.split("\n");

  let matches = [];
  let item = {};

  const saveItem = (item) => {
    // Filter matches by target year if specified
    if (targetYear && item.date) {
      const matchYear = new Date(item.date).getFullYear().toString();
      if (matchYear !== targetYear) {
        return; // Skip matches from other years
      }
    }
    matches.push(_(item).cloneDeep());
    console.info(item.id);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (rules.date.matcher(line)) {
      item.date = moment(line, "DD MMM YYYY").format("YYYY-MM-DD");
    }

    if (rules.dateToday.matcher(line) || rules.dateYesterday.matcher(line)) {
      item.date = moment(line.split(",")[1].trim(), "DD MMM").format(
        "YYYY-MM-DD"
      );
    }

    if (rules.time.matcher(line)) {
      item.time = moment(line, "HH:mm").format("HH:mm");
    }

    if (rules.teams.matcher(line)) {
      const result = _(lines)
        .slice(i, i + rules.teams.linesFollow)
        .compact()
        .value();
      item.home = result[0];
      item.away = result[4];
      item.had = {
        home: Number(result[5]),
        draw: Number(result[6]),
        away: Number(result[7]),
      };
      const home = (teams[item.home] || item.home).split("(")[0].trim();
      const away = (teams[item.away] || item.away).split("(")[0].trim();
      item.id = `${item.date} ${home} vs ${away}`;
      saveItem(item);
      i += rules.teams.linesFollow;
    }
  }

  console.info(`Writing ${matches.length} matches for year ${targetYear} to:`, `${outFilename}`);
  fs.writeFileSync(`${outFilename}`, JSON.stringify(matches, null, 2));
}
