const { Block } = require("./block");

const Sequence = class {

    constructor(sType) {
        this.type = sType;
        this.blocks = [];
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
    }

}

module.exports = {Sequence};
