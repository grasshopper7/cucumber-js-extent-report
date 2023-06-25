const Convert = require("ansi-to-html");

class Log {
  constructor(type) {
    this.type = type;
  }
}

class ErrorLog extends Log {
  constructor(result) {
    super("error");
    this.processError(result);
  }

  processError(result) {
    this.message = result.message;
    this.class = result.exception.type;
    this.title = result.exception.message;
  }
}

class DocStringLog extends Log {
  constructor(content) {
    super("docstring");
    this.content = content;
  }
}

class DataTableLog extends Log {
  constructor(rows) {
    super("datatable");
    this.processRows(rows);
  }

  processRows(rows) {
    this.table = [];
    rows.forEach((row) => {
      let val = [];
      row.cells.forEach((cell) => val.push(cell.value));
      this.table.push(val);
    });
  }
}

class AttachmentLog extends Log {
  constructor(attachment) {
    super("attachment");
    this.encoding = attachment.contentEncoding;
    this.mediatype = attachment.mediaType;
    this.processAttachment(attachment);
  }

  processAttachment(attachment) {
    this.text;
    this.image;
    this.video;
    this.error;

    if (attachment.mediaType.match(/^image\//)) {
      this.image = attachment.body;
    } else if (attachment.mediaType.match(/^video\//)) {
      this.video = attachment.body;
    } else if (attachment.mediaType == "text/x.cucumber.log+plain") {
      this.text = attachment.body;
    } else if (attachment.mediaType.match(/^text\//)) {
      this.text = prettyANSI(attachment.body);
    } else if (attachment.mediaType.match(/^application\/json/)) {
      this.text = prettyJSON(attachment.body);
    } else {
      this.error = "Media type not supported.";
    }
  }
}

const prettyJSON = function (text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch (error) {
    return text;
  }
};

const prettyANSI = function (text) {
  return new Convert().toHtml(text);
};

module.exports = { ErrorLog, DocStringLog, DataTableLog, AttachmentLog };
