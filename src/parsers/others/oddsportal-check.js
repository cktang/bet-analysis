const { match } = require("assert");
const moment = require("moment");
const fs = require("fs");
const _ = require("lodash");
const filename = "./../odds/oddsportal-parserd.json";

let matches = JSON.parse(fs.readFile(filename));

files.forEach((file) => {
  const data = fs.readFileSync(`${dir}/${file}`, "ascii");
  const d = moment(data.split("\n")[0], "DD/MM/YYYY").format("YYYYMMDD");
  fs.writeFileSync(`${dir}/${d}-${file}`, data);
});
