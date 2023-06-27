const dayjs = require("dayjs");
const timestampToMilliseconds = require("./timestamp_util.js");
const ReportStats = require("./report_stats.js");
const mergeJSON = require("merge-json");

class ExtentReport {
  constructor(tests, runTimeStamps) {
    this.tests = tests;
    this.startTime = dayjs(timestampToMilliseconds(runTimeStamps.start));
    this.endTime = dayjs(timestampToMilliseconds(runTimeStamps.end));

    this.processConfig();
    this.stats = new ReportStats(this.tests, this.config);
  }

  processConfig() {
    this.config = {
      theme: "standard",
      encoding: "utf-8",
      timelineEnabled: true,
      documentTitle: "",
      reportName: "Cucumber Report",
      css: "",
      js: "",
      sysenv: {},
    };

    let projConfig;
    try {
      projConfig = require(process.cwd() + "/extent-config.json");
      if (!mergeJSON.isJSON(projConfig.sysenv)) projConfig.sysenv = {};
      this.config = mergeJSON.merge(this.config, projConfig);
    } catch (e) {}
  }
}

module.exports = ExtentReport;
