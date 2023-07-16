const nunjucks = require("nunjucks");
const dayjs = require("dayjs");
const humanizeDuration = require("humanize-duration");

class NunjuckRender {
  render(report) {
    const env = nunjucks.configure(__dirname, { autoescape: true });

    env.addFilter("time", function (date) {
      return date.format("h:m:s A");
    });

    env.addFilter("datetime", function (date) {
      return date.format("D.M.YYYY h:m:s A");
    });

    env.addFilter("fulldatetime", function (date) {
      return date.format("MMM DD, YYYY hh:mm:ss A");
    });

    env.addFilter("duration", function (duration) {
      return humanizeDuration(duration, {
        delimiter: " ",
        units: ["h", "m", "s", "ms"],
        language: "shortEn",
        languages: {
          shortEn: {
            y: () => "y",
            mo: () => "mo",
            w: () => "w",
            d: () => "d",
            h: () => "h",
            m: () => "m",
            s: () => "s",
            ms: () => "ms",
          },
        },
      });
    });
    return env.render("./spark.njk", { report: report });
  }
}

module.exports = NunjuckRender;
