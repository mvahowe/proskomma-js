class VersesPT {
  constructor(subclass, matchedBits) {
    this.subclass = subclass;
    this.numberString = matchedBits[2];

    if (this.numberString.includes('-')) {
      const [fromV, toV] = this.numberString.split('-').map(v => parseInt(v));
      this.numbers = Array.from(Array((toV - fromV) + 1).keys()).map(v => v + fromV);
    } else {
      this.numbers = [parseInt(this.numberString)];
    }
    this.printValue = `\\v ${this.numberString}\n`;
  }
}

module.exports = VersesPT;
