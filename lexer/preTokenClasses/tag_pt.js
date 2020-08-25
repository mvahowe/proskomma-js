const PreToken = require('./pretoken');

class TagPT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.tagName = matchedBits[2];
        this.printValue = subclass === "startTag" ? `\\${this.tagName} ` : `\\${this.tagName}*`;
    }

}

module.exports = TagPT;
