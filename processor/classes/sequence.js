const { generateId } = require("../generate_id");
const { Block } = require("./block");
const { Scope } = require("./items");

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
        if (this.blocks.length > 0) {
            return this.blocks[this.blocks.length - 1];
        } else {
            throw new Error(`lastBlock when no blocks present in ${this.type} sequence`);
        }
    }

    newBlock(label) {
        this.blocks.push(new Block());
        if (label) {
            this.lastBlock().addItem(
                new Scope("start", label)
            )
        }
    }

    trim() {
        this.blocks.forEach(b => b.trim());
    }

    reorderSpanWithAtts() {
        this.blocks.forEach(b => b.reorderSpanWithAtts());
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
        return this.blocks.map( b => b.filterGrafts(options)).reduce((acc, current) => acc.concat(current));
    }

    grafts() {
        return this.blocks.map( b => b.grafts()).reduce((acc, current) => acc.concat(current));
    }

    scopes() {
        return this.blocks.map( b => b.scopes()).reduce((acc, current) => acc.concat(current));
    }

    describe(seqById, indent) {
        indent = indent || 1
        const grafts = this.grafts()
        const scopes = this.scopes()
        const maybeS = function(prompt, n) {
            if (n === 1) {
                return `1 ${prompt}`;
            } else {
                return `${n} ${prompt}s`;
            }
        }
        console.log(`${"   ".repeat(indent)}${this.type} seq ${this.id} has ${maybeS("block", this.blocks.length)}, ${maybeS("graft", grafts.length)}, ${maybeS("scope", scopes.length)}`)
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
