const fs = require("fs");
const _ = require("lodash");
const { LEAGUES, YEARS } = require("./teams");

const leagues = LEAGUES;
const baseFolder = "./../../data/processed";

const transformToCSVObj = (match) => {
  const csv = {
    ...{ date: match.date },
    ...match["Event ID"],
    ...match.derived,
    // ...match.derived['hkjc-team-ah'],
  };

  console.info(csv);

  return csv;
};

// turn an array of js objects to a csv string
const objToCsv = (obj) => {
  const header = _(obj)
    .map((item) => _(item).keys().value())
    .flatten()
    .uniq()
    .value();
  const rows = obj.map((row) => header.map((h) => row[h]).join(","));
  return [header, ...rows].join("\n");
};

leagues.forEach((league) => {
  const matches = [];

  folders = YEARS[league];
  folders.forEach((folder) => {
    const path = `${baseFolder}/${league}/${folder}`;
    const files = fs.readdirSync(path).filter((file) => file.endsWith(".txt"));
    files.forEach((file) => {
      console.info(`Reading ${path}/${file}`);
      const match = JSON.parse(fs.readFileSync(`${path}/${file}`, "ascii"));
      if (match["Event ID"].isVoid) return;

      match.derived = match["Event ID"].derived;
      delete match["Event ID"].derived;
      delete match["Event ID"].eqt;

      // console.info(match);
      matches.push(transformToCSVObj(match));
    });
  });

  fs.writeFileSync(`./../../data/processed/${league}/all-matches.csv`, objToCsv(matches), "ascii");
});

