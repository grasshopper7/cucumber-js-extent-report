const updateTestTimesAndStatus = function (childTest) {
  while (childTest.parent) {
    let parentTest = childTest.parent;

    updateStartTime(childTest, parentTest);
    updateEndTime(childTest, parentTest);
    parentTest.duration = parentTest.end - parentTest.start;
    parentTest.status = compareStatus(parentTest.status, childTest.status);

    childTest = parentTest;
  }
};

const updateStartTime = function (childTest, parentTest) {
  if (parentTest.start) {
    if (parentTest.start > childTest.start) parentTest.start = childTest.start;
  } else parentTest.start = childTest.start;
};

const updateEndTime = function (childTest, parentTest) {
  if (parentTest.end) {
    if (parentTest.end < childTest.end) parentTest.end = childTest.end;
  } else parentTest.end = childTest.end;
};

const convertStatus = function (cukeStatus) {
  const cukeStatusUpper = cukeStatus.toUpperCase();
  // const failedCukeStatus = [
  //   "FAILED",
  //   "UNDEFINED",
  //   "PENDING",
  //   "AMBIGUOUS",
  //   "UNUSED",
  // ];

  if (cukeStatusUpper === "PASSED") return "Pass";
  //else if (failedCukeStatus.includes(cukeStatusUpper)) return "Fail";
  else if (cukeStatusUpper == "FAILED") return "Fail";
  else return "Skip";
};

// (parent, child)
const compareStatus = function (statusParent, statusChild) {
  const statusMap = new Map();
  statusMap.set("Fail", 30);
  statusMap.set("Skip", 20);
  statusMap.set("Pass", 10);

  return statusMap.get(statusParent) >= statusMap.get(statusChild)
    ? statusParent
    : statusChild;
};

module.exports = { updateTestTimesAndStatus, convertStatus, compareStatus };
