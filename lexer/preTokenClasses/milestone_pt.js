const PreToken = require('./pretoken');

class MilestonePT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.printValue = null;
    }

}

module.exports = MilestonePT;
