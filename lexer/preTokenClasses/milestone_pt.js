const PreToken = require('./pretoken');

class MilestonePT extends PreToken {

    constructor(subclass, matchedBits) {
        super(subclass);
        this.sOrE = null;
        if (subclass === "endMilestoneMarker") {
            this.printValue = "\\*";
        } else {
            this.tagName = matchedBits[2];
            if (subclass === "emptyMilestone") {
                this.printValue = `\\${this.tagName}\\*`;
            } else {
                this.printValue = `\\${this.tagName}`;
                this.sOrE = matchedBits[3];
            }
        }
    }

}

module.exports = MilestonePT;
