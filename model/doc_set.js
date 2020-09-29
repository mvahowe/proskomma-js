const {generateId} = require("../lib/generate_id");
const ByteArray = require("../lib/byte_array");
const { scopeEnumLabels, nComponentsForScope } = require('../lib/scope_defs');
const { tokenEnumLabels, tokenCategory } = require('../lib/token_defs');
const { itemEnum } = require('../lib/item_defs');

class DocSet {

    constructor(processor, lang, abbr) {
        this.id = generateId();
        this.processor = processor;
        this.lang = lang;
        this.abbr = abbr;
        this.preEnums = {};
        this.enums = {
            ids: new ByteArray(512),
            wordLike: new ByteArray(8192),
            notWordLike: new ByteArray(256),
            scopeBits: new ByteArray(256),
            graftTypes: new ByteArray(10),
        };
        this.enumIndexes = {};
        this.docIds = [];
    }

    documents() {
        return this.docIds.map(did => this.processor.documents[did]);
    }

    buildPreEnums() {
        for (const [category, succinct] of Object.entries(this.enums)) {
            this.preEnums[category] = this.buildPreEnum(succinct);
        }
    }

    buildPreEnum(succinct) {
        const ret = {};
        let pos = 0;
        let enumCount = 0;
        while (pos < succinct.length) {
            ret[succinct.countedString(pos)] = {
                "enum": enumCount++,
                frequency: 0
            };
            pos += succinct.byte(pos);
        }
        return ret;
    }

    recordPreEnum(category, value) {
        if (!(category in this.preEnums)) {
            throw new Error(`Unknown category ${category} in recordPreEnum. Maybe call buildPreEnums()?`);
        }
        if (!(value in this.preEnums[category])) {
            this.preEnums[category][value] = {
                "enum": Object.keys(this.preEnums[category]).length,
                frequency: 1
            }
        } else {
            this.preEnums[category][value].frequency++;
        }
    }

    sortPreEnums() {
        for (const category of Object.values(this.preEnums)) {
            let count = 0;
            for (const [k, v] of Object.entries(category).sort((a, b) => b[1].frequency - a[1].frequency)) {
                v.enum = count++;
            }
        }
    }

    enumForCategoryValue(category, value) {
        if (!(category in this.preEnums)) {
            throw new Error(`Unknown category ${category} in recordPreEnum. Maybe call buildPreEnums()?`);
        }
        if (value in this.preEnums[category]) {
            return this.preEnums[category][value].enum;
        } else {
            throw new Error(`Unknown value ${value} for category ${category} in enumForCategoryValue. Maybe call buildPreEnums()?`);
        }
    }

    buildEnums() {
        for (const [category, catOb] of Object.entries(this.preEnums)) {
            this.enums[category].clear();
            this.buildEnum(category, catOb);
        }
    }

    buildEnum(category, preEnumOb) {
        const sortedPreEnums = Object.entries(preEnumOb).sort((a, b) => a[1].enum - b[1].enum);
        for (const enumText of sortedPreEnums.map(pe => pe[0])) {
            this.enums[category].pushCountedString(enumText);
        }
        this.enums[category].trim();
    }

    maybeBuildEnumIndexes() {
        if (Object.keys(this.enumIndexes).length === 0) {
            this.buildEnumIndexes();
        }
    }

    buildEnumIndexes() {
        for (const [category, succinct] of Object.entries(this.enums)) {
            this.buildEnumIndex(category, succinct);
        }
    }

    buildEnumIndex(category, enumSuccinct) {
        const indexSuccinct = new Uint32Array(enumSuccinct.length);
        let pos = 0;
        let count = 0;
        while (pos < enumSuccinct.length) {
            indexSuccinct[count] = pos;
            const stringLength = enumSuccinct.byte(pos);
            pos += (stringLength + 1);
            count += 1;
        }
        this.enumIndexes[category] = indexSuccinct;
    }

    unpackEnum(category) {
        const succinct = this.enums[category];
        let pos = 0;
        const ret = [];
        while (pos < succinct.length) {
            const stringLength = succinct.byte(pos);
            const unpacked = succinct.countedString(pos);
            ret.push(unpacked);
            pos += stringLength + 1;
        }
        return ret;
    }

