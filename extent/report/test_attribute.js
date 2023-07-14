class TestAttribute {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.passCnt = 0;
    this.failCnt = 0;
    this.skipCnt = 0;
    this.tests = [];
  }

  addTest(test) {
    const testSumm = new TestSummary(test, this.type);
    this.tests.push(testSumm);
  }
}

class TestSummary {
  constructor(test, attType) {
    let testChain = test;
    let parentChain = test.parent;
    if (attType === "exception") {
      testChain = test.parent;
      parentChain = test.parent.parent;
    }

    this.id = testChain.id;
    this.name = testChain.name;
    this.status = testChain.status;
    this.start = testChain.start;

    if (parentChain.type === "Scenario Outline") {
      this.fullName = parentChain.parent.name + "." + this.name;
      this.ancestorId = parentChain.parent.id;
    } else {
      this.fullName = parentChain.name + "." + this.name;
      this.ancestorId = parentChain.id;
    }
  }
}

class Category extends TestAttribute {
  constructor(name) {
    super(name, "category");
  }
}

class Author extends TestAttribute {
  constructor(name) {
    super(name, "author");
  }
}

class Device extends TestAttribute {
  constructor(name) {
    super(name, "device");
  }
}

class Exception extends TestAttribute {
  constructor(name) {
    super(name, "exception");
  }
}

class Rule extends TestAttribute {
  constructor(name) {
    super(name, "rule");
  }
}

module.exports = { Author, Category, Device, Exception, Rule };
