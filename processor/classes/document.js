const { generateId } = require("../generate_id");
const { lexify } = require("../../lexer");
const { Parser } = require("./parser");

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
        const parser = new Parser();
        parser.parse(lexed);
        parser.tidy();
        console.log(JSON.stringify(parser.sequences.main, null, 2));
    }

}

module.exports = { Document }
