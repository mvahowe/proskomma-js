const { generateId } = require("../generate_id");
const { lexifyUsfm, lexifyUsx } = require("../../lexers");
const { Parser } = require("./parser");

class Document {

    constructor(processor, lang, abbr, docSetId, contentType, contentString, filterOptions) {
        this.id = generateId();
        this.processor = processor;
        this.docSetId = docSetId;
        this.enums = {};
        this.headers = {};
        this.sequences = {};
        switch (contentType) {
            case "usfm":
                this.processUsfm(contentString, filterOptions);
                break;
            case "usx":
                this.processUsx(contentString, filterOptions);
                break;
            default:
                throw new Error(`Unknown document contentType '${contentType}'`);
        }
    }

    processUsfm(usfmString, filterOptions) {
        const lexed = lexifyUsfm(usfmString);
        this.processLexed(lexed, filterOptions);
    }

    processUsx(usxString, filterOptions) {
        const lexed = lexifyUsx(usxString);
        console.log(JSON.stringify(lexed, null, 2))
        this.processLexed(lexed, filterOptions);
    }

    processLexed(lexed, filterOptions) {
        const parser = new Parser();
        parser.parse(lexed);
        parser.tidy();
        parser.filter(filterOptions)
        parser.describe()
    }

}

module.exports = { Document }
