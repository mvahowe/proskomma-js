class PubChapterPT {
  constructor(subclass, matchedBits) {
    this.subclass = subclass;
    this.numberString = matchedBits[2];
    this.printValue = `\\cp ${this.numberString}\n`;
  }
}

module.exports = PubChapterPT;
