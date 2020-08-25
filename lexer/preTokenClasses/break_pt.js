const PreToken = require('./pretoken');

class BreakPT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.printValue = matchedBits[0];
    }

}

module.exports = BreakPT;
