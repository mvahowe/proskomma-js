const { Sequence } = require("./sequence");
const { specs } = require("../resources/parser_specs");

const Parser = class {

    constructor() {
        this.specs = specs;
        this.baseSequenceTypes = {
            main: "1",
            intro: "*",
            title: "?",
            endTitle: "?",
            heading: "*",
            rem: "*",
            footnote: "*"
        };
        this.inlineSequenceTypes = {
            xref: "*",
            temp: "?"
        };
        this.sequences = {};
        for (const [sType, sArity] of Object.entries({...this.baseSequenceTypes, ...this.inlineSequenceTypes})) {
            switch (sArity) {
                case "1":
                    this.sequences[sType] = new Sequence(sType);
                    break;
                case "?":
                    this.sequences[sType] = null;
                    break;
                case "*":
                    this.sequences[sType] = [];
                    break;
                default:
                    throw new Error(`Unexpected base sequence arity '${sArity}' for '${sType}'`);
            }
        }
        this.currentSequence = this.sequences.main;
        this.headers = {};
        this.activeScopes = [];
    }

    parse(lexedItems) {
        for (const lexedItem of lexedItems) {
            console.log(lexedItem.printValue);
        }
    }

}

    module.exports = { Parser };
