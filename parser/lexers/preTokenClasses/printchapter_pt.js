const PreToken = require('./pretoken');

class PrintChapterPT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.numberString = matchedBits[2];
        this.printValue = `\\cp ${this.numberString}\n`;
    }

}

module.exports = PrintChapterPT;
