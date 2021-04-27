class MilestonePT {
  constructor(subclass, matchedBits) {
    this.subclass = subclass;
    this.sOrE = null;

    if (subclass === 'endMilestoneMarker') {
      this.printValue = '\\*';
    } else {
      this.tagName = matchedBits[2];

      if (subclass === 'emptyMilestone') {
        this.printValue = `\\${this.tagName}\\*`;
      } else {
        this.printValue = `\\${this.tagName}`;
        this.sOrE = matchedBits[3];
      }
    }
  }
}

module.exports = MilestonePT;
