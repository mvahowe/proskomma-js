const { generateId } = require("../generate_id");

class DocSet {

    constructor(processor, lang, abbr) {
        this.id = generateId();
        this.processor = processor;
        this.lang = lang;
        this.abbr = abbr;
        this.enums = {};
        this.docIds = [];
    }

}

module.exports = { DocSet }
