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

    this.eventDataCollector
      .getTestCaseAttempts()
      .filter((t) => !t.attempt)
      .forEach((testCaseAttempt) => {
        // FEATURE Extent Test
        const { gherkinDocument } = testCaseAttempt;
        const testCaseId = testCaseAttempt.pickle.astNodeIds[0];
        const featureUri = gherkinDocument.uri;
        let featureTest = featureUriToTest.get(featureUri);

        if (!featureTest) {
          const { feature } = gherkinDocument;
          featureTest = new ExtentTest(
            "Feature",
            feature.name,
            feature.description
          );

          featureUriToTest.set(featureUri, featureTest);
          featureExtentTests.push(featureTest);
        }

        //SCENARIO OUTLINE Extent Test
        let scenarioTestParent = featureUriToTest.get(featureUri);
        let scenarioOutlineTest;
        const { GherkinDocumentParser: gherkinDocParser } = formatterHelpers;
        const { id, keyword, name, description, examples } =
          gherkinDocParser.getGherkinScenarioMap(gherkinDocument)[testCaseId];

        if (examples.length > 0) {
          if (!scenariOutlineIdToTest.has(id)) {
            scenarioOutlineTest = new ExtentTest(
              "Scenario Outline",
              name,
              description
            );
            featureTest.addChildTest(scenarioOutlineTest);
            scenariOutlineIdToTest.set(id, scenarioOutlineTest);
          }

          scenarioTestParent = scenariOutlineIdToTest.get(id);
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

        const rules = gherkinDocParser.getGherkinExampleRuleMap(
          testCaseAttempt.gherkinDocument
        );
        if (Object.hasOwn(rules, testCaseId)) {
          const { keyword, name } = rules[testCaseId];
          scenarioTest.addRule(name);
        }

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

module.exports = ExtentCucumberJSAdapter;
