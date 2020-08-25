const { generateId } = require("../generate_id");
const { lexify } = require("../../lexer");

class Document {

    constructor(processor, lang, abbr, docSetId, usfmString) {
        this.id = generateId();
        this.processor = processor;
        this.docSetId = docSetId;
        this.enums = {};
        this.headers = {};
        this.sequences = {};
        this.processUsfm(usfmString);
    }

    processUsfm(str) {
        const lexed = lexify(str);
    }

}

module.exports = { Document }
