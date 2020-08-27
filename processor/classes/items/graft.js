const { Item } = require("./item");

const Graft = class extends Item {

    constructor(label, seqId) {
        super("graft");
        this.label = label;
        this.seqId = seqId;
    }

}

module.exports = { Graft };
