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
        if (this.blocks.length === 0) {
            this.blocks.push(new Block());
        }
        this.lastBlock().addToken(pt);
    }

    lastBlock() {
        return this.blocks.length > 0 ? this.blocks[this.blocks.length - 1] : null;
    }

}

module.exports = {Sequence};
