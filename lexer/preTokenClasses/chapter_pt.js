const PreToken = require('./pretoken');

class ChapterPT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.numberString = matchedBits[2];
        this.number = parseInt(this.numberString);
        this.printValue = `\\c ${this.numberString}\n`;
    }

}

module.exports = ChapterPT;
