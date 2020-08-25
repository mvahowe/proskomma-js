const PreToken = require('./pretoken');

class BadPT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.printValue = `[BAD ${matchedBits[0]}]`;
    }

}

module.exports = BadPT;
