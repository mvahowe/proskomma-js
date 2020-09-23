const { generateId } = require("../generate_id");
const ByteArray = require("../../lib/byte_array");
const { Block } = require("./block");
const { Token, Scope } = require("./items");
const { scopeEnum } = require('../resources/scope_defs');
const { tokenEnum, tokenCategory } = require('../resources/token_defs');
const { itemEnum } = require('../resources/item_defs');
const { graftLocation } = require('../resources/graft_defs');


const Sequence = class {

    constructor(sType) {
        this.id = generateId();
        this.type = sType;
        this.blocks = [];
        this.activeScopes = [];
    }

    plainText() {
        return this.blocks.map(b => b.plainText()).join('').trim();
    }

    addItem(i) {
        this.lastBlock().addItem(i);
    }

    lastBlock() {
        if (this.blocks.length === 0) {
            this.newBlock("orphanTokens");
        }
        return this.blocks[this.blocks.length - 1];
    }

    newBlock(label) {
        if (!label) {
            throw new Error("Sequence.newBlock now requires label");
        }
        if (this.blocks.length > 0 && this.blocks[this.blocks.length - 1].blockScope.label === "orphanTokens") {
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
        for (const activeScope of this.activeScopes.filter(x => true).reverse()) {
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
        return this.blocks.map(b => b.filterGrafts(options)).reduce((acc, current, idx, arr) => acc.concat(current), []);
    }

    filterScopes(options) {
        this.blocks.forEach(b => b.filterScopes(options));
    }

    grafts() {
        return this.blocks.map( b => b.grafts()).reduce((acc, current) => acc.concat(current), []);
    }

    scopes() {
        return this.blocks.map( b => b.scopes()).reduce((acc, current) => acc.concat(current), []);
    }

    items() {
        return this.blocks.map( b => b.items).reduce((acc, current) => acc.concat(current), []);
    }

    moveOrphanScopes() {
        if (this.blocks.length > 1) {
            this.moveOrphanStartScopes();
            this.moveOrphanEndScopes();
        }
    }

    moveOrphanStartScopes() {
        for (const [blockNo, block] of this.blocks.entries()) {
            if (blockNo === this.blocks.length - 2) {
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

    removeEmptyBlocks() {
        this.blocks = this.blocks.filter(b => b.items.length > 0);
    }

    succinctifyBlocks(docSet) {
        const ret = [];
        for (const block of this.blocks) {
            const contentBA = new ByteArray(block.length);
            const blockGraftsBA = new ByteArray(1);
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
                        if (this.graftLocation(item.graftType) === "inline") {
                            this.pushSuccinctGraft(contentBA, docSet, item);
                        } else {
                            this.pushSuccinctGraft(blockGraftsBA, docSet, item);
                        }
                        break;
                    case "startScope":
                    case "endScope":
                        this.pushSuccinctScope(contentBA, docSet, item);
                        break;
                    default:
                        throw new Error(`Item type ${item.itemType} is not handled in succinctifyBlocks`);
                }
            }
            const blockScopeBA = new ByteArray(10);
            this.pushSuccinctScope(blockScopeBA, docSet, block.blockScope);
            contentBA.trim();
            blockGraftsBA.trim();
            blockScopeBA.trim();
            ret.push({
                c: contentBA,
                bs: blockScopeBA,
                bg: blockGraftsBA
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

    graftLocation(graftString) {
        if (graftString in graftLocation) {
            return graftLocation[graftString];
        } else if (graftString.startsWith("zb-")) {
            return "block";
        } else if (graftString.startsWith("zi-")) {
            return "inline";
        } else {
            throw new Error(`Could not find graft location for '${graftString}'`);
        }
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

    describe(seqById, indent) {
        indent = indent || 1
        const grafts = this.grafts()
        const scopes = this.scopes()
        const items = this.items()
        const maybeS = function(prompt, n) {
            if (n === 1) {
                return `1 ${prompt}`;
            } else {
                return `${n} ${prompt}s`;
            }
        }
        console.log(`${"   ".repeat(indent)}${this.type} seq ${this.id} has ${maybeS("block", this.blocks.length)} with ${maybeS("item", items.length)}, ${maybeS("graft", grafts.length)}, ${maybeS("scope", scopes.length)}`)
        if (items.length > (scopes.length * 2 + grafts.length)) {
            let tokensText = items.filter(i => i instanceof Token).map(t => t.chars).join('');
            if (tokensText.length > 80) {
                tokensText = tokensText.substring(0, 80) + "...";
            }
            console.log(`${"   ".repeat(indent + 1)}Tokens: ${tokensText}`)
        }
        if (scopes.length > 0) {
            console.log(`${"   ".repeat(indent + 1)}Scopes:`)
        }
        for (const scope of scopes.slice(0, 5)) {
            console.log(`${"   ".repeat(indent + 2)}${scope[1].label}`)
        }
        if (scopes.length > 5) {
            console.log(`${"   ".repeat(indent + 2)}[plus ${scopes.length - 5} more]`)
        }
        if (grafts.length > 0) {
            console.log(`${"   ".repeat(indent + 1)}Grafts:`)
            for (const graft of grafts) {
                seqById[graft[1].seqId].describe(seqById, indent + 2)
            }
        }
    }

}

module.exports = {Sequence};
