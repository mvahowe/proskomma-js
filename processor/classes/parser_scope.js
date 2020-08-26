const ParserScope = class {

    constructor(spec) {
        this.label = spec.label;
        this.endedBy = spec.endedBy;
        if ("onEnd" in spec) {
            this.onEnd = spec.onEnd;
        }
    }

}

module.exports = { ParserScope };