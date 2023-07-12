const dayjs = require("dayjs");
const {
  ErrorLog,
  DocStringLog,
  DataTableLog,
  AttachmentLog,
} = require("./log.js");
const timestampToMilliseconds = require("./timestamp_util.js");

class ExtentTest {
  constructor(type, name, description) {
    this.id = idgen();
    this.type = type;
    this.name = name;
    this.description = description;
    this.authors = [];
    this.devices = [];
    this.categories = [];
    this.childTests = [];
    this.status = "Pass";
    this.start;
    this.end;
    this.duration;
    this.parent;
    this.logs = [];
    this.rule = "";
  }

  addRule(rule) {
    this.rule = rule;
  }

  addChildTest(childTest) {
    this.childTests.push(childTest);
    childTest.parent = this;
  }

  addTimeStamp(times) {
    this.start = dayjs(timestampToMilliseconds(times.start));
    this.end = dayjs(timestampToMilliseconds(times.end));
    this.duration = this.end - this.start;
  }

  addDuration(duration) {
    this.duration = timestampToMilliseconds(duration);
  }

  addLogs(attachments) {
    attachments.forEach((attach) => {
      const log = new AttachmentLog(attach);
      this.logs.push(log);
    });
  }

  addError(result) {
    if (
      result.status.toUpperCase() === "FAILED" &&
      result.exception.type.toUpperCase() === "ERROR"
    ) {
      const log = new ErrorLog(result);
      this.logs.push(log);
    }
  }

  addDocString(docString) {
    const log = new DocStringLog(docString);
    this.logs.push(log);
  }

  addDataTable(rows) {
    const log = new DataTableLog(rows);
    this.logs.push(log);
  }
}

const idgen = (function () {
  let i = 1;
  return function () {
    return i++;
  };
})();

module.exports = ExtentTest;
