const {
    generateId,
    ByteArray,
    scopeEnum,
    labelForScope,
    tokenEnum,
    tokenCategory,
    itemEnum,
    addTag
} = require("proskomma-utils");
const { Block } = require("./block");
const { Graft, Scope } = require("./items");

const Sequence = class {

    constructor(sType) {
        this.id = generateId();
        this.type = sType;
        this.tags = new Set([]);
        this.blocks = [];
        this.activeScopes = [];
    }

    addTag(tag) {
        addTag(this.tags, tag);
    }

    plainText() {
        return this.blocks.map(b => b.plainText()).join('').trim();
    }

    addItem(i) {
        this.lastBlock().addItem(i);
    }

    addBlockGraft(g) {
        this.newBlock("hangingGraft");
        this.lastBlock().blockGrafts.push(g);
    }

    lastBlock() {
        if (this.blocks.length === 0) {
            this.newBlock("orphanTokens");
        }
        return this.blocks[this.blocks.length - 1];
    }

    newBlock(label) {
        if (this.blocks.length > 0 && ["orphanTokens", "hangingGraft"].includes(this.blocks[this.blocks.length - 1].blockScope.label)) {
            this.lastBlock().blockScope = new Scope("start", label);
        } else {
            this.blocks.push(new Block(label));
        }
    }

    trim() {
        this.blocks.forEach(b => b.trim());
    }

    reorderSpanWithAtts() {
        this.blocks.forEach(b => b.reorderSpanWithAtts());
    }

    makeNoteGrafts(parser) {
        this.blocks.forEach(b => b.makeNoteGrafts(parser));
    }

    close(parser) {
        for (const activeScope of this.activeScopes.filter(() => true).reverse()) {
            this.closeActiveScope(parser, activeScope);
        }
        this.activeScopes = [];
    }

    closeActiveScope(parser, sc) {
        this.addItem(new Scope("end", sc.label));
        if (sc.onEnd) {
            sc.onEnd(parser, sc.label);
        }
    }

    filterGrafts(options) {
        return this.blocks.map(b => b.filterGrafts(options)).reduce((acc, current) => acc.concat(current), []);
    }

    filterScopes(options) {
        this.blocks.forEach(b => b.filterScopes(options));
    }

    text() {
        return this.blocks.map(b => b.text()).join('');
    }

    addTableScopes() {
        let inTable = false;
        for (const [blockNo, block] of this.blocks.entries()) {
            if (!inTable && block.blockScope.label === "blockTag/tr") {
                inTable = true;
                this.blocks[blockNo].items.unshift(new Scope("start", labelForScope("table", [])));
            } else if (inTable && block.blockScope.label !== "blockTag/tr") {
                inTable = false;
                this.blocks[(blockNo - 1)].items.push(new Scope("end", labelForScope("table", [])));
            }
        }
        if (inTable) {
            this.lastBlock().items.push(new Scope("end", labelForScope("table", [])));
        }
    }

    graftifyIntroductionHeadings(parser) {
        let removed = 0;
        let blockEntries = [...this.blocks.entries()];
        blockEntries.reverse();
        const introHeadingTags = ["iot", "is"].concat(parser.customTags.introHeading);
        for (const [n, block] of blockEntries) {
            const blockTag = block.blockScope.label.split("/")[1].replace(/[0-9]/g, "");
            if (introHeadingTags.includes(blockTag)) {
                const headingSequence = new Sequence("heading");
                parser.sequences.heading.push(headingSequence);
                headingSequence.blocks.push(block);
                const headingGraft = new Graft("heading", headingSequence.id);
                if (this.blocks.length < n + 2) {
                    this.newBlock("blockTag/hangingGraft");
                }
                this.blocks[n + 1].blockGrafts.unshift(headingGraft);
                this.blocks.splice(n, 1);
                removed++;
            } else if (blockTag.startsWith("imt")) {
                const titleType = (blockTag.startsWith("imte") ? "introEndTitle" : "introTitle");
                let titleSequence;
                if (parser.sequences[titleType]) {
                    titleSequence = parser.sequences[titleType];
                } else {
                    const graftType = (blockTag.startsWith("imte") ? "endTitle" : "title");
                    titleSequence = new Sequence(graftType);
                    parser.sequences[titleType] = titleSequence;
                    const titleGraft = new Graft(graftType, titleSequence.id);
                    if (this.blocks.length < n + 2) {
                        this.newBlock("blockTag/hangingGraft");
                    }
                    this.blocks[n + 1].blockGrafts.unshift(titleGraft);
                }
                this.blocks.splice(n, 1);
                titleSequence.blocks.unshift(block);
                removed++;
            }
        }
    }

    moveOrphanScopes() {
        if (this.blocks.length > 1) {
            this.moveOrphanStartScopes();
            this.moveOrphanEndScopes();
        }
    }

    moveOrphanStartScopes() {
        for (const [blockNo, block] of this.blocks.entries()) {
            if (blockNo >= this.blocks.length - 1) {
                continue;
            }
            for (const item of [...block.items].reverse()) {
                if (item.itemType !== "startScope") {
                    break;
                }
                this.blocks[blockNo + 1].items.unshift(this.blocks[blockNo].items.pop());
            }
        }
    }

    moveOrphanEndScopes() {
        for (const [blockNo, block] of this.blocks.entries()) {
            if (blockNo === 0) {
                continue;
            }
            for (const item of [...block.items]) {
                if (item.itemType !== "endScope") {
                    break;
                }
                this.blocks[blockNo - 1].items.push(this.blocks[blockNo].items.shift());
            }
        }
    }

    removeEmptyBlocks(customCanBeEmpty) {
        const canBeEmpty = ["blockTag/b", "blockTag/ib"].concat(customCanBeEmpty);
        const emptyBlocks = [];
        let changed = false;
        for (const blockRecord of this.blocks.entries()) {
            if (blockRecord[1].tokens().length === 0 && !canBeEmpty.includes(blockRecord[1].blockScope.label)) {
                emptyBlocks.push(blockRecord);
            }
        }
        for (const [n, block] of emptyBlocks.reverse()) {
            if (n < this.blocks.length - 1) {
                for (const bg of [...block.blockGrafts].reverse()) {
                    this.blocks[n + 1].blockGrafts.unshift(bg);
                }
                for (const i of block.items.reverse()) {
                    this.blocks[n + 1].items.unshift(i);
                }
                this.blocks.splice(n, 1);
                changed = true;
            } else if (block.blockGrafts.length === 0 && block.items.length === 0) {
                this.blocks.splice(n, 1);
                changed = true;
            }
        }
        if (changed) {
            this.removeEmptyBlocks(customCanBeEmpty);
        }
    }

    removeGraftsToEmptySequences(emptySequences) {
        this.blocks.forEach(b => b.removeGraftsToEmptySequences(emptySequences));
    }

    succinctifyBlocks(docSet) {
        const ret = [];
        let openScopes = [];

        const updateOpenScopes = item => {
            if (item.itemType === "startScope") {
                const existingScopes = openScopes.filter(s => s.label === item.label);
                if (existingScopes.length === 0) {
                    openScopes.push(item);
                }
            } else {
                openScopes = openScopes.filter(s => s.label !== item.label);
            }
        }

        for (const block of this.blocks) {
            const contentBA = new ByteArray(block.length);
            const blockGraftsBA = new ByteArray(1);
            const openScopesBA = new ByteArray(1);
            const includedScopesBA = new ByteArray(1);
            for (const bg of block.blockGrafts) {
                this.pushSuccinctGraft(blockGraftsBA, docSet, bg);
            }
            for (const os of openScopes) {
                this.pushSuccinctScope(openScopesBA, docSet, os);
            }
            const includedScopes = [];
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
                        this.pushSuccinctToken(contentBA, docSet, item);
                        break;
                    case "graft":
                        this.pushSuccinctGraft(contentBA, docSet, item);
                        break;
                    case "startScope":
                    case "endScope":
                        this.pushSuccinctScope(contentBA, docSet, item);
                        updateOpenScopes(item);
                        if (item.itemType === "startScope") {
                            includedScopes.push(item);
                        }
                        break;
                    default:
                        throw new Error(`Item type ${item.itemType} is not handled in succinctifyBlocks`);
                }
            }
            const blockScopeBA = new ByteArray(10);
            this.pushSuccinctScope(blockScopeBA, docSet, block.blockScope);
            for (const is of includedScopes) {
                this.pushSuccinctScope(includedScopesBA, docSet, is);
            }
            contentBA.trim();
            blockGraftsBA.trim();
            blockScopeBA.trim();
            openScopesBA.trim();
            includedScopesBA.trim();
            ret.push({
                c: contentBA,
                bs: blockScopeBA,
                bg: blockGraftsBA,
                os: openScopesBA,
                is: includedScopesBA
            });
        }
        return ret;
    }

    pushSuccinctToken(bA, docSet, item) {
        const charsEnum = docSet.enumForCategoryValue(tokenCategory[item.itemType], item.chars);
        const lengthPos = bA.length;
        bA.pushByte(0);
        bA.pushByte(tokenEnum[item.itemType]);
        bA.pushNByte(charsEnum);
        bA.setByte(lengthPos, (bA.length - lengthPos) | itemEnum.token << 6);
    }

    pushSuccinctGraft(bA, docSet, item) {
        const graftTypeEnum = docSet.enumForCategoryValue("graftTypes", item.graftType);
        const seqEnum = docSet.enumForCategoryValue("ids", item.seqId);
        const lengthPos = bA.length;
        bA.pushByte(0);
        bA.pushByte(graftTypeEnum);
        bA.pushNByte(seqEnum);
        bA.setByte(lengthPos, (bA.length - lengthPos) | itemEnum.graft << 6);
    }

    pushSuccinctScope(bA, docSet, item) {
        const scopeBits = item.label.split("/");
        const lengthPos = bA.length;
        bA.pushByte(0);
        bA.pushByte(scopeEnum[scopeBits[0]]);
        for (const scopeBit of scopeBits.slice(1)) {
            bA.pushNByte(docSet.enumForCategoryValue("scopeBits", scopeBit));
        }
        bA.setByte(lengthPos, (bA.length - lengthPos) | itemEnum[item.itemType] << 6);
    }

}

module.exports = { Sequence };
