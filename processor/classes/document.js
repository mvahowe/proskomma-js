const { generateId } = require("../generate_id");
const { lexifyUsfm, lexifyUsx } = require("../../lexers");
const { Parser } = require("./parser");
const { scopeEnum, nComponentsForScope } = require('../scope_defs');
const { tokenEnum, tokenCategory } = require('../token_defs');
const { itemEnum } = require('../item_defs');
const ByteArray = require("../../lib/byte_array");

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
        // console.log(JSON.stringify(lexed, null, 2))
        const parser = new Parser();
        parser.parse(lexed);
        parser.tidy();
        parser.filter(filterOptions);
        this.headers = parser.headers;
        this.succinctPass1(parser);
        this.succinctPass2(parser);
        this.describe();
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
        for (const seq of parser.allSequences()) {
            this.sequences[seq.id] = {
                type: seq.type,
                isBaseType: (seq.type in parser.baseSequenceTypes),
                blocks: this.succinctifyBlocks(seq.blocks, docSet)
            };
        }
    }

    succinctifyBlocks(blocks, docSet) {
    const ret = [];
    for (const block of blocks) {
        const blockBA = new ByteArray(block.length);
        let lengthPos;
        let scopeBits;
        for (const item of block.items) {
            switch (item.itemType) {
                case "wordLike":
                case "punctuation":
                case "lineSpace":
                case "eol":
                case "softLineBreak":
                case "noBreakSpace":
                case "bareSlash":
                case "unknown":
                    const charsEnum = docSet.enumForCategoryValue(tokenCategory[item.itemType], item.chars);
                    lengthPos = blockBA.length;
                    blockBA.pushByte(0);
                    blockBA.pushByte(tokenEnum[item.itemType]);
                    blockBA.pushNByte(charsEnum);
                    blockBA.setByte(lengthPos, (blockBA.length - lengthPos) | itemEnum.token << 6);
                    break;
                case "graft":
                    const graftTypeEnum = docSet.enumForCategoryValue("graftTypes", item.graftType);
                    const seqEnum = docSet.enumForCategoryValue("ids", item.seqId);
                    lengthPos = blockBA.length;
                    blockBA.pushByte(0);
                    blockBA.pushByte(graftTypeEnum);
                    blockBA.pushNByte(seqEnum);
                    blockBA.setByte(lengthPos, (blockBA.length - lengthPos) | itemEnum.graft << 6);
                    break;
                case "startScope":
                case "endScope":
                    scopeBits = item.label.split("/");
                    lengthPos = blockBA.length;
                    blockBA.pushByte(0);
                    blockBA.pushByte(scopeEnum[scopeBits[0]]);
                    for (const scopeBit of scopeBits.slice(1)) {
                        blockBA.pushNByte(docSet.enumForCategoryValue("scopeBits", scopeBit));
                    }
                    blockBA.setByte(lengthPos, (blockBA.length - lengthPos) | itemEnum[item.itemType] << 6);
                    break;
                default:
                    throw new Error(`Item type ${item.itemType} is not handled in succinctifyBlocks`);
            }
        }
        ret.push({c: blockBA });
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
