const dayjs = require("dayjs");
const timestampToMilliseconds = require("./timestamp_util.js");
const ReportStats = require("./report_stats.js");

class ExtentReport {
  constructor(tests, runTimeStamps, sysEnv) {
    this.tests = tests;
    this.startTime = dayjs(timestampToMilliseconds(runTimeStamps.start));
    this.endTime = dayjs(timestampToMilliseconds(runTimeStamps.end));
    this.stats = new ReportStats(this.tests, sysEnv);
  }
}

module.exports = ExtentReport;
