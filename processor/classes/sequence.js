const { Block } = require("./block");

const Sequence = class {

    constructor(sType) {
        this.type = sType;
        this.blocks = [];
    }

    plainText() {
        return this.blocks.map(b => b.plainText()).join('').trim();
    }

    addToken(pt) {
        this.lastBlock().addToken(pt);
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
    }

}

module.exports = {Sequence};
