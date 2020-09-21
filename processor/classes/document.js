const { generateId } = require("../generate_id");
const { lexifyUsfm, lexifyUsx } = require("../../lexers");
const { Parser } = require("./parser");
const { scopeEnumLabels, nComponentsForScope } = require('../resources/scope_defs');
const { tokenEnumLabels, tokenCategory } = require('../resources/token_defs');
const { itemEnum } = require('../resources/item_defs');

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
            for (const item of [...block.items, block.blockScope]) {
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

    unsuccinctifySequence(seqId, docSet, options) {
        if (Object.keys(docSet.enumIndexes).length === 0) {
            docSet.buildEnumIndexes();
        }
        const sequence = this.sequences[seqId];
        const ret = [];
        for (const block of sequence.blocks) {
            const succinctBlockScope = block.bs;
            const [itemLength, itemType, itemSubtype] = this.headerBytes(succinctBlockScope, 0);
            const blockScopeLabel = this.succinctScopeLabel(docSet, succinctBlockScope, itemSubtype, 0);
            const succinctContent = block.c;
            const blockRet = [];
            let pos = 0;
            while (pos < succinctContent.length) {
                const [itemLength, itemType, itemSubtype] = this.headerBytes(succinctContent, pos);
                if (itemType === itemEnum.token) {
                    blockRet.push([
                        "token",
                        tokenEnumLabels[itemSubtype],
                        this.succinctTokenChars(docSet, succinctContent, itemSubtype, pos)
                    ]);
                } else if (
                    [itemEnum.startScope, itemEnum.endScope].includes(itemType) &&
                    (!("scopes" in options) || options.scopes)
                ) {
                    blockRet.push([
                        (itemType === itemEnum.startScope) ? "startScope" : "endScope",
                        this.succinctScopeLabel(docSet, succinctContent, itemSubtype, pos)
                    ]);
                } else if (
                    itemType === itemEnum.graft &&
                    (!("grafts" in options) || options.grafts)
                ) {
                    blockRet.push([
                        "graft",
                        this.succinctGraftName(docSet, itemSubtype),
                        this.succinctGraftSeqId(docSet, succinctContent, pos)
                    ]);
                }
                pos += itemLength;
            }
            ret.push([blockScopeLabel, blockRet]);
        }
        return ret;
    }

    headerBytes(succinct, pos) {
        const headerByte = succinct.byte(pos);
        const itemType = headerByte >> 6;
        const itemLength = headerByte & 0x0000003F;
        const itemSubtype = succinct.byte(pos + 1);
        return [itemLength, itemType, itemSubtype];
    }

    succinctTokenChars(docSet, succinct, itemSubtype, pos) {
        const itemCategory = tokenCategory[tokenEnumLabels[itemSubtype]];
        const itemIndex = docSet.enumIndexes[itemCategory][succinct.nByte(pos + 2)];
        return docSet.enums[itemCategory].countedString(itemIndex);
    }

    succinctScopeLabel(docSet, succinct, itemSubtype, pos) {
        const scopeType = scopeEnumLabels[itemSubtype];
        let nScopeBits = nComponentsForScope(scopeType);
        let offset = 2;
        let scopeBits = "";
        while (nScopeBits > 1) {
            const itemIndexIndex = succinct.nByte(pos + offset);
            const itemIndex = docSet.enumIndexes.scopeBits[itemIndexIndex];
            const scopeBitString = docSet.enums.scopeBits.countedString(itemIndex);
            scopeBits += `/${scopeBitString}`;
            offset += succinct.nByteLength(itemIndexIndex);
            nScopeBits--;
        }
        return `${scopeType}${scopeBits}`;
    }

    succinctGraftName(docSet, itemSubtype) {
        const graftIndex = docSet.enumIndexes.graftTypes[itemSubtype];
        return docSet.enums.graftTypes.countedString(graftIndex);
    }

    succinctGraftSeqId(docSet, succinct, pos) {
        const seqIndex = docSet.enumIndexes.ids[succinct.nByte(pos + 2)];
        return docSet.enums.ids.countedString(seqIndex);
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
