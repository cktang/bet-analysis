const { match } = require("assert");
const moment = require("moment");
const fs = require("fs");
const _ = require("lodash");
const dir = "./../history";
const outDir = "./../parsed";

let files = fs.readdirSync(dir).filter((file) => file.startsWith("FB"));
// console.info(files);
// files = [ files[1] ];

files.forEach((file) => {
  const data = fs.readFileSync(`${dir}/${file}`, "ascii");
  const d = moment(data.split("\n")[0], "DD/MM/YYYY").format("YYYYMMDD");
  fs.writeFileSync(`${dir}/${d}-${file}`, data);
});
