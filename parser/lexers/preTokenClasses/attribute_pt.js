const PreToken = require('./pretoken');

class AttributePT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.key = matchedBits[2];
        this.valueString = matchedBits[3].trim().replace(/\//g,"÷");
        this.values = this.valueString.split(",").map(vb => vb.trim());
        this.printValue = `| ${this.key}="${this.valueString}"`;
    }

}

module.exports = AttributePT;
