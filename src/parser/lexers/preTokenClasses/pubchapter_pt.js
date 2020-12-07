const PreToken = require('./pretoken');

class PubChapterPT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.numberString = matchedBits[2];
        this.printValue = `\\cp ${this.numberString}\n`;
    }

}

module.exports = PubChapterPT;
