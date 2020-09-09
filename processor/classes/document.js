const { generateId } = require("../generate_id");
const { lexify } = require("../../lexer");
const { Parser } = require("./parser");

class Document {

    constructor(processor, lang, abbr, docSetId, usfmString, filterOptions) {
        this.id = generateId();
        this.processor = processor;
        this.docSetId = docSetId;
        this.enums = {};
        this.headers = {};
        this.sequences = {};
        this.processUsfm(usfmString, filterOptions);
    }

    processUsfm(usfmString, filterOptions) {
        const lexed = lexify(usfmString);
        const parser = new Parser();
        parser.parse(lexed);
        parser.tidy();
        parser.filter(filterOptions)
        // console.log(JSON.stringify(parser.sequences.main.blocks, null, 2));
        console.log(parser.allSequences().length, "sequence(s)")
    }

}

module.exports = { Document }
