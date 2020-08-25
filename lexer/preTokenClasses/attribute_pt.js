const PreToken = require('./pretoken');

class AttributePT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.printValue = null;
    }

}

module.exports = AttributePT;
