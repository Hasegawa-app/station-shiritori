const fs = require("fs");
const path = require("path");
const iconv = require("iconv-lite");
const { parse } = require("csv-parse/sync");

const inputPath = path.join(__dirname, "../data/eki.csv");
const outputPath = path.join(__dirname, "../data/stations.json");

const buffer = fs.readFileSync(inputPath);
const csvText = iconv.decode(buffer, "shift_jis");

const rows = parse(csvText, {
  columns: false,
  skip_empty_lines: true,
});

const stations = rows.map((row, index) => {
  const name = row[0]?.trim() ?? "";
  const kana = row[1]?.trim() ?? "";
  const line = row[2]?.trim() ?? "";

  return {
    id: String(index + 1),
    name,
    shortName: name
  .replace(/\(.+\)/g, "")
  .replace(/\(.+\)/g, "")
  .replace(/駅$/, "")
  .replace(/停留場$/, "")
  .replace(/電停$/, ""),
    kana,
    line,
  };
});

fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2), "utf8");

console.log(`${stations.length} stations generated.`);