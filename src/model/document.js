const {
  addTag,
  generateId,
  parserConstants,
  removeTag,
  validateTags,
} = require('proskomma-utils');
const {
  parseUsfm,
  parseUsx,
  parseLexicon,
  parseTable,
} = require('../parser/lexers');
const { Parser } = require('../parser');
const {
  buildChapterVerseIndex,
  chapterVerseIndex,
  chapterIndex,
} = require('./document_helpers/chapter_verse');
const {
  modifySequence,
  deleteSequence,
  gcSequences,
  newSequence,
} = require('./document_helpers/sequences');
const {
  deleteBlock,
  newBlock,
  rewriteBlock,
} = require('./document_helpers/blocks');
const { succinctFilter } = require('./document_helpers/succinct_filter');
const { serializeSuccinct } = require('./document_helpers/serialize_succinct');
const { recordPreEnums, rerecordPreEnums } = require('./document_helpers/pre_enums');

// const maybePrint = str => console.log(str);
const maybePrint = str => str;

class Document {
  constructor(processor, docSetId, contentType, contentString, filterOptions, customTags, emptyBlocks, tags) {
    this.processor = processor;
    this.docSetId = docSetId;
    this.baseSequenceTypes = parserConstants.usfm.baseSequenceTypes;

    if (contentType) {
      this.id = generateId();
      this.filterOptions = filterOptions;
      this.customTags = customTags;
      this.emptyBlocks = emptyBlocks;
      this.tags = new Set(tags || []);
      validateTags(this.tags);
      this.headers = {};
      this.mainId = null;
      this.sequences = {};

      switch (contentType.toLowerCase()) {
      case 'usfm':
      case 'sfm':
        this.processUsfm(contentString);
        break;
      case 'usx':
        this.processUsx(contentString);
        break;
      case 'lexicon':
        this.processLexicon(contentString);
        break;
      case 'tsv':
        this.processTSV(contentString);
        break;
      default:
        throw new Error(`Unknown document contentType '${contentType}'`);
      }
    }
  }

  addTag(tag) {
    addTag(this.tags, tag);
  }

  removeTag(tag) {
    removeTag(this.tags, tag);
  }

  makeParser() {
    return new Parser(
      this.filterOptions,
      this.customTags,
      this.emptyBlocks,
    );
  }

  processUsfm(usfmString) {
    const parser = this.makeParser();
    const t = Date.now();
    parseUsfm(usfmString, parser);
    const t2 = Date.now();
    maybePrint(`\nParse USFM in ${t2 - t} msec`);
    this.postParseScripture(parser);
    maybePrint(`Total USFM import time = ${Date.now() - t} msec (parse = ${((t2 - t) * 100) / (Date.now() - t)}%)`);
  }

  processUsx(usxString) {
    const parser = this.makeParser();
    const t = Date.now();
    parseUsx(usxString, parser);
    const t2 = Date.now();
    maybePrint(`\nParse USX in ${t2 - t} msec`);
    this.postParseScripture(parser);
    maybePrint(`Total USX import time = ${Date.now() - t} msec (parse = ${((t2 - t) * 100) / (Date.now() - t)}%)`);
  }

  processTSV(tsvString) {
    const parser = this.makeParser();
    const bookCode = `T${this.processor.nextTable > 9 ? this.processor.nextTable : '0' + this.processor.nextTable}`;
    this.processor.nextTable++;
    parseTable(tsvString, parser, bookCode);
    this.headers = parser.headers;
    this.succinctPass1(parser);
    this.succinctPass2(parser);

    const tableSequence = Object.values(this.sequences).filter(s => s.type === 'table')[0];

    for (const [colN, colHead] of JSON.parse(tsvString).headings.entries()) {
      tableSequence.tags.add(`col${colN}:${colHead}`);
    }
  }

  postParseScripture(parser) {
    let t = Date.now();
    parser.tidy();
    maybePrint(`Tidy in ${Date.now() - t} msec`);
    t = Date.now();
    const fo = parser.filterOptions; // CHANGE THIS WHEN REFACTORING PARSER
    this.headers = parser.headers;
    this.succinctPass1(parser);
    maybePrint(`Succinct pass 1 in ${Date.now() - t} msec`);
    t = Date.now();
    this.succinctPass2(parser);
    maybePrint(`Succinct pass 2 in ${Date.now() - t} msec`);
    t = Date.now();
    this.succinctFilter(fo);
    maybePrint(`Filter in ${Date.now() - t} msec`);
    t = Date.now();
    buildChapterVerseIndex(this);
    maybePrint(`CV indexes in ${Date.now() - t} msec`);
  }

