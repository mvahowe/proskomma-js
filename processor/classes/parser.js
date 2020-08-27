const {Sequence} = require("./sequence");
const {specs} = require("../resources/parser_specs");
const { Token } = require("./items");

const Parser = class {

    constructor() {
        this.specs = specs;
        this.headers = {};
        this.setSequenceTypes();
        this.setSequences();
        this.setCurrent();
    }

    setSequenceTypes() {
        this.baseSequenceTypes = {
            main: "1",
            intro: "*",
            title: "?",
            endTitle: "?",
            heading: "*",
            header: "*",
            remark: "*",
            footnote: "*"
        };
        this.inlineSequenceTypes = {
            xref: "*",
            temp: "?"
        };
    }

    setSequences() {
        this.sequences = {};
        for (const [sType, sArity] of Object.entries({...this.baseSequenceTypes, ...this.inlineSequenceTypes})) {
            switch (sArity) {
                case "1":
                    this.sequences[sType] = new Sequence(sType);
                    break;
                case "?":
                    this.sequences[sType] = null;
                    break;
                case "*":
                    this.sequences[sType] = [];
                    break;
                default:
                    throw new Error(`Unexpected base sequence arity '${sArity}' for '${sType}'`);
            }
        }
    }

    setCurrent() {
        this.current = {
            sequence: this.sequences.main,
            activeScopes: [],
            baseSequenceType: "main",
            inlineSequenceType: null
        }
    }

    parse(lexedItems) {
        let changeSequence;
        for (const lexedItem of lexedItems) {
            const spec = this.specForItem(lexedItem);
            if (spec) {
                if ("before" in spec.parser) {
                    spec.parser.before(this, lexedItem);
                }
                changeSequence = spec.parser.baseSequenceType && (
                    (spec.parser.baseSequenceType !== this.current.baseSequenceType) ||
                    spec.parser.forceNewSequence
                );
                if (changeSequence) {
                    this.closeActiveScopes(spec.parser, "baseSequenceChange");
                    this.changeBaseSequence(spec.parser);
                }
                if ("newBlock" in spec.parser) {
                    this.current.sequence.newBlock(lexedItem.fullTagName);
                }
                if ("during" in spec.parser) {
                    spec.parser.during(this, lexedItem);
                }
                if (changeSequence) {
                    this.openNewScopes(spec.parser, lexedItem);
                }
                if ("after" in spec.parser) {
                    spec.parser.after(this, lexedItem);
                }
            }
        }
        console.log(this.headers);
    }

    specForItem(item) {
        let ret = null;
        for (const spec of this.specs) {
            if (this.specMatchesItem(spec, item)) {
                ret = spec;
                break;
            }
        }
        return ret;
    }

    specMatchesItem(spec, item) {
        for (const [subclass, accessor, values] of spec.contexts) {
            if (
                (item.subclass === subclass) &&
                (!accessor || values.includes(item[accessor]))
            ) {
                return true;
            }
        }
        return false;
    }

    closeActiveScopes(parserSpec, closeLabel) {
        const matchedScopes = this.current.activeScopes.filter(
            sc => sc.endedBy.includes(closeLabel)
        );
        const parser = this;
        matchedScopes.forEach(
            sc => {
                if (sc.onEnd) {
                    sc.onEnd(parser, sc.label);
                }
            }
        );
        this.current.activeScopes = this.current.activeScopes.filter(
            sc => !sc.endedBy.includes(closeLabel)
        );
    }

    changeBaseSequence(parserSpec) {
        const newType = parserSpec.baseSequenceType
        this.current.baseSequenceType = newType;
        const arity = this.baseSequenceTypes[newType];
        switch (arity) {
            case "1":
                this.current.sequence = this.sequences[newType];
                break;
            case "?":
                if (!this.sequences[newType]) {
                    this.sequences[newType] = new Sequence(newType);
                }
                this.current.sequence = this.sequences[newType];
                break;
            case "*":
                this.current.sequence = new Sequence(newType);
                if (!parserSpec.useTempSequence) {
                    this.sequences[newType].push(this.current.sequence);
                }
                break;
            default:
                throw new Error(`Unexpected base sequence arity '${arity}' for '${newType}'`);
        }
    }

    openNewScopes(parserSpec, pt) {
        parserSpec.newScopes.forEach(
            (sc) => {
                const newScope = {
                    label: sc.label(pt),
                    endedBy: sc.endedBy
                };
                if ("onEnd" in sc) {
                    newScope.onEnd = sc.onEnd;
                }
                this.current.activeScopes.push(newScope);
            }
        );

    }

    addToken(pt) {
        this.current.sequence.addItem(new Token(pt));
    }

}

module.exports = { Parser };