    unsuccinctifyBlock(block, options) {
        this.maybeBuildEnumIndexes();
        const succinctBlockScope = block.bs;
        const [itemLength, itemType, itemSubtype] = this.headerBytes(succinctBlockScope, 0);
        const blockScopeLabel = this.succinctScopeLabel(succinctBlockScope, itemSubtype, 0);
        const succinctBlockGrafts = block.bg;
        let pos = 0;
        const blockGrafts = [];
        while (pos < succinctBlockGrafts.length) {
            const [itemLength, itemType, itemSubtype] = this.headerBytes(succinctBlockGrafts, pos);
            blockGrafts.push([
                "graft",
                this.succinctGraftName(itemSubtype),
                this.succinctGraftSeqId(succinctBlockGrafts, pos)
            ]);
            pos += itemLength;
        }
        const openScopes = [];
        const succinctOpenScopes = block.os;
        pos = 0;
        while (pos < succinctOpenScopes.length) {
            const [itemLength, itemType, itemSubtype] = this.headerBytes(succinctOpenScopes, pos);
            openScopes.push([
                "startScope",
                this.succinctScopeLabel(succinctOpenScopes, itemSubtype, pos)
            ]);
            pos += itemLength;
        }
        const succinctContent = block.c;
        const blockRet = [];
        pos = 0;
        while (pos < succinctContent.length) {
            const [itemLength, itemType, itemSubtype] = this.headerBytes(succinctContent, pos);
            if (itemType === itemEnum.token) {
                blockRet.push([
                    "token",
                    tokenEnumLabels[itemSubtype],
                    this.succinctTokenChars(succinctContent, itemSubtype, pos)
                ]);
            } else if (
                [itemEnum.startScope, itemEnum.endScope].includes(itemType) &&
                (!("scopes" in options) || options.scopes)
            ) {
                blockRet.push([
                    (itemType === itemEnum.startScope) ? "startScope" : "endScope",
                    this.succinctScopeLabel(succinctContent, itemSubtype, pos)
                ]);
            } else if (
                itemType === itemEnum.graft &&
                (!("grafts" in options) || options.grafts)
            ) {
                blockRet.push([
                    "graft",
                    this.succinctGraftName(itemSubtype),
                    this.succinctGraftSeqId(succinctContent, pos)
                ]);
            }
            pos += itemLength;
        }
        return {
            bs: ["startScope", blockScopeLabel],
            bg: blockGrafts,
            c: blockRet,
            os: openScopes
        };
    }

    headerBytes(succinct, pos) {
        const headerByte = succinct.byte(pos);
        const itemType = headerByte >> 6;
        const itemLength = headerByte & 0x0000003F;
        const itemSubtype = succinct.byte(pos + 1);
        return [itemLength, itemType, itemSubtype];
    }

    succinctTokenChars(succinct, itemSubtype, pos) {
        const itemCategory = tokenCategory[tokenEnumLabels[itemSubtype]];
        const itemIndex = this.enumIndexes[itemCategory][succinct.nByte(pos + 2)];
        return this.enums[itemCategory].countedString(itemIndex);
    }

    succinctScopeLabel(succinct, itemSubtype, pos) {
        const scopeType = scopeEnumLabels[itemSubtype];
        let nScopeBits = nComponentsForScope(scopeType);
        let offset = 2;
        let scopeBits = "";
        while (nScopeBits > 1) {
            const itemIndexIndex = succinct.nByte(pos + offset);
            const itemIndex = this.enumIndexes.scopeBits[itemIndexIndex];
            const scopeBitString = this.enums.scopeBits.countedString(itemIndex);
            scopeBits += `/${scopeBitString}`;
            offset += succinct.nByteLength(itemIndexIndex);
            nScopeBits--;
        }
        return `${scopeType}${scopeBits}`;
    }

    succinctGraftName(itemSubtype) {
        const graftIndex = this.enumIndexes.graftTypes[itemSubtype];
        return this.enums.graftTypes.countedString(graftIndex);
    }

    succinctGraftSeqId(succinct, pos) {
        const seqIndex = this.enumIndexes.ids[succinct.nByte(pos + 2)];
        return this.enums.ids.countedString(seqIndex);
    }

    describe() {
        console.log(
            JSON.stringify(
                this,
                (k, v) => {
                    if (["processor"].includes(k)) {
                        return "(circular)";
                    } else if (k === "enums") {
                        return Object.keys(v).map(c => [c, this.unpackEnum(c)]);
                    }
                     else {
                        return v;
                    }
                },
                2
            )
        );
    }

    serializeSuccinct() {
        const ret = {
            id: this.id,
            metadata: {
                lang: this.lang,
                abbr: this.abbr
            },
            enums: {},
            docs: {}
        };
        for (const [eK, eV] of Object.entries(this.enums)) {
            ret.enums[eK] = eV.base64();
        }
        ret.docs = {};
        for (const docId of this.docIds) {
            ret.docs[docId] = this.processor.documents[docId].serializeSuccinct();
        }
        return ret;
    }

}

module.exports = {DocSet}
