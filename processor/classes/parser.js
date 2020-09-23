const {Sequence} = require("./sequence");
const {specs} = require("../resources/parser_specs");
const {Token, Scope, Graft} = require("./items");
const {labelForScope} = require("../resources/scope_defs");

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
            remark: "*"
        };
        this.inlineSequenceTypes = {
            footnote: "*",
            noteCaller: "*",
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
            inlineSequenceType: null,
            attributeContext: null
        }
    }

    parse(lexedItems) {
        let changeBaseSequence = false;
        for (const lexedItem of lexedItems) {
            if (["endTag"].includes(lexedItem.subclass)) {
                this.closeActiveScopes(`endTag/${lexedItem.fullTagName}`)
            }
            if (["startMilestoneTag"].includes(lexedItem.subclass) && lexedItem.sOrE === "e") {
                this.closeActiveScopes(`endMilestone/${lexedItem.tagName}`)
            }
            if (["chapter", "verses"].includes(lexedItem.subclass)) {
                this.closeActiveScopes(lexedItem.subclass);
            }
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
                    }
                } else if (spec.parser.inlineSequenceType) {
                    this.current.inlineSequenceType = spec.parser.inlineSequenceType;
                    this.current.parentSequence = this.current.sequence;
                    this.current.sequence = new Sequence(this.current.inlineSequenceType);
                    this.current.sequence.newBlock(labelForScope("inline", spec.parser.inlineSequenceType));
                    this.sequences[this.current.inlineSequenceType].push(this.current.sequence);
                    this.current.parentSequence.addItem(new Graft(this.current.inlineSequenceType, this.current.sequence.id))
                } else if ("newBlock" in spec.parser) {
                    this.current.sequence.newBlock(labelForScope("blockTag", [lexedItem.fullTagName]));
                }
                if ("during" in spec.parser) {
                    spec.parser.during(this, lexedItem);
                }
                this.openNewScopes(spec.parser, lexedItem);
                if ("after" in spec.parser) {
                    spec.parser.after(this, lexedItem);
                }
            }
        }
    }

    tidy() {
        for (const seq of this.allSequences()) {
            seq.trim();
            seq.reorderSpanWithAtts();
            seq.makeNoteGrafts(this);
            seq.moveOrphanScopes();
            // seq.removeEmptyBlocks();
            seq.close(this);
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

    sequenceById() {
        const ret = {};
        this.allSequences().forEach(s => ret[s.id] = s);
        return ret;
    }

    filter(options) {
        const usedSequences = [];
        const sequenceById = this.sequenceById();
        this.filterGrafts(this.sequences.main.id, sequenceById, usedSequences, options)
        this.removeUnusedSequences(usedSequences)
        this.filterScopes(Object.values(sequenceById), options)
    }

    filterGrafts(seqId, seqById, used, options) {
        used.push(seqId);
        const childSequences = seqById[seqId].filterGrafts(options);
        for (const si of childSequences) {
            if (seqById[si].type === "main") {
                console.log("MAIN is child!");
                console.log(JSON.stringify(seqById[seqId], null, 2));
                process.exit(1);
            }
            this.filterGrafts(si, seqById, used, options);
        }
    }

    removeUnusedSequences(usedSequences) {
        for (const seq of this.allSequences()) {
            if (!usedSequences.includes(seq.id)) {
                switch ({...this.baseSequenceTypes, ...this.inlineSequenceTypes}[seq.type]) {
                    case "1":
                        throw new Error("Attempting to remove sequence with arity of 1");
                    case "?":
                        this.sequences[seq.type] = null;
                        break;
                    case "*":
                        this.sequences[seq.type] = this.sequences[seq.type].filter(s => s.id !== seq.id);
                        break;
                    default:
                        throw new Error(`Unexpected sequence arity '${seqArity}' for '${seqName}'`);
                }
            }
        }
    }

    filterScopes(sequences, options) {
        sequences.forEach(s => s.filterScopes(options));
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
        ).reverse();
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
        const previousSequence = this.current.sequence;
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
        if (!parserSpec.useTempSequence && this.current.sequence.type !== "main") {
            previousSequence.addItem(new Graft(this.current.baseSequenceType, this.current.sequence.id))
        }
    }

    returnToBaseSequence() {
        this.current.inlineSequenceType = null;
        this.current.sequence = this.current.parentSequence;
        this.current.parentSequence = null;
    }

    openNewScopes(parserSpec, pt) {
        if (parserSpec.newScopes) {
            let targetSequence = this.current.sequence;
            if ("mainSequence" in parserSpec && parserSpec.mainSequence) {
                targetSequence = this.sequences.main;
            }
            parserSpec.newScopes.forEach(sc => this.openNewScope(pt, sc, true, targetSequence));
        }
    }

    openNewScope(pt, sc, addItem, targetSequence) {
        if (addItem === undefined) {addItem = true};
        if (targetSequence === undefined) {targetSequence = this.current.sequence;};
        if (addItem) {
            targetSequence.addItem(new Scope("start", sc.label(pt)));
        }
        const newScope = {
            label: sc.label(pt),
            endedBy: this.substituteEndedBys(sc.endedBy, pt)
        };
        if ("onEnd" in sc) {
            newScope.onEnd = sc.onEnd;
        }
        targetSequence.activeScopes.push(newScope);
    }

    substituteEndedBys(endedBy, pt) {
        return endedBy.map(
            eb => {
                let ret = eb
                    .replace("$fullTagName$", pt.fullTagName)
                    .replace("$tagName$", pt.tagName);
                if (this.current.attributeContext) {
                    ret = ret.replace(
                        "$attributeContext$",
                        this.current.attributeContext
                            .replace("milestone", "endMilestone")
                            .replace("spanWithAtts", "endTag")
                    );
                }
                return ret;
            }
        );
    }

    addToken(pt) {
        this.current.sequence.addItem(new Token(pt));
    }

    addScope(sOrE, label) {
        this.current.sequence.addItem(new Scope(sOrE, label));
    }

    addEmptyMilestone(label) {
        this.current.sequence.addItem(new Scope("start", label));
        this.current.sequence.addItem(new Scope("end", label));
    }

    setAttributeContext(label) {
        this.current.attributeContext = label;
    }

    clearAttributeContext() {
        this.current.attributeContext = null;
    }

    describe() {
        const sequenceById = this.sequenceById();
        console.log(`${this.allSequences().length} Sequence(s)`)
        this.sequences.main.describe(sequenceById)
    }

}

module.exports = {Parser};
