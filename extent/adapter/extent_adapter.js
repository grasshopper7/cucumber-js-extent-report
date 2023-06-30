const { Formatter, formatterHelpers, Status } = require("@cucumber/cucumber");
const ExtentTest = require("../report/extent_test.js");
const ExtentReport = require("../report/extent_report.js");
const NunjuckRender = require("../view/nunjuck_render.js");
const {
  updateTestTimesAndStatus,
  convertStatus,
  compareStatus,
} = require("../report/status_times_util.js");

class ExtentCucumberJSAdapter extends Formatter {
  constructor(options) {
    super(options);
    options.eventBroadcaster.on("envelope", (envelope) => {
      if (envelope.testRunStarted) this.testRunStarted(envelope);
      if (envelope.testCaseStarted) this.testCaseStarted(envelope);
      if (envelope.testCaseFinished) this.testCaseFinished(envelope);
      if (envelope.testRunFinished) this.testRunFinished(envelope);
    });
  }

  testRunStarted(testRunStarted) {
    this.testRunStartTimestamp = testRunStarted.testRunStarted.timestamp;
    this.testCaseStartIdToTestCaseId = new Map();
    this.testCaseIdToTiming = new Map();
  }

  testCaseStarted(testCaseStarted) {
    this.testCaseStartIdToTestCaseId.set(
      testCaseStarted.testCaseStarted.id,
      testCaseStarted.testCaseStarted.testCaseId
    );

    this.testCaseIdToTiming.set(testCaseStarted.testCaseStarted.testCaseId, {
      start: testCaseStarted.testCaseStarted.timestamp,
    });
  }

  testCaseFinished(testCaseFinished) {
    const testCaseId = this.testCaseStartIdToTestCaseId.get(
      testCaseFinished.testCaseFinished.testCaseStartedId
    );

    const timing = this.testCaseIdToTiming.get(testCaseId);
    timing.end = testCaseFinished.testCaseFinished.timestamp;
  }

  testRunFinished(testRunFinished) {
    this.testRunFinishTimestamp = testRunFinished.testRunFinished.timestamp;

    const featureExtentTests = [];
    const featureUriToTest = new Map();
    const scenariOutlineIdToTest = new Map();

    this.eventDataCollector.getTestCaseAttempts().forEach((testCaseAttempt) => {
      // FEATURE Extent Test
      const featureUri = testCaseAttempt.gherkinDocument.uri;
      let featureTest = featureUriToTest.get(featureUri);

      if (!featureTest) {
        featureTest = new ExtentTest(
          "Feature",
          testCaseAttempt.gherkinDocument.feature.name,
          testCaseAttempt.gherkinDocument.feature.description
        );

        featureUriToTest.set(featureUri, featureTest);
        featureExtentTests.push(featureTest);
      }

      //SCENARIO OUTLINE Extent Test
      let scenarioTestParent = featureUriToTest.get(featureUri);
      let scenarioOutlineTest;
      if (testCaseAttempt.pickle.astNodeIds.length == 2) {
        const scenarioOutlineId = testCaseAttempt.pickle.astNodeIds[0];

        const nameDesc = scenarioNameAndDescription(
          testCaseAttempt.gherkinDocument,
          scenarioOutlineId
        );

        if (!scenariOutlineIdToTest.has(scenarioOutlineId)) {
          scenarioOutlineTest = new ExtentTest(
            "Scenario Outline",
            nameDesc.name,
            nameDesc.description
          );
          featureTest.addChildTest(scenarioOutlineTest);
          scenariOutlineIdToTest.set(scenarioOutlineId, scenarioOutlineTest);
        }

        scenarioTestParent = scenariOutlineIdToTest.get(scenarioOutlineId);
      }

      //SCENARIO Extent Test
      //Add timestamp, start, end & duration
      //Get Scenario description from gherkinDocument envelope (Any need??)
      const scenarioTest = new ExtentTest(
        "Scenario",
        testCaseAttempt.pickle.name,
        ""
      );
      scenarioTest.addTimeStamp(
        this.testCaseIdToTiming.get(testCaseAttempt.testCase.id)
      );

      testCaseAttempt.pickle.tags.forEach((t) => {
        scenarioTest.categories.push(t.name);
        if (!featureTest.categories.includes(t.name))
          featureTest.categories.push(t.name);
      });

      scenarioTestParent.addChildTest(scenarioTest);

      //STEP & HOOK Extent Test
      // Add duration
      const parsed = formatterHelpers.parseTestCaseAttempt({
        cwd: this.cwd,
        snippetBuilder: this.snippetBuilder,
        supportCodeLibrary: this.supportCodeLibrary,
        testCaseAttempt,
      });

      parsed.testSteps.forEach((testStep) => {
        //console.log(JSON.stringify(testStep, null, 2));

        let desc = "";
        if (testStep.actionLocation)
          desc =
            testStep.actionLocation.uri + ":" + testStep.actionLocation.line;
        else if (testStep.sourceLocation)
          desc =
            testStep.sourceLocation.uri + ":" + testStep.sourceLocation.line;

        const stepHookTest = new ExtentTest(
          testStep.keyword,
          testStep.text ||
            testStep.actionLocation.uri + ":" + testStep.actionLocation.line,
          desc
        );
        stepHookTest.status = convertStatus(testStep.result.status);
        stepHookTest.addDuration(testStep.result.duration);
        if (testStep.argument && testStep.argument.docString)
          stepHookTest.addDocString(testStep.argument.docString.content);
        if (testStep.argument && testStep.argument.dataTable)
          stepHookTest.addDataTable(testStep.argument.dataTable.rows);
        stepHookTest.addLogs(testStep.attachments);
        stepHookTest.addError(testStep.result);
        scenarioTest.addChildTest(stepHookTest);
        scenarioTest.status = compareStatus(
          scenarioTest.status,
          stepHookTest.status
        );
      });

      updateTestTimesAndStatus(scenarioTest);
    });

    const extentReport = new ExtentReport(featureExtentTests, {
      start: this.testRunStartTimestamp,
      end: this.testRunFinishTimestamp,
    });

    const rep = new NunjuckRender().render(extentReport);
    this.log(rep);
  }
}

const scenarioNameAndDescription = function (gherkinDocument, astNodeId) {
  for (const c of gherkinDocument.feature.children) {
    if (c.scenario && c.scenario.id === astNodeId)
      return {
        name: c.scenario.name,
        description: c.scenario.description,
      };

    if (c.rule && c.rule.keyword === "Rule")
      for (const r of c.rule.children) {
        if (r.scenario.id === astNodeId)
          return {
            name: r.scenario.name,
            description: r.scenario.description,
          };
      }
  }
};

module.exports = ExtentCucumberJSAdapter;
