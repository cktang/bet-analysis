const fs = require("fs");
const _ = require("lodash");

const folders = [
    "2022-2023",
    "2023-2024",
    "2024-2025",
];

const baseFolder = "../../data/processed";

const matches = [];

const movingAverage = {
  add: (key, value) => {
    movingAverage[key] = movingAverage[key] || [];
    movingAverage[key].push(value);
    if (movingAverage[key].length > 6) {
      movingAverage[key].shift();
    }
    return movingAverage.get(key);
  },

  get: (key) => {
    console.log(key, movingAverage[key]);
    console.log(key, _(movingAverage[key]).map((v, i) => v*(i+1)).value());
    // return _(movingAverage[key]).map((v, i) => v*(i+1)).reduce((a, b) => a + b, 0) / movingAverage[key].length;
    return _(movingAverage[key]).mean();
  },
};

const transformToCSVObj = (match) => {
  const csv = {
    ...{ date: match.date },
    ...match["Event ID"],
    ...match.derived,
  };

  const ahs = _(match.derived['hkjc-team-ah']).map((v, k) => {
    // console.warn(k, v, match);
    const team = k.replace("ah-gain-", "");
    const homeAway = match["Event ID"].home == team ? "home" : "away";
    const homeAwayBet100 = homeAway == "home" ? match.derived["hkjc-ah-bet-100-home"] : match.derived["hkjc-ah-bet-100-away"];
    return {
      ...csv,
      ...{
        "hkjc-team-ah": team,
        "hkjc-team-homeAway": homeAway,
        "hkjc-team-homeAway-bet-100": homeAwayBet100,
        "hkjc-value-ah": v,
        "hkjc-value-ah-ma": movingAverage.add(`hkjc-value-ah-${team}`, v),
      },
    };
  }).value();

  // console.info(ahs);

  return ahs;
};

folders.forEach((folder) => {
    const files = fs.readdirSync(`${baseFolder}/${folder}`).filter((file) => file.endsWith(".txt"));
    files.forEach((file) => {
        console.info(`Reading ${baseFolder}/${folder}/${file}`);
        const match = JSON.parse(fs.readFileSync(`${baseFolder}/${folder}/${file}`, "ascii"));
        if (match["Event ID"].isVoid) return;

        match.derived = match["Event ID"].derived;
        delete match["Event ID"].derived;
        delete match["Event ID"].eqt;

        // console.info(match);
        matches.push(transformToCSVObj(match));
    });
});


// turn an array of js objects to a csv string
const objToCsv = (obj) => {
  
    const header = _(obj).map(item => _(item).keys().value()).flatten().uniq().value();
    const rows = obj.map((row) => header.map((h) => row[h] || "").join(","));
    return [header, ...rows].join("\n");
};

fs.writeFileSync("../../data/processed/all-matches-details.csv", objToCsv(_(matches).flatten().value()), "ascii");