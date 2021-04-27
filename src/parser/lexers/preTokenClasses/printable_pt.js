class PrintablePT {
  constructor(subclass, matchedBits) {
    this.subclass = subclass;
    this.printValue = matchedBits[0];
  }
}

module.exports = PrintablePT;
