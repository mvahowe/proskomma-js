const PreToken = require('./pretoken');

class TagPT extends PreToken {

  constructor(subclass, matchedBits) {
    // console.log(matchedBits);
    super(subclass);
    this.tagName = matchedBits[2];
    this.isNested = false;
    if (this.tagName.startsWith('+')) {
      this.isNested = true;
      this.tagName = this.tagName.substring(1);
    }
    this.tagLevel = matchedBits[3] !== '' ? parseInt(matchedBits[3]) : 1;
    this.fullTagName = `${this.tagName}${matchedBits[3] === '1' ? '' : matchedBits[3]}`;
    this.printValue = subclass === 'startTag' ? `\\${this.fullTagName} ` : `\\${this.fullTagName}*`;
  }

}

module.exports = TagPT;
