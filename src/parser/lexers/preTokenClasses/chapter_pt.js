class ChapterPT {
  constructor(subclass, matchedBits) {
    this.subclass = subclass;
    this.numberString = matchedBits[2];
    this.number = parseInt(this.numberString);
    this.printValue = `\\c ${this.numberString}\n`;
  }
}

module.exports = ChapterPT;
