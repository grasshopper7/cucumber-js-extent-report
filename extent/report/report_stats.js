const { Author, Category, Device, Exception } = require("./test_attribute.js");

class ReportStats {
  constructor(tests, sysEnv) {
    const statuses = { Fail: 0, Skip: 0, Pass: 0, Warn: 0, Info: 0 };
    this.statusFeatureCounts = new Map(Object.entries(statuses));
    this.statusScenarioCounts = new Map(Object.entries(statuses));
    this.statusStepCounts = new Map(Object.entries(statuses));

    this.authors = new Map();
    this.categories = new Map();
    this.devices = new Map();
    this.exceptions = new Map();

    this.sysEnv = sysEnv;

    this.processTests(tests);
  }

  processTests(tests) {
    tests.forEach((feature) => {
      updateStatusCount(feature.status, this.statusFeatureCounts);

      feature.childTests.forEach((scen) => {
        if (scen.type === "Scenario Outline") {
          scen.childTests.forEach((sc) => {
            this.updateData(sc);
          });
        } else {
          this.updateData(scen);
        }
      });
    });
  }

  updateData(scenario) {
    updateStatusCount(scenario.status, this.statusScenarioCounts);
    updateStepCount(scenario, this.statusStepCounts);
    updateScenarioAttributes(
      scenario,
      this.authors,
      this.categories,
      this.devices,
      this.exceptions
    );
  }
}

const updateScenarioAttributes = function (
  scenario,
  authors,
  categories,
  devices,
  exceptions
) {
  updateAttributeData(
    scenario,
    scenario.authors,
    authors,
    (a) => new Author(a)
  );

  updateAttributeData(
    scenario,
    scenario.categories,
    categories,
    (c) => new Category(c)
  );

  updateAttributeData(
    scenario,
    scenario.devices,
    devices,
    (d) => new Device(d)
  );

  updateExceptionData(scenario, exceptions);
};

const updateExceptionData = function (scenario, exceptions) {
  scenario.childTests.forEach((step) => {
    step.logs.forEach((log) => {
      if (log.type === "error") {
        let excepAtt = exceptions.get(log.class);
        if (!excepAtt) {
          excepAtt = new Exception(log.class);
          exceptions.set(log.class, excepAtt);
        }
        excepAtt.addTest(step);

        if (step.status === "Pass") excepAtt.passCnt = excepAtt.passCnt + 1;
        else if (step.status === "Fail")
          excepAtt.failCnt = excepAtt.failCnt + 1;
        else if (step.status === "Skip")
          excepAtt.skipCnt = excepAtt.skipCnt + 1;
      }
    });
  });
};

const updateAttributeData = function (scenario, scenAtts, attributes, initAtt) {
  scenAtts.forEach((sc) => {
    let attribute = attributes.get(sc);
    if (!attribute) {
      attribute = initAtt(sc);
      attributes.set(sc, attribute);
    }
    attribute.addTest(scenario);

    if (scenario.status === "Pass") attribute.passCnt = attribute.passCnt + 1;
    else if (scenario.status === "Fail")
      attribute.failCnt = attribute.failCnt + 1;
    else if (scenario.status === "Skip")
      attribute.skipCnt = attribute.skipCnt + 1;
  });
};

const updateStepCount = function (scenario, stepCounts) {
  const hooks = ["Before", "After", "BeforeStep", "AfterStep"];
  scenario.childTests.forEach((st) => {
    if (!hooks.includes(st.type)) updateStatusCount(st.status, stepCounts);
  });
};

const updateStatusCount = function (testStatus, statusCounts) {
  statusCounts.set(testStatus, statusCounts.get(testStatus) + 1);
};

module.exports = ReportStats;