const {generateId} = require("../lib/generate_id");
const ByteArray = require("../lib/byte_array");
const {scopeEnumLabels, nComponentsForScope} = require('../lib/scope_defs');
const {tokenEnumLabels, tokenCategory} = require('../lib/token_defs');
const {itemEnum} = require('../lib/item_defs');

class DocSet {

    constructor(processor, selectors) {
        this.selectors = selectors || processor.selectors;
        if (typeof this.selectors !== "object") {
            throw new Error(`DocSet constructor expects selectors to be object, found ${typeof this.selectors}`);
        }
        this.id = generateId();
        this.processor = processor;
        this.selectors = this.validateSelectors(this.selectors);
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

    validateSelectors(selectors) {
        const expectedSelectors = {};
        for (const selector of this.processor.selectors) {
            expectedSelectors[selector.name] = selector;
        }
        for (const [name, value] of Object.entries(selectors)) {
            if (!name in expectedSelectors) {
                throw new Error(`Unexpected selector '${name}' (expected one of [${Object.keys(expectedSelectors).join(', ')}])`);
            }
            if (typeof value !== expectedSelectors[name].type) {
                throw new Error(`Selector '${name}' is of type ${typeof value} (expected ${expectedSelectors[name].type})`);
            }
        }
        for (const name of Object.keys(expectedSelectors)) {
            if (!name in selectors) {
                throw new Error(`Expected selector '${name}' not found`);
            }
        }
        return selectors;
    }

    documents() {
        return this.docIds.map(did => this.processor.documents[did]);
    }

    documentWithBook(bookCode) {
        const docsWithBook = Object.values(this.documents()).filter(doc => "bookCode" in doc.headers && doc.headers["bookCode"] === bookCode);
        return docsWithBook.length === 1 ? docsWithBook[0] : null;
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
            pos += succinct.byte(pos) + 1;
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
        const blockScope = this.unsuccinctifyScope(succinctBlockScope, itemType, itemSubtype, 0);
        const blockGrafts = this.unsuccinctifyGrafts(block.bg);
        const openScopes = this.unsuccinctifyScopes(block.os);
        const includedScopes = this.unsuccinctifyScopes(block.is);
        const blockItems = this.unsuccinctifyItems(block.c, options);
        return {
            bs: blockScope,
            bg: blockGrafts,
            c: blockItems,
            os: openScopes,
            is: includedScopes
        };
    }

    countItems(succinct) {
        let count = 0;
        let pos = 0;
        while (pos < succinct.length) {
            count++;
            const headerByte = succinct.byte(pos);
            const itemLength = headerByte & 0x0000003F;
            pos += itemLength;
        }
        return count;
    }

    unsuccinctifyScopes(succinct) {
        const ret = [];
        let pos = 0;
        while (pos < succinct.length) {
            const [itemLength, itemType, itemSubtype] = this.headerBytes(succinct, pos);
            ret.push(this.unsuccinctifyScope(succinct, itemType, itemSubtype, pos));
            pos += itemLength;
        }
        return ret;
    }

    unsuccinctifyGrafts(succinct) {
        const ret = [];
        let pos = 0;
        while (pos < succinct.length) {
            const [itemLength, itemType, itemSubtype] = this.headerBytes(succinct, pos);
            ret.push(this.unsuccinctifyGraft(succinct, itemSubtype, pos));
            pos += itemLength;
        }
        return ret;
    }

    unsuccinctifyItems(succinct, options) {
        const ret = [];
        let pos = 0;
        while (pos < succinct.length) {
            const [item, itemLength] = this.unsuccinctifyItem(succinct, pos, options);
            if (item) {
                ret.push(item);
            }
            pos += itemLength;
        }
        return ret;
    }

    unsuccinctifyItem(succinct, pos, options) {
        let item = null;
        const [itemLength, itemType, itemSubtype] = this.headerBytes(succinct, pos);
        switch (itemType) {
            case itemEnum.token:
                if (Object.keys(options).length === 0 || options.tokens) {
                    item = this.unsuccinctifyToken(succinct, itemSubtype, pos);
                }
                break;
            case itemEnum.startScope:
            case itemEnum.endScope:
                if (Object.keys(options).length === 0 || options.scopes) {
                    item = this.unsuccinctifyScope(succinct, itemType, itemSubtype, pos);
                }
                break;
            case itemEnum.graft:
                if (Object.keys(options).length === 0 || options.grafts) {
                    item = this.unsuccinctifyGraft(succinct, itemSubtype, pos);
                }
                break;
        }
        return [item, itemLength];
    }

    unsuccinctifyToken(succinct, itemSubtype, pos) {
        return [
            "token",
            tokenEnumLabels[itemSubtype],
            this.succinctTokenChars(succinct, itemSubtype, pos)
        ]
    }

    unsuccinctifyScope(succinct, itemType, itemSubtype, pos) {
        return [
            (itemType === itemEnum.startScope) ? "startScope" : "endScope",
            this.succinctScopeLabel(succinct, itemSubtype, pos)
        ];
    }

    unsuccinctifyGraft(succinct, itemSubtype, pos) {
        return [
            "graft",
            this.succinctGraftName(itemSubtype),
            this.succinctGraftSeqId(succinct, pos)
        ];
    }

    unsuccinctifyBlockScopeLabelsSet(block) {
        return new Set(
            this.unsuccinctifyScopes(block.os).concat(
                this.unsuccinctifyScopes(block.is)
            )
                .map(ri => ri[1]));
    }

    unsuccinctifyPrunedItems(block, options) {
        const openScopes = new Set(this.unsuccinctifyScopes(block.os).map(ri => ri[1]));
        const requiredScopes = options.requiredScopes || [];
        const allScopesInItem = () => {
            for (const scope of requiredScopes) {
                if (!openScopes.has(scope)) {
                    return false;
                }
            }
            return true;
        }
        const ret = [];
        for (const item of this.unsuccinctifyItems(block.c, options)) {
            if (item[0] === "startScope") {
                openScopes.add(item[1]);
            }
            if (allScopesInItem()) {
                ret.push(item);
            }
            if (item[0] === "endScope") {
                openScopes.delete(item[1]);
            }
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
