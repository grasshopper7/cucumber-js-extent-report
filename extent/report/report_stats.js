const {
  Author,
  Category,
  Device,
  Exception,
  Rule,
} = require("./test_attribute.js");

class ReportStats {
  constructor(tests, config) {
    const statuses = { Fail: 0, Skip: 0, Pass: 0, Warn: 0, Info: 0 };
    this.statusFeatureCounts = new Map(Object.entries(statuses));
    this.statusScenarioCounts = new Map(Object.entries(statuses));
    this.statusStepCounts = new Map(Object.entries(statuses));

    this.authors = new Map();
    this.categories = new Map();
    this.devices = new Map();
    this.exceptions = new Map();
    this.rules = new Map();

    this.processSysEnv(config);
    this.processTests(tests);
  }

  processSysEnv(config) {
    this.sysEnv = new Map();

    if (config && config.sysenv) {
      try {
        this.sysEnv = new Map(Object.entries(config.sysenv));
      } catch (e) {}
    }
  }

  processTests(tests) {
    tests.forEach((feature) => {
      this.updateTestsStatusCount(feature.status, this.statusFeatureCounts);

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
    this.updateTestsStatusCount(scenario.status, this.statusScenarioCounts);
    this.updateStepCount(scenario, this.statusStepCounts);
    this.updateScenarioAttributes(
      scenario,
      this.authors,
      this.categories,
      this.devices,
      this.exceptions,
      this.rules
    );
  }

  updateScenarioAttributes(scenario) {
    this.updateAttributeData(
      scenario,
      scenario.authors,
      this.authors,
      (a) => new Author(a)
    );

    this.updateAttributeData(
      scenario,
      scenario.categories,
      this.categories,
      (c) => new Category(c)
    );

    this.updateAttributeData(
      scenario,
      scenario.devices,
      this.devices,
      (d) => new Device(d)
    );

    this.updateExceptionData(scenario);
    this.updateRuleData(scenario);
  }

  updateRuleData(scenario) {
    const rule = scenario.rule;
    if (rule.length > 0) {
      let ruleAtt = this.rules.get(rule);
      if (!ruleAtt) {
        ruleAtt = new Rule(rule);
        this.rules.set(rule, ruleAtt);
      }
      ruleAtt.addTest(scenario);
      this.updateAttributeTestsStatusCounts(scenario, ruleAtt);
    }
  }

  updateExceptionData(scenario) {
    scenario.childTests.forEach((step) => {
      step.logs.forEach((log) => {
        if (log.type === "error") {
          let excepAtt = this.exceptions.get(log.class);
          if (!excepAtt) {
            excepAtt = new Exception(log.class);
            this.exceptions.set(log.class, excepAtt);
          }
          excepAtt.addTest(step);
          this.updateAttributeTestsStatusCounts(step, excepAtt);
        }
      });
    });
  }

  updateAttributeData(scenario, scenAtts, attributes, initAtt) {
    scenAtts.forEach((sc) => {
      let attribute = attributes.get(sc);
      if (!attribute) {
        attribute = initAtt(sc);
        attributes.set(sc, attribute);
      }
      attribute.addTest(scenario);
      this.updateAttributeTestsStatusCounts(scenario, attribute);
    });
  }

  updateStepCount(scenario, stepCounts) {
    const hooks = ["Before", "After", "BeforeStep", "AfterStep"];
    scenario.childTests.forEach((st) => {
      if (!hooks.includes(st.type))
        this.updateTestsStatusCount(st.status, stepCounts);
    });
  }

  updateTestsStatusCount(testStatus, statusCounts) {
    statusCounts.set(testStatus, statusCounts.get(testStatus) + 1);
  }

  updateAttributeTestsStatusCounts(test, attribute) {
    if (test.status === "Pass") attribute.passCnt = attribute.passCnt + 1;
    else if (test.status === "Fail") attribute.failCnt = attribute.failCnt + 1;
    else if (test.status === "Skip") attribute.skipCnt = attribute.skipCnt + 1;
  }
}

module.exports = ReportStats;
