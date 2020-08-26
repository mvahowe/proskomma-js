const { ParserScope } = require("./parser_scope");

const ParserAction = class {

    constructor(spec) {
        this.contexts = spec.contexts;
        this.parser = {};
        ["baseSequenceType", "inlineSequenceType", "forceNewSequence", "useTempSequence"].map(
            p => {
                if (p in spec.parser) {
                    this.parser[p] = spec.parser[p];
                }
            }
        );
        if ("newScopes" in spec.parser) {
            this.parser.newScopes = spec.parser.newScopes.map(s => new ParserScope(s));
        }
    }

}

module.exports = { ParserAction };