  processLexicon(lexiconString) {
    const parser = this.makeParser();
    parseLexicon(lexiconString, parser);
    this.headers = parser.headers;
    this.succinctPass1(parser);
    this.succinctPass2(parser);
  }

  succinctFilter(filterOptions) {
    succinctFilter(this, filterOptions);
  }

  succinctPass1(parser) {
    const docSet = this.processor.docSets[this.docSetId];

    let t = Date.now();

    for (const seq of parser.allSequences()) {
      docSet.recordPreEnum('ids', seq.id);
      this.recordPreEnums(docSet, seq);
    }
    maybePrint(`   recordPreEnums in ${Date.now() - t} msec`);
    t = Date.now();

    if (docSet.enums.wordLike.length === 0) {
      docSet.sortPreEnums();
      maybePrint(`   sortPreEnums in ${Date.now() - t} msec`);
      t = Date.now();
    }
    docSet.buildEnums();
    maybePrint(`   buildEnums in ${Date.now() - t} msec`);
  }

  recordPreEnums(docSet, seq) {
    recordPreEnums(docSet, seq);
  }

  rerecordPreEnums(docSet, seq) {
    rerecordPreEnums(docSet, seq);
  }

  succinctPass2(parser) {
    const docSet = this.processor.docSets[this.docSetId];
    this.mainId = parser.sequences.main.id;

    for (const seq of parser.allSequences()) {
      this.sequences[seq.id] = {
        id: seq.id,
        type: seq.type,
        tags: new Set(seq.tags),
        isBaseType: (seq.type in parser.baseSequenceTypes),
        blocks: seq.succinctifyBlocks(docSet),
      };
    }
    this.sequences[this.mainId].verseMapping = {};
  }

  modifySequence(
    seqId,
    sequenceRewriteFunc,
    blockFilterFunc,
    itemFilterFunc,
    blockRewriteFunc,
    itemRewriteFunc,
  ) {
    modifySequence(
      this,
      seqId,
      sequenceRewriteFunc,
      blockFilterFunc,
      itemFilterFunc,
      blockRewriteFunc,
      itemRewriteFunc,
    );
  }

  buildChapterVerseIndex() {
    buildChapterVerseIndex(this);
  }

  chapterVerseIndexes() {
    const ret = {};

    for (const chapN of Object.keys(this.sequences[this.mainId].chapterVerses)) {
      ret[chapN] = chapterVerseIndex(this, chapN);
    }
    return ret;
  }

  chapterVerseIndex(chapN) {
    return chapterVerseIndex(this, chapN);
  }

  chapterIndexes() {
    const ret = {};

    for (const chapN of Object.keys(this.sequences[this.mainId].chapters)) {
      ret[chapN] = chapterIndex(this, chapN);
    }
    return ret;
  }

  chapterIndex(chapN) {
    return chapterIndex(this, chapN);
  }

  rewriteSequenceBlocks(sequenceId, oldToNew) {
    const sequence = this.sequences[sequenceId];

    for (const block of sequence.blocks) {
      this.rewriteSequenceBlock(block, oldToNew);
    }
  }

  rewriteSequenceBlock(block, oldToNew) {
    rewriteBlock(block, oldToNew);
  }

  serializeSuccinct() {
    return serializeSuccinct(this);
  }

  gcSequences() {
    return gcSequences(this);
  }

  newSequence(seqType) {
    return newSequence(this, seqType);
  }

  deleteSequence(seqId) {
    return deleteSequence(this, seqId);
  }

  deleteBlock(seqId, blockN, buildCV) {
    return deleteBlock(this, seqId, blockN, buildCV);
  }

  newBlock(seqId, blockN, blockScope, blockGrafts, buildCV) {
    return newBlock(this, seqId, blockN, blockScope, blockGrafts, buildCV);
  }
}

module.exports = { Document };
