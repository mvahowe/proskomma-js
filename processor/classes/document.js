const { generateId } = require("../generate_id");
const { lexifyUsfm, lexifyUsx } = require("../../lexers");
const { Parser } = require("./parser");
const { scopeEnum, nComponentsForScope } = require('../scope_defs');
const { tokenEnum, tokenEnumLabels, tokenCategory } = require('../token_defs');
const { itemEnum } = require('../item_defs');
const ByteArray = require("../../lib/byte_array");

class Document {

    constructor(processor, lang, abbr, docSetId, contentType, contentString, filterOptions) {
        this.id = generateId();
        this.processor = processor;
        this.docSetId = docSetId;
        this.headers = {};
        this.mainSequenceId = null;
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
        // console.log(JSON.stringify(lexed, null, 2))
        const parser = new Parser();
        parser.parse(lexed);
        parser.tidy();
        parser.filter(filterOptions);
        this.headers = parser.headers;
        this.succinctPass1(parser);
        this.succinctPass2(parser);
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
        docSet.buildEnums();
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

    succinctPass2(parser) {
        const docSet = this.processor.docSets[this.docSetId];
        this.mainId = parser.sequences.main.id;
        for (const seq of parser.allSequences()) {
            this.sequences[seq.id] = {
                type: seq.type,
                isBaseType: (seq.type in parser.baseSequenceTypes),
                blocks: seq.succinctifyBlocks(docSet)
            };
        }
        docSet.preEnums = {};
    }

    unsuccinctifySequence(seqId, docSet) {
        if (Object.keys(docSet.enumIndexes).length === 0) {
            docSet.buildEnumIndexes();
        }
        const sequence = this.sequences[seqId];
        const ret = [];
        for (const block of sequence.blocks) {
            const succinct = block.c;
            const blockRet = [];
            let pos = 0;
            while (pos < succinct.length) {
                const headerByte = succinct.byte(pos);
                const itemType = headerByte >> 6;
                const itemLength = headerByte & 0x0000003F;
                const itemSubtype = succinct.byte(pos + 1);
                if (itemType === itemEnum.token) {
                    const itemCategory = tokenCategory[tokenEnumLabels[itemSubtype]];
                    const enumIndexNo = succinct.nByte(pos + 2);
                    const itemIndex = docSet.enumIndexes[itemCategory][enumIndexNo];
                    if (!itemIndex) {
                    }
                    const chars = docSet.enums[itemCategory].countedString(itemIndex);
                    blockRet.push(`|${chars}`);
                }
                pos += itemLength;
            }
            ret.push(blockRet.join(""));
        }
        return ret;
    }

    describe() {
        console.log(
            JSON.stringify(
                this,
                (k, v) => {
                    if (["processor"].includes(k)) {
                        return "(circular)";
                    } else if (k === "blocks") {
                        return v.map(b => `ByteArray(length=${b.c.length})`)
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
