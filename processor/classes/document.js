const { generateId } = require("../generate_id");
const { lexifyUsfm, lexifyUsx } = require("../../lexers");
const { Parser } = require("./parser");
const { nComponentsForScope } = require('../scope_defs');

class Document {

    constructor(processor, lang, abbr, docSetId, contentType, contentString, filterOptions) {
        this.id = generateId();
        this.processor = processor;
        this.docSetId = docSetId;
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
        this.processLexed(lexed, filterOptions);
    }

    processLexed(lexed, filterOptions) {
        const parser = new Parser();
        parser.parse(lexed);
        parser.tidy();
        parser.filter(filterOptions);
        this.headers = parser.headers;
        this.succinctPass1(parser);
        // this.describe();
    }

    succinctPass1(parser) {
        const docSet = this.processor.docSets[this.docSetId];
        docSet.buildPreEnums();
        for (const seq of parser.allSequences()) {
            docSet.recordPreEnum("ids", seq.id);
            this.recordPreEnums(docSet, seq);
        }
        if (docSet.enums.wordLike.length === 0) {
            docSet.sortPreEnums();
        }
        // console.log(JSON.stringify(docSet.preEnums.notWordLike, null, 2));
        // docSet.describe();
    }

    recordPreEnums(docSet, seq) {
        for (const block of seq.blocks) {
            for (const item of block.items) {
                if (item.itemType === "wordLike") {
                    docSet.recordPreEnum("wordLike", item.chars);
                } else if (["lineSpace", "eol", "punctuation"].includes(item.itemType)) {
                    docSet.recordPreEnum("notWordLike", item.chars);
                } else if (item.itemType === "graft") {
                    docSet.recordPreEnum("graftTypes", item.graftType);
                } else if (item.itemType === "startScope") {
                    const labelBits = item.label.split("/");
                    if (labelBits.length !== nComponentsForScope(labelBits[0])) {
                        throw new Error(`Scope ${item.label} has unexpected number of components`);
                    }
                    for (const labelBit of labelBits) {
                        docSet.recordPreEnum("scopeBits", labelBit);
                    }
                }
            }
        }
    }

    describe() {
        console.log(
            JSON.stringify(
                this,
                (k, v) => {
                    if (["processor"].includes(k)) {
                        return "(circular)";
                    } else {
                        return v;
                    }
                },
                2
            )
        );
    }

}

module.exports = { Document }
