const PreToken = require('./pretoken');

class PrintablePT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.printValue = matchedBits[0];
    }

};

module.exports = PrintablePT;
