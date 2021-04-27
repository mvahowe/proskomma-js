const sax = require('sax');
import xre from 'xregexp';

const ptClasses = require('../preTokenClasses');
const {
  lexingRegexes,
  mainRegex,
} = require('../lexingRegexes');
const { preTokenObjectForFragment } = require('../object_for_fragment');

class LexiconLexer {

  constructor() {
    this.sax = sax.parser(true);
    this.sax.ontext = text => this.handleSaxText(text);
    this.sax.onopentag = ot => this.handleSaxOpenTag(ot);
    this.sax.onclosetag = ct => this.handleSaxCloseTag(ct);
    this.lexed = [];
    this.elementStack = [];
    this.openTagHandlers = {
      TEI: this.ignoreHandler,
      entry: this.handleEntryOpen,
      orth: this.handleOrthOpen,
      def: this.handleDefOpen,
    };
    this.closeTagHandlers = {
      TEI: this.ignoreHandler,
      entry: this.handleEntryClose,
      orth: this.handleOrthClose,
      def: this.handleDefClose,
    };
    this.resetState();
  }

  resetState() {
    this.state = {
      strongs: '',
      lemma: '',
      orth: '',
      brief: '',
      full: '',
    };
  }

  lexAndParse(str, parser) {
    this.parser = parser;
    this.lexed = [];
    this.elementStack = [];
    this.sax.write(str).close();
  }

  topElement() {
    return this.elementStack[this.elementStack.length - 1];
  }

  handleSaxText(text) {
    const tE = this.topElement();
    if (tE) {
      switch (tE[0]) {
      case 'orth':
        this.state.orth += this.replaceEntities(text);
        break;
      case 'def':
        this.topElement()[1].role === 'brief' ?
          this.state.brief += this.replaceEntities(text) :
          this.state.full += this.replaceEntities(text);
      }
    }
  }

  replaceEntities(text) {
    return text.replace('&lt;', '<')
      .replace('&gt;', '>')
      .replace('&apos;', '\'')
      .replace('&quot;', '"')
      .replace('&amp;', '&');
  }

  handleSaxOpenTag(tagOb) {
    const name = tagOb.name;
    const atts = tagOb.attributes;
    if (name in this.openTagHandlers) {
      this.openTagHandlers[name](this, 'open', name, atts);
    } else {
      throw new Error(`Unexpected open element tag '${name}' in LexiconParser`);
    }
  }

  handleSaxCloseTag(name) {
    this.closeTagHandlers[name](this, 'close', name);
  }

  stackPush(name, atts) {
    this.elementStack.push([name, atts]);
  }

  stackPop() {
    return this.elementStack.pop();
  }

  ignoreHandler(lexer, oOrC, tag) {
  }

  handleEntryOpen(lexer, oOrC, name, atts) {
    const [lemma, strongs] = atts.n.split('|').map(s => s.trim());
    lexer.state.strongs = `G${strongs}`;
    lexer.state.lemma = lemma;
    lexer.stackPush(name, atts);
  }

  handleOrthOpen(lexer, oOrC, name, atts) {
    lexer.stackPush(name, atts);
  }

  handleDefOpen(lexer, oOrC, name, atts) {
    lexer.stackPush(name, atts);
  }

  handleEntryClose(lexer) {

    const parseText = text => xre.match(lexer.replaceEntities(text), mainRegex, 'all')
      .map(f => preTokenObjectForFragment(f, lexingRegexes))
      .forEach(t => lexer.parser.parseItem(t));

    const startMilestone = () => {
      lexer.parser.parseItem(new ptClasses.MilestonePT('startMilestoneTag', [null, null, 'zlexentry', 's']));
      lexer.parser.parseItem(new ptClasses.AttributePT('attribute', [null, null, 'x-strongs', lexer.state.strongs]));
      lexer.parser.parseItem(new ptClasses.AttributePT('attribute', [null, null, 'x-lemma', lexer.state.lemma]));
      lexer.parser.parseItem(new ptClasses.MilestonePT('endMilestoneMarker'));
    };

    ['brief', 'full'].map(k => lexer.state[k] = lexer.state[k].replace(/[ \t\r\n]+/g, ' ').trim());
    for (const field of ['orth', 'brief', 'full']) {
      lexer.parser.parseItem(new ptClasses.TagPT('startTag', [null, null, `zlex${field}`, '']));
      if (field === 'orth') {
        startMilestone();
      }
      parseText(lexer.state[field]);
      lexer.parser.parseItem(new ptClasses.TagPT('endTag', [null, null, `zlex${field}`, '']));
    }
    lexer.parser.parseItem(new ptClasses.MilestonePT('startMilestoneTag', [null, null, 'zlexentry', 'e']));
    lexer.parser.parseItem(new ptClasses.MilestonePT('endMilestoneMarker'));
    lexer.resetState();
    lexer.stackPop();
  }

  handleOrthClose(lexer) {
    lexer.stackPop();
  }

  handleDefClose(lexer) {
    lexer.stackPop();
  }


}

module.exports = { LexiconLexer };
