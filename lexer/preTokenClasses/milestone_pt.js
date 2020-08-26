const PreToken = require('./pretoken');

class MilestonePT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        if (subclass === "endMilestoneMarker") {
            this.printValue = "\\*";
        } else {
            this.tagName = matchedBits[2];
            if (subclass === "emptyMilestone") {
                this.printValue = `\\${this.tagName}\\*`;
            } else {
                this.printValue = `\\${this.tagName}`;
            }
        }
    }

}

module.exports = MilestonePT;
