const { generateId } = require("../generate_id");
const { Token, Scope, Graft } = require("./items");

const Block = class {

    constructor () {
        this.id = generateId();
        this.items = [];
    }

    addItem(i) {
        this.items.push(i);
    }

    plainText() {
        return this.items.filter(i => i instanceof Token).map(i => i.chars).join('');
    }

    trim() {
        this.items = this.trimEnd(this.trimStart(this.items))
    }

    reorderSpanWithAtts() {
        const swaStarts = [];
        for (const [pos, item] of this.items.entries()) {
            if (item.itemType === "startScope" && item.label.startsWith("spanWithAtts")) {
                swaStarts.push(pos + 1);
            }
        }
        for (const swaStart of swaStarts) {
            let pos = swaStart;
            let tokens = [];
            let scopes = [];
            while (true) {
                if (pos >= this.items.length) {
                    break;
                }
                const item = this.items[pos];
                if (item instanceof Token) {
                    tokens.push(item);
                } else if (item.itemType === "startScope" && item.label.startsWith("attribute/spanWithAtts")) {
                    scopes.push(item);
                } else {
                    break;
                }
                pos++;
            }
            if (tokens.length !== 0 && scopes.length !== 0) {
                let pos = swaStart;
                for (const s of scopes) {
                    this.items[pos] = s;
                    pos++;
                }
                for (const t of tokens) {
                    this.items[pos] = t;
                    pos++;
                }
            }
        }
    }

    makeNoteGrafts(parser) {
        const { Sequence } = require("./sequence");
        const noteStarts = [];
        for (const [pos, item] of this.items.entries()) {
            if (item.itemType === "startScope" && item.label.startsWith("inline/f")) {
                noteStarts.push(pos);
            }
        }
        for (const noteStart of noteStarts) {
            const callerToken = this.items[noteStart + 1];
            if (callerToken instanceof Token && callerToken.chars.length === 1) {
                const callerSequence = new Sequence("noteCaller");
                callerSequence.newBlock();
                callerSequence.addItem(callerToken);
                parser.sequences.noteCaller.push(callerSequence);
                this.items[noteStart + 1] = new Graft("noteCaller", callerSequence.id);
            }
        }
    }

    trimStart(items) {
        if (items.length === 0) {
            return items;
        }
        const firstItem = items[0];
        if (["lineSpace", "eol"].includes(firstItem.itemType)) {
            return this.trimStart(items.slice(1));
        }
        if (firstItem instanceof Token) {
            return items;
        }
        return [firstItem, ...this.trimStart(items.slice(1))];
    }

    trimEnd(items) {
        if (items.length === 0) {
            return items;
        }
        const lastItem = items[items.length - 1];
        if (["lineSpace", "eol"].includes(lastItem.itemType)) {
            return this.trimEnd(items.slice(0, items.length - 1));
        }
        if (lastItem instanceof Token) {
            return items;
        }
        return [...this.trimEnd(items.slice(0, items.length - 1)), lastItem];
    }

    filterGrafts(options) {
        // Each graft should be removed or returned
        const ret = [];
        const toRemove = [];
        for (const [pos, item] of this.grafts()) {
            if (this.graftPassesOptions(item, options)) {
                ret.push(item.seqId);
            } else {
                toRemove.push(pos);
            }
        }
        for (const [count, pos] of Array.from(toRemove.entries())) {
            this.items.splice(pos - count, 1);
        }
        return ret;
    }

    graftPassesOptions(item, options) {
        return true;
    }

    grafts() {
        return Array.from(this.items.entries()).filter(ip => ip[1].itemType === "graft");
    }

    scopes() {
        return Array.from(this.items.entries()).filter(ip => ip[1].itemType === "startScope");
    }
}

module.exports = { Block };