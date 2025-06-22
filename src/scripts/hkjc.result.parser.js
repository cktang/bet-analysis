const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const { LEAGUES, YEARS } = require('./teams');

LEAGUES.forEach(league => {
  console.warn("working on", league);
  
  YEARS[league].forEach(year => {
    const folder = year;

    const dir = `./../history/${league}/${folder}`;
    const outDir = `./../parsed/${league}/${folder}`;

    const getOddsPortalDetails = () => {
      const matches = JSON.parse(fs.readFileSync(`./../history/${league}/odds/oddsportal-parsed.json`));
      // console.info(matches);

      const idMap = {};
      matches.forEach((match) => {
        idMap[match.id] = match;
      });
      return idMap;
    };
    const oddsPortalDetails = getOddsPortalDetails();
    // console.info(oddsPortalDetails);

    const findCut = values => {
      const sum = _(values).map((n) => 1 / Number(n)).sum();
      return _.round(100 * (sum - 1), 2); 
    }

    const handicapConverter = handicap => {
        if (!handicap) return null;
        handicap = handicap.split(/(?=\[)/g)[1] || handicap;
        handicap = handicap.replace(/[\[\]]/g, '');
        handicap = handicap.split('/');
        handicap = handicap.map(h => Number(h));
        return _(handicap).mean();
    }

    const valueGetters = {
      e: (lines) => {
        if (!lines) return {};
        const halfVsPosition = lines.indexOf(":");
        const fullVsPosition = _(lines).lastIndexOf(":");
        const teams = lines
          .slice(1, halfVsPosition - 1)
          .join(" ")
          .split(` vs `)
          .map((t) => t.split(" Void")[0]);
        const halfTimeScore = lines.slice(
          halfVsPosition - 1,
          halfVsPosition + 2
        );
        const fullTimeScore = lines.slice(
          fullVsPosition - 1,
          fullVsPosition + 2
        );
        const isVoid = lines.includes("Void");
        if (isVoid) console.info("Void", lines);

        const getHandicap = (obj) => obj["Handicap Line"] || obj["Handicap"];

        return {
          id: lines[0],
          isVoid: isVoid,
          home: teams[0],
          away: teams[1],
          htScore: `${halfTimeScore[0]}:${halfTimeScore[2]}`,
          score: `${fullTimeScore[0]}:${fullTimeScore[2]}`,
          homeScore: Number(fullTimeScore[0]),
          awayScore: Number(fullTimeScore[2]),

          eqt: {
            line: (obj) =>
              obj["Event ID"].homeScore - obj["Event ID"].awayScore,
            hiLo: (obj) =>
              obj["Event ID"].homeScore + obj["Event ID"].awayScore,

            "hkjc-had-cut": (obj) => {
              const lines = _(obj["Home/Away/Draw"]).values().value();
              return findCut(lines);
            },

            "hkjc-oe-cut": (obj) => {
              const lines = _(obj["Odd/Even"]).values().value();
              return findCut(lines);
            },

            // calculate the percentage of the line being cut by HKJC
            "hkjc-ah-cut": (obj) => {
              const lines = _(getHandicap(obj)).values().map(1).value();

              // equal line so need to duplicate
              if (lines.length === 1) lines.push(lines[0]);
              return findCut(lines);
            },

            "hkjc-ah": (obj) => {
              const hh = getHandicap(obj);
              if (!hh) return "N/A";
              return (hh.home?.[0] || hh.draw?.[0] || hh.away?.[0]) * -1 || 0;
            },

            "hkjc-real-ah": (obj) => {
              const ah = obj["Event ID"].eqt["hkjc-ah"](obj);
              if (!_.isFinite(ah)) return null;
              return ah ? ah * -1 : 0;
            },

            "hkjc-ah-accuracy": (obj) => {
              const ah = obj["Event ID"].eqt["hkjc-ah"](obj);
              if (!_.isFinite(ah)) return null;
              const line = obj["Event ID"].eqt.line(obj);
              return line - ah;
            },

            "hkjc-team-ah": (obj) => {
              const accuracy = obj["Event ID"].eqt["hkjc-ah-accuracy"](obj);
              const home = obj["Event ID"].home;
              const away = obj["Event ID"].away;

              return {
                [`ah-gain-${home}`]: accuracy,
                [`ah-gain-${away}`]: -accuracy,
              };
            },

            "hkjcVsPublic-result": (obj) => {
              const result = obj["Event ID"].eqt.result(obj);
              const oddsPortal = obj.oddsPortal;
              const hkjcOdds = obj["Event ID"].eqt["odds-had"](obj);
              const oddsPortalOdds = oddsPortal?.had[result];

              return _.round((100 * (hkjcOdds - oddsPortalOdds)) / hkjcOdds, 3);
            },

            result: (obj) => {
              const line = Number(obj["Event ID"].eqt.line(obj));
              if (line > 0) return "home";
              if (line < 0) return "away";
              return "draw";
            },

            "ah-result": (obj) => {
              const diff = obj["Event ID"].eqt["hkjc-ah-accuracy"](obj);
              if (!diff) return null;

              if (diff === 0) return "draw";
              if (diff === 0.25) return "home-half";
              if (diff === -0.25) return "away-half";
              if (diff > 0) return "home";
              else return "away";
            },

            oe: (obj) => {
              return (obj["Event ID"].homeScore + obj["Event ID"].awayScore) %
                2 ==
                0
                ? "even"
                : "odd";
            },

            "odds-correctScore": (obj) =>
              obj["Correct Score"][obj["Event ID"].score],

            "odds-had": (obj) => {
              const result = obj["Event ID"].eqt.result(obj);
              if (result === "home") return obj["Home/Away/Draw"].home;
              if (result === "away") return obj["Home/Away/Draw"].away;
              return obj["Home/Away/Draw"].draw;
            },

            "odds-oddsEven": (obj) => {
              const oddsEven = obj["Event ID"].eqt.oe(obj);
              return obj["Odd/Even"][oddsEven];
            },

            "odds-ah": (obj) => {
              const result = obj["Event ID"].eqt["ah-result"](obj);
              if (!result) return null;
              if (result === "draw") return 1;
              const odds = getHandicap(obj)[(result + "").substring(0, 4)][1];
              return odds;
            },

            "odds-ah-home": (obj) => {
              const odds = getHandicap(obj)["home"][1];
              return odds;
            },

            "odds-ah-away": (obj) => {
              const odds = getHandicap(obj)["away"][1];
              return odds;
            },

            "hkjc-ah-bet-100-home": (obj) => {
              const base = 100;
              const result = obj["Event ID"].eqt["ah-result"](obj);
              if (!result) return base;
              const odds =
                getHandicap(obj)?.[(result + "").substring(0, 4)]?.[1];

              switch (result) {
                case "home":
                  return base * odds;
                case "home-half":
                  return base / 2 + (base / 2) * odds;
                case "away-half":
                  return base / 2;
                case "away":
                  return 0;
                case "draw":
                default:
                  return base;
              }
            },

            "hkjc-ah-bet-100-away": (obj) => {
              const base = 100;
              const result = obj["Event ID"].eqt["ah-result"](obj);
              if (!result) return base;

              const odds =
                getHandicap(obj)?.[(result + "").substring(0, 4)]?.[1];

              switch (result) {
                case "away":
                  return base * odds;
                case "away-half":
                  return base / 2 + (base / 2) * odds;
                case "home-half":
                  return base / 2;
                case "home":
                  return 0;
                case "draw":
                default:
                  return base;
              }
            },
          },
        };
      },

      had: (lines) => {
        if (!lines) return {};
        return {
          home: Number(lines[3]),
          draw: Number(lines[4]),
          away: Number(lines[5]),
        };
      },

      handicap: (lines) => {
        if (!lines) return {};
        return {
          home: [handicapConverter(lines[2]), Number(lines[3])],
          away: [handicapConverter(lines[4]), Number(lines[5])],
        };
      },

      handicapLine: (lines) => {
        if (!lines) return {};
        return {
          home: [handicapConverter(lines[2]), Number(lines[4])],
          away: [handicapConverter(lines[3]), Number(lines[5])],
        };
      },

      OE: (lines) => {
        if (!lines) return {};
        return {
          odd: Number(lines[2]),
          even: Number(lines[3]),
        };
      },

      score: (lines) => {
        if (!lines) return {};
        return _(lines)
          .slice(3)
          .filter((line, i) => !(line.startsWith("(") && line.endsWith(")")))
          .chunk(2)
          .map((arr) => [arr[0], Number(arr[1])])
          .fromPairs()
          .value();
      },

      HaFu: (lines) => {
        if (!lines) return {};
        return _(lines)
          .chunk(2)
          .map((arr) => [arr[0], Number(arr[1])])
          .fromPairs()
          .value();
      },

      hiLo: (lines) => {
        if (!lines) return {};
        const chunks = _(lines).chunk(3).omit(0).values().value();
        return chunks
          .map((chunk) => ({
            [handicapConverter(chunk[0])]: {
              high: Number(chunk[1]),
              low: Number(chunk[2]),
            },
          }))
          .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      },
    };

    const keysMap = {
      date: {
        lineNumber: 0,
        valueGetter: (line) => moment(line, "DD/MM/YYYY").format("YYYY-MM-DD"),
      },
      "Event ID": {
        lineNumber: 1,
        linesFollow: 15,
        valueGetter: valueGetters.e,
      },

      "Home/Away/Draw": { valueGetter: valueGetters.had },
      "First Half HAD": { valueGetter: valueGetters.had },
      "Handicap HAD": { valueGetter: valueGetters.had },
      Handicap: { valueGetter: valueGetters.handicap },
      "Handicap Line": { valueGetter: valueGetters.handicapLine },
      HiLo: {
        valueGetter: valueGetters.hiLo,
        until: "HiLo- Last Odds for In Play Betting",
      },
      "First Half HiLo": {
        valueGetter: valueGetters.hiLo,
        until: "First Half HiLo- Last Odds for In Play Betting",
      },
      "Corner Taken HiLo": {
        valueGetter: valueGetters.hiLo,
        until: "Corner Taken HiLo- Last Odds for In Play Betting",
      },
      "Correct Score": {
        valueGetter: valueGetters.score,
        until: "Correct Score- Last Odds for In Play Betting",
      },
      "First Half Correct Score": {
        valueGetter: valueGetters.score,
        until: "First Half Correct Score- Last Odds for In Play Betting",
      },
      "First Team to Score": {
        valueGetter: valueGetters.had,
        until: "Next Team To Score- Last Odds for In Play Betting",
      },
      "Odd/Even": {
        valueGetter: valueGetters.OE,
        linesFollow: 4,
      },
      HaFu: {
        valueGetter: valueGetters.HaFu,
        linesFollow: 18,
      },
    };

    const commonAttributes = {
        linesFollow: 6,
    }

    let files = fs.readdirSync(dir)
      .filter(file => !file.startsWith('.'))
      // .filter(file => file.includes("20231216-FB9642"));
    console.info(files);
    // files = [ files[1] ];

    files.forEach(file => {
        console.info("reading", `${dir}/${file}`);
        const data = fs.readFileSync(`${dir}/${file}`, 'ascii');
        if (!data.includes(league)) {
          console.warn("Not ${league} data", data);
          return;
        }

        const lines = data.split("\n");
        let result = {};

        const keys = _(keysMap).keys().value();
        // console.info(files, keys, lines[1]);
        lines.forEach((line, i) => {
            let attrs = { ...commonAttributes, ...keysMap[line] };
            let matched = {};

            _(keysMap).each((v, k) => {
                if (v.lineNumber === i) {
                    matched = [k, v.valueGetter(lines.slice(i, i + 1 + v.linesFollow || 1))];
                }

                if (v.startsWith && line.startsWith(k)) {
                    matched = [k, lines.slice(i, i + 1 + v.linesFollow || 1)];
                    attrs = { ...attrs, ...keysMap[k] };
                }
            });

            if (keys.includes(line)) {
                // console.warn(keys, line);
                if (attrs.until) {
                    matched = [line, lines.slice(i + 1, lines.indexOf(attrs.until))];
                } else if (attrs.linesFollow) {
                    matched = [line, lines.slice(i + 1, i + 1 + attrs.linesFollow)];
                }
            }

            if (matched.length > 0) {
                const obj = {};
                obj[matched[0]] = attrs.valueGetter
                    ? attrs.valueGetter(matched[1])
                    : matched[1];

                result = {...result, ...obj};
            }

        });

        result.id = result.date + " " + result['Event ID'].home + ' vs ' + result['Event ID'].away;
        result.oddsPortal = oddsPortalDetails[result.id];
        // console.warn(result.id, result.oddsPortal, _(oddsPortalDetails).keys().value());

        const eventID = result["Event ID"];
        if (!eventID.isVoid) {
          eventID.derived = _(eventID.eqt).mapValues((fn, key) => {
            try {
              return fn(result)
            } catch (e) {
              console.error(key);
              console.error(e);
              return null;
            }
          }).value();

          console.info('writing to', `${outDir}/${file}`);
          fs.writeFileSync(`${outDir}/${file}`, JSON.stringify(
              result, 
              (key, value) => key === 'raw'? undefined: value, 
              2)
          );
        }
    });

  });

});