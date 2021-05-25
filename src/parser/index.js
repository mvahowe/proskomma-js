const { labelForScope } = require('proskomma-utils');
const { Sequence } = require('./model/sequence');
const {
  specs,
  buildSpecLookup,
} = require('./parser_specs');

const Parser = class {
  constructor(filterOptions, customTags, emptyBlocks) {
    this.filterOptions = filterOptions;
    this.customTags = customTags;
    this.emptyBlocks = emptyBlocks;
    this.specs = specs(this);
    this.specLookup = buildSpecLookup(this.specs);
    this.headers = {};
    this.setSequenceTypes();
    this.setSequences();
    this.setCurrent();
  }

  setSequenceTypes() {
    this.baseSequenceTypes = {
      main: '1',
      introduction: '*',
      introTitle: '?',
      introEndTitle: '?',
      title: '?',
      endTitle: '?',
      heading: '*',
      header: '*',
      remark: '*',
      sidebar: '*',
    };
    this.inlineSequenceTypes = {
      footnote: '*',
      noteCaller: '*',
      xref: '*',
      pubNumber: '*',
      altNumber: '*',
      esbCat: '*',
      fig: '*',
      temp: '?',
    };
  }

  setSequences() {
    this.sequences = {};

    for (const [sType, sArity] of Object.entries({ ...this.baseSequenceTypes, ...this.inlineSequenceTypes })) {
      switch (sArity) {
      case '1':
        this.sequences[sType] = new Sequence(sType);
        break;
      case '?':
        this.sequences[sType] = null;
        break;
      case '*':
        this.sequences[sType] = [];
        break;
      default:
        throw new Error(`Unexpected sequence arity '${sArity}' for '${sType}'`);
      }
    }
    this.mainLike = this.sequences.main;
  }

  setCurrent() {
    this.current = {
      sequence: this.sequences.main,
      parentSequence: null,
      baseSequenceType: 'main',
      inlineSequenceType: null,
      attributeContext: null,
    };
  }

  parseItem(lexedItem) {
    let changeBaseSequence = false;

    if (['startTag'].includes(lexedItem.subclass)) {
      this.closeActiveScopes(`startTag/${lexedItem.fullTagName}`);

      if (!lexedItem.isNested) {
        this.closeActiveScopes(`implicitEnd`);
      }
    }

    if (['endTag'].includes(lexedItem.subclass)) {
      this.closeActiveScopes(`endTag/${lexedItem.fullTagName}`);
    }

    if (['startMilestoneTag'].includes(lexedItem.subclass) && lexedItem.sOrE === 'e') {
      this.closeActiveScopes(`endMilestone/${lexedItem.tagName}`);
    }

    if (['chapter', 'pubchapter', 'verses'].includes(lexedItem.subclass)) {
      this.closeActiveScopes(lexedItem.subclass, this.sequences.main);
    }

    const spec = this.specForItem(lexedItem);

    if (spec) {
      if ('before' in spec.parser) {
        spec.parser.before(this, lexedItem);
      }
      changeBaseSequence = false;

      if (spec.parser.baseSequenceType) {
        const returnSequenceType = spec.parser.baseSequenceType === 'mainLike' ? this.mainLike.type : spec.parser.baseSequenceType;

        changeBaseSequence = (returnSequenceType !== this.current.baseSequenceType) ||
          spec.parser.forceNewSequence;
      }

      if (changeBaseSequence) {
        this.closeActiveScopes('baseSequenceChange');
        this.changeBaseSequence(spec.parser);

        if ('newBlock' in spec.parser && spec.parser.newBlock) {
          this.closeActiveScopes('endBlock');
          this.current.sequence.newBlock(labelForScope('blockTag', [lexedItem.fullTagName]));
        }
      } else if (spec.parser.inlineSequenceType) {
        this.current.inlineSequenceType = spec.parser.inlineSequenceType;
        this.current.parentSequence = this.current.sequence;

        if (this.current.parentSequence.type === 'header') { // Not lovely, needed for \cp before first content
          this.current.parentSequence = this.sequences.main;
        }
        this.current.sequence = new Sequence(this.current.inlineSequenceType);
        this.current.sequence.newBlock(labelForScope('inline', spec.parser.inlineSequenceType));
        this.sequences[this.current.inlineSequenceType].push(this.current.sequence);
        this.current.parentSequence.addItem({
          type: 'graft',
          subType: this.current.inlineSequenceType,
          payload: this.current.sequence.id,
        });
      } else if ('newBlock' in spec.parser && spec.parser.newBlock) {
        this.current.sequence.newBlock(labelForScope('blockTag', [lexedItem.fullTagName]));
      }

      if ('during' in spec.parser) {
        spec.parser.during(this, lexedItem);
      }
      this.openNewScopes(spec.parser, lexedItem);

      if ('after' in spec.parser) {
        spec.parser.after(this, lexedItem);
      }
    }
  }

  tidy() {
    for (const introduction of this.sequences.introduction) {
      introduction.graftifyIntroductionHeadings(this);
    }

    const allSequences = this.allSequences();

    for (const seq of allSequences) {
      seq.trim();
      seq.reorderSpanWithAtts();
      seq.makeNoteGrafts(this);
      seq.moveOrphanScopes();
      seq.removeEmptyBlocks(this.emptyBlocks);
    }

    const emptySequences = this.emptySequences(allSequences);

    for (const seq of allSequences) {
      if (emptySequences) {
        seq.removeGraftsToEmptySequences(emptySequences);
      }
      seq.addTableScopes();
      seq.close(this);
      this.substitutePubNumberScopes(seq);

      if (seq.type === 'sidebar') {
        this.substituteEsbCatScopes(seq);
      }

      if (['footnote', 'xref'].includes(seq.type)) {
        seq.lastBlock().inlineToEnd();
      }
    }
  }

  emptySequences(sequences) {
    return sequences.filter(s => s.blocks.length === 0).map(s => s.id);
  }

  substitutePubNumberScopes(seq) {
    const scopeToGraftContent = {};
    const sequenceById = this.sequenceById();

    for (const block of seq.blocks) {
      let spliceCount = 0;
      const itItems = [...block.items];

      for (const [n, item] of itItems.entries()) {
        if (item.type === 'graft' && ['pubNumber', 'altNumber'].includes(item.subType)) {
          const graftContent = sequenceById[item.payload].text().trim();
          const scopeId = itItems[n + 1].payload.split('/')[1];
          scopeToGraftContent[scopeId] = graftContent;
          block.items.splice(n - spliceCount, 1);
          spliceCount++;
        }
      }
    }

    // Substitute scopeIds for graft content
    if (Object.keys(scopeToGraftContent).length > 0) {
      for (const block of seq.blocks) {
        for (const scope of block.items.filter(i => i.type === 'scope')) {
          const scopeParts = scope.payload.split('/');

          if (['altChapter', 'pubVerse', 'altVerse'].includes(scopeParts[0])) {
            scope.payload = `${scopeParts[0]}/${scopeToGraftContent[scopeParts[1]]}`;
          }
        }
      }
    }
  }

  substituteEsbCatScopes(seq) {
    const scopeToGraftContent = {};
    const sequenceById = this.sequenceById();

    for (const block of seq.blocks) {
      let spliceCount = 0;
      const itItems = [...block.items];

      for (const [n, item] of itItems.entries()) {
        if (item.type === 'graft' && item.subType === 'esbCat') {
          const catContent = sequenceById[item.payload].text().trim();
          const scopeId = itItems[1].payload.split('/')[1];
          scopeToGraftContent[scopeId] = catContent;
          block.items.splice(n - spliceCount, 1);
          spliceCount++;
        }
      }
    }

    // Substitute scopeIds for graft content
    if (Object.keys(scopeToGraftContent).length > 0) {
      for (const block of seq.blocks) {
        for (const scope of block.items.filter(i => i.type === 'scope')) {
          const scopeParts = scope.payload.split('/');

          if (scopeParts[0] === 'esbCat') {
            scope.payload = `${scopeParts[0]}/${scopeToGraftContent[scopeParts[1]]}`;
          }
        }
      }
    }
  }

  allSequences() {
    const ret = [];

    for (const [seqName, seqArity] of Object.entries({ ...this.baseSequenceTypes, ...this.inlineSequenceTypes })) {
      switch (seqArity) {
      case '1':
      case '?':
        if (this.sequences[seqName]) {
          ret.push(this.sequences[seqName]);
        }
        break;
      case '*':
        this.sequences[seqName].forEach(s => {
          ret.push(s);
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

    this.allSequences().forEach(s => {
      ret[s.id] = s;
    });
    return ret;
  }

  filter() {
    const usedSequences = [];
    const sequenceById = this.sequenceById();
    this.filterGrafts(this.sequences.main.id, sequenceById, usedSequences, this.filterOptions);
    this.removeUnusedSequences(usedSequences);
    this.filterScopes(Object.values(sequenceById), this.filterOptions);
  }

  filterGrafts(seqId, seqById, used, options) {
    used.push(seqId);
    const childSequences = seqById[seqId].filterGrafts(options);

    for (const si of childSequences) {
      if (seqById[si].type === 'main') {
        console.log('MAIN is child!');
        console.log(JSON.stringify(seqById[seqId], null, 2));
        process.exit(1);
      }
      this.filterGrafts(si, seqById, used, options);
    }
  }

  removeUnusedSequences(usedSequences) {
    for (const seq of this.allSequences()) {
      if (!usedSequences.includes(seq.id)) {
        const seqArity = { ...this.baseSequenceTypes, ...this.inlineSequenceTypes }[seq.type];

        switch (seqArity) {
        case '1':
          throw new Error('Attempting to remove sequence with arity of 1');
        case '?':
          this.sequences[seq.type] = null;
          break;
        case '*':
          this.sequences[seq.type] = this.sequences[seq.type].filter(s => s.id !== seq.id);
          break;
        default:
          throw new Error(`Unexpected sequence arity '${seqArity}' for '${seq.type}'`);
        }
      }
    }
  }

  filterScopes(sequences, options) {
    sequences.forEach(s => s.filterScopes(options));
  }

  specForItem(item) {
    const context = item.subclass;

    if (!(context in this.specLookup)) {
      return null;
    }

    for (const accessor of ['tagName', 'sOrE']) {
      if (accessor in item && accessor in this.specLookup[context] && item[accessor] in this.specLookup[context][accessor]) {
        return { parser: this.specLookup[context][accessor][item[accessor]] };
      }
    }

    if ('_noAccessor' in this.specLookup[context]) {
      return { parser: this.specLookup[context]['_noAccessor'] };
    }

    return null;
  }

  closeActiveScopes(closeLabel, targetSequence) {
    if (targetSequence === undefined) {
      targetSequence = this.current.sequence;
    }

    const matchedScopes = targetSequence.activeScopes.filter(
      sc => sc.endedBy.includes(closeLabel),
    ).reverse();

    targetSequence.activeScopes = targetSequence.activeScopes.filter(
      sc => !sc.endedBy.includes(closeLabel),
    );
    matchedScopes.forEach(ms => this.closeActiveScope(ms, targetSequence));
  }

  closeActiveScope(sc, targetSequence) {
    this.addScope('end', sc.label, targetSequence);

    if (sc.onEnd) {
      sc.onEnd(this, sc.label);
    }
  }

  changeBaseSequence(parserSpec) {
    const newType = parserSpec.baseSequenceType;

    if (newType === 'mainLike') {
      this.current.sequence = this.mainLike;
      return;
    }
    this.current.baseSequenceType = newType;
    const arity = this.baseSequenceTypes[newType];

    switch (arity) {
    case '1':
      this.current.sequence = this.sequences[newType];
      break;
    case '?':
      if (!this.sequences[newType]) {
        this.sequences[newType] = new Sequence(newType);
      }
      this.current.sequence = this.sequences[newType];
      break;
    case '*':
      this.current.sequence = new Sequence(newType);

      if (!parserSpec.useTempSequence) {
        this.sequences[newType].push(this.current.sequence);
      }
      break;
    default:
      throw new Error(`Unexpected base sequence arity '${arity}' for '${newType}'`);
    }

    if (!parserSpec.useTempSequence && this.current.sequence.type !== 'main') {
      this.mainLike.addBlockGraft({
        type: 'graft',
        subType: this.current.baseSequenceType,
        payload: this.current.sequence.id,
      });
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

      if ('mainSequence' in parserSpec && parserSpec.mainSequence) {
        targetSequence = this.sequences.main;
      }
      parserSpec.newScopes.forEach(sc => this.openNewScope(pt, sc, true, targetSequence));
    }
  }

  openNewScope(pt, sc, addItem, targetSequence) {
    if (addItem === undefined) {
      addItem = true;
    }

    if (targetSequence === undefined) {
      targetSequence = this.current.sequence;
    }

    if (addItem) {
      targetSequence.addItem({
        type: 'scope',
        subType: 'start',
        payload: sc.label(pt),
      });
    }

    const newScope = {
      label: sc.label(pt),
      endedBy: this.substituteEndedBys(sc.endedBy, pt),
    };

    if ('onEnd' in sc) {
      newScope.onEnd = sc.onEnd;
    }
    targetSequence.activeScopes.push(newScope);
  }

  substituteEndedBys(endedBy, pt) {
    return endedBy.map(
      eb => {
        let ret = eb
          .replace('$fullTagName$', pt.fullTagName)
          .replace('$tagName$', pt.tagName);

        if (this.current.attributeContext) {
          ret = ret.replace(
            '$attributeContext$',
            this.current.attributeContext
              .replace('milestone', 'endMilestone')
              .replace('spanWithAtts', 'endTag'),
          );
        }
        return ret;
      },
    );
  }

  addToken(pt) {
    this.current.sequence.addItem({
      type: 'token',
      subType: pt.subclass,
      payload: pt.printValue,
    });
  }

  addScope(sOrE, label, targetSequence) {
    if (targetSequence === undefined) {
      targetSequence = this.current.sequence;
    }
    targetSequence.addItem({
      type: 'scope',
      subType: sOrE,
      payload: label,
    });
  }

  addEmptyMilestone(label) {
    this.mainLike.addItem({
      type: 'scope',
      subType: 'start',
      payload: label,
    });
    this.mainLike.addItem({
      type: 'scope',
      subType: 'end',
      payload: label,
    });
  }

  setAttributeContext(label) {
    this.current.attributeContext = label;
  }

  clearAttributeContext() {
    this.current.attributeContext = null;
  }
};

module.exports = { Parser };
