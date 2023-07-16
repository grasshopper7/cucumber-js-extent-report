const Convert = require("ansi-to-html");
const xmlFormatter = require("xml-formatter");

class Log {
  constructor(type) {
    this.type = type;
  }
}

class ErrorLog extends Log {
  constructor(result) {
    super("error");
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
    this.text;
    this.image;
    this.video;
    this.error;

    this.processAttachment(attachment);
  }

  processAttachment(attachment) {
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
    } else if (attachment.mediaType.match(/^application\/xml/)) {
      this.text = prettyXML(attachment.body);
    } else {
      this.error = "Media type not supported.";
    }
  }
}

const prettyXML = function (text) {
  try {
    return xmlFormatter(text, { indentation: "  " });
  } catch (error) {
    return text;
  }
};

const prettyJSON = function (text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch (error) {
    return text;
  }
};

const prettyANSI = function (text) {
  try {
    return new Convert().toHtml(text);
  } catch (error) {
    return text;
  }
};

module.exports = { ErrorLog, DocStringLog, DataTableLog, AttachmentLog };
