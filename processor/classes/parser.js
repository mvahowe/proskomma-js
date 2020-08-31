const {Sequence} = require("./sequence");
const {specs} = require("../resources/parser_specs");
const {Token, Scope} = require("./items");
const {labelForScope} = require("../label_for_scope");

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
                    throw new Error(`Unexpected sequence arity '${sArity}' for '${sType}'`);
            }
        }
    }

    setCurrent() {
        this.current = {
            sequence: this.sequences.main,
            parentSequence: null,
            baseSequenceType: "main",
            inlineSequenceType: null
        }
    }

    parse(lexedItems) {
        this.parseFirstPass(lexedItems);
        for (const seq of this.allSequences()) {
            seq.close(this);
        }
        console.log(JSON.stringify(this.sequences.main, null, 2));
    }

    parseFirstPass(lexedItems) {
        let changeBaseSequence;
        for (const lexedItem of lexedItems) {
            const spec = this.specForItem(lexedItem);
            if (spec) {
                if ("before" in spec.parser) {
                    spec.parser.before(this, lexedItem);
                }
                changeBaseSequence = spec.parser.baseSequenceType && (
                    (spec.parser.baseSequenceType !== this.current.baseSequenceType) ||
                    spec.parser.forceNewSequence
                );
                if (changeBaseSequence) {
                    this.closeActiveScopes("baseSequenceChange");
                    this.changeBaseSequence(spec.parser);
                    if ("newBlock" in spec.parser) {
                        this.closeActiveScopes("endBlock");
                        this.current.sequence.newBlock(labelForScope("blockTag", [lexedItem.fullTagName]));
                        const blockScope = {
                            label: pt => labelForScope("blockTag", [pt.fullTagName]),
                            endedBy: ["endBlock"]
                        };
                        this.openNewScope(lexedItem, blockScope, false);
                    }
                } else if (spec.parser.inlineSequenceType) {
                    this.current.inlineSequenceType = spec.parser.inlineSequenceType;
                    this.current.parentSequence = this.current.sequence;
                    this.current.sequence = new Sequence(this.current.inlineSequenceType);
                    this.current.sequence.newBlock();
                    this.sequences[this.current.inlineSequenceType].push(this.current.sequence);
                }
                if ("during" in spec.parser) {
                    spec.parser.during(this, lexedItem);
                }
                this.openNewScopes(spec.parser, lexedItem);
                if ("after" in spec.parser) {
                    spec.parser.after(this, lexedItem);
                }
            } else {
                if (lexedItem.subclass === "endTag") {
                    this.closeActiveScopes(`endTag/${lexedItem.fullTagName}`)
                }
            }
        }
    }

    allSequences() {
        const ret = [];
        for (const [seqName, seqArity] of Object.entries({...this.baseSequenceTypes, ...this.inlineSequenceTypes})) {
            switch (seqArity) {
                case "1":
                case "?":
                    if (this.sequences[seqName]) {
                        ret.push(this.sequences[seqName]);
                    }
                    break;
                case "*":
                    this.sequences[seqName].forEach(s => {
                        ret.push(s)
                    });
                    break;
                default:
                    throw new Error(`Unexpected sequence arity '${seqArity}' for '${seqName}'`);
            }
        }
        return ret;
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

    closeActiveScopes(closeLabel) {
        const matchedScopes = this.current.sequence.activeScopes.filter(
            sc => sc.endedBy.includes(closeLabel)
        );
        this.current.sequence.activeScopes = this.current.sequence.activeScopes.filter(
            sc => !sc.endedBy.includes(closeLabel)
        );
        matchedScopes.forEach(ms => this.closeActiveScope(ms));
    }

    closeActiveScope(sc) {
        this.addScope("end", sc.label);
        if (sc.onEnd) {
            sc.onEnd(this, sc.label);
        }
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

    returnToBaseSequence() {
        this.current.inlineSequenceType = null;
        this.current.sequence = this.current.parentSequence;
        this.current.parentSequence = null;
    }

    openNewScopes(parserSpec, pt) {
        if (parserSpec.newScopes) {
            parserSpec.newScopes.forEach(sc => this.openNewScope(pt, sc));
        }
    }

    openNewScope(pt, sc, addItem) {
        if (addItem === undefined) {addItem = true};
        if (addItem) {
            this.current.sequence.addItem(new Scope("start", sc.label(pt)));
        }
        const newScope = {
            label: sc.label(pt),
            endedBy: sc.endedBy
        };
        if ("onEnd" in sc) {
            newScope.onEnd = sc.onEnd;
        }
        this.current.sequence.activeScopes.push(newScope);
    }

    addToken(pt) {
        this.current.sequence.addItem(new Token(pt));
    }

    addScope(sOrE, label) {
        this.current.sequence.addItem(new Scope(sOrE, label));
    }

}

module.exports = {Parser};
