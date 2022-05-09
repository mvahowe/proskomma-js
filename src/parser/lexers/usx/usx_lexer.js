import xre from 'xregexp';

import sax from 'sax';

import {
  lexingRegexes,
  mainRegex,
} from '../lexingRegexes';
import {
  preTokenObjectForFragment,
  constructorForFragment,
} from '../object_for_fragment';

class UsxLexer {
  constructor() {
    this.sax = sax.parser(true);
    this.sax.ontext = text => this.handleSaxText(text);
    this.sax.onopentag = ot => this.handleSaxOpenTag(ot);
    this.sax.onclosetag = ct => this.handleSaxCloseTag(ct);
    this.lexed = [];
    this.elementStack = [];
    this.currentText = '';
    this.openTagHandlers = {
      usx: this.ignoreHandler,
      book: this.handleBookOpen,
      chapter: this.handleChapter,
      verse: this.handleVerses,
      para: this.handleParaOpen,
      table: this.ignoreHandler,
      row: this.handleRowOpen,
      cell: this.handleCellOpen,
      char: this.handleCharOpen,
      ms: this.handleMSOpen,
      note: this.handleNoteOpen,
      sidebar: this.handleSidebarOpen,
      periph: this.notHandledHandler,
      figure: this.handleFigureOpen,
      optbreak: this.handleOptBreakOpen,
      ref: this.handleRefOpen,
    };
    this.closeTagHandlers = {
      usx: this.ignoreHandler,
      book: this.handleBookClose,
      chapter: this.ignoreHandler,
      verse: this.ignoreHandler,
      para: this.handleParaClose,
      table: this.ignoreHandler,
      row: this.handleRowClose,
      cell: this.handleCellClose,
      char: this.handleCharClose,
      ms: this.handleMSClose,
      note: this.handleNoteClose,
      sidebar: this.handleSidebarClose,
      periph: this.notHandledHandler,
      figure: this.handleFigureClose,
      optbreak: this.handleOptBreakClose,
      ref: this.handleRefClose,
    };
  }

  lexAndParse(str, parser) {
    this.parser = parser;
    this.lexed = [];
    this.elementStack = [];
    this.sax.write(str).close();
  }

  handleSaxText(text) {
    this.currentText = this.replaceEntities(text);
    xre.match(this.currentText, mainRegex, 'all')
      .map(f => preTokenObjectForFragment(f, lexingRegexes))
      .forEach(t => this.parser.parseItem(t));
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
      throw new Error(`Unexpected open element tag '${name}' in UsxParser`);
    }
  }

  handleSaxCloseTag(name) {
    this.closeTagHandlers[name](this, 'close', name);
  }

  notHandledHandler(lexer, oOrC, tag) {
    console.error(`WARNING: ${oOrC} element tag '${tag}' is not handled by UsxParser`);
  }

  stackPush(name, atts) {
    this.elementStack.push([name, atts]);
  }

  stackPop() {
    return this.elementStack.pop();
  }

  splitTagNumber(fullTagName) {
    const tagBits = xre.exec(fullTagName, xre('([^1-9]+)(.*)'));
    const tagName = tagBits[1];
    const tagNo = tagBits[2].length > 0 ? tagBits[2] : '1';
    return [tagName, tagNo];
  }

  ignoreHandler(lexer, oOrC, tag) {
  }

  handleParaOpen(lexer, oOrC, name, atts) {
    lexer.currentText = '';
    const [tagName, tagNo] = lexer.splitTagNumber(atts.style);

    if (!['cp'].includes(tagName)) {
      lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, tagName, tagNo]));
    }
    lexer.stackPush(name, atts);
  }

  handleParaClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.style);

    if (['cp'].includes(tagName)) {
      lexer.parser.parseItem(constructorForFragment.pubchapter('pubchapter', [null, null, lexer.currentText]));
    } else {
      lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, tagName, tagNo]));
    }
    lexer.currentText = '';
  }

  handleCharOpen(lexer, oOrC, name, atts) {
    const [tagName, tagNo] = lexer.splitTagNumber(atts.style);
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, `+${tagName}`, tagNo]));
    const ignoredAtts = ['sid', 'eid', 'style', 'srcloc', 'link-href', 'link-title', 'link-id', 'closed'];

    for (const [attName, attValue] of Object.entries(atts)) {
      if (!ignoredAtts.includes(attName)) {
        lexer.parser.parseItem(constructorForFragment.attribute('attribute', [null, null, attName, attValue]));
      }
    }
    lexer.stackPush(name, atts);
  }

  handleCharClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.style);
    lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, `+${tagName}`, tagNo]));
  }

  handleRefOpen(lexer) {
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, 'xt', '']));
  }

  handleRefClose(lexer) {
    lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, 'xt', '']));
  }

  handleRowOpen(lexer, oOrC, name, atts) {
    const [tagName, tagNo] = lexer.splitTagNumber(atts.style);
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, tagName, tagNo]));
    lexer.stackPush(name, atts);
  }

  handleRowClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.style);
    lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, tagName, tagNo]));
  }

  handleCellOpen(lexer, oOrC, name, atts) {
    const [tagName, tagNo] = lexer.splitTagNumber(atts.style);
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, tagName, tagNo]));
    lexer.stackPush(name, atts);
  }

  handleCellClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.style);
    lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, tagName, tagNo]));
  }

  handleBookOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, 'id', '']));
    lexer.parser.parseItem(constructorForFragment.printable('wordLike', [atts.code]));
    lexer.parser.parseItem(constructorForFragment.printable('lineSpace', [' ']));
    lexer.stackPush(name, atts);
  }

  handleBookClose(lexer) {
    lexer.stackPop();
    lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, 'id', '']));
  }

  handleChapter(lexer, oOrC, name, atts) {
    if (atts.number) {
      lexer.parser.parseItem(constructorForFragment.chapter('chapter', [null, null, atts.number]));

      if (atts.pubnumber) {
        lexer.parser.parseItem(constructorForFragment.pubchapter('pubchapter', [null, null, atts.pubnumber]));
      }

      if (atts.altnumber) {
        lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, '+ca', '']));
        lexer.parser.parseItem(constructorForFragment.printable('wordLike', [atts.altnumber]));
        lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, '+ca', '']));
      }
    }
  }

  handleVerses(lexer, oOrC, name, atts) {
    if (atts.number) {
      lexer.parser.parseItem(constructorForFragment.verses('verses', [null, null, atts.number]));

      if (atts.pubnumber) {
        lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, '+vp', '']));
        lexer.parser.parseItem(constructorForFragment.printable('wordLike', [atts.pubnumber]));
        lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, '+vp', '']));
      }

      if (atts.altnumber) {
        lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, '+va', '']));
        lexer.parser.parseItem(constructorForFragment.printable('wordLike', [atts.altnumber]));
        lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, '+va', '']));
      }
    }
  }

  handleNoteOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, atts.style, '']));
    lexer.parser.parseItem(constructorForFragment.printable('punctuation', [atts.caller]));
    lexer.stackPush(name, atts);
  }

  handleNoteClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, sAtts.style, '']));
  }

  handleSidebarOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, 'esb', '']));

    if ('category' in atts) {
      lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, 'cat', '']));
      lexer.parser.parseItem(constructorForFragment.printable('wordLike', [atts.category]));
      lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, 'cat', '']));
    }
    lexer.stackPush(name, atts);
  }

  handleSidebarClose(lexer) {
    lexer.stackPop();
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, 'esbe', '']));
  }

  handleMSOpen(lexer, oOrC, name, atts) {
    let matchBits = xre.exec(atts.style, xre('(([a-z1-9]+)-([se]))'));

    if (matchBits) {
      const startMS = constructorForFragment.milestone('startMilestoneTag', [null, null, matchBits[2], matchBits[3]]);
      lexer.parser.parseItem(startMS);
      const ignoredAtts = ['sid', 'eid', 'style', 'srcloc', 'link-href', 'link-title', 'link-id'];

      for (const [attName, attValue] of Object.entries(atts)) {
        if (!ignoredAtts.includes(attName)) {
          lexer.parser.parseItem(constructorForFragment.attribute('attribute', [null, null, attName, attValue]));
        }
      }
      lexer.parser.parseItem(constructorForFragment.milestone('endMilestoneMarker'));
    } else {
      const emptyMS = constructorForFragment.milestone('emptyMilestone', [null, null, atts.style, '']);
      lexer.parser.parseItem(emptyMS);
    }
    lexer.stackPush(name, atts);
  }

  handleMSClose(lexer) {
    lexer.stackPop();
  }

  handleFigureOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(constructorForFragment.tag('startTag', [null, null, '+fig', '']));

    for (const [attName, attValue] of Object.entries(atts)) {
      if (attName === 'style') {
        continue;
      }

      const scopeAttName = (attName === 'file') ? 'src' : attName;
      lexer.parser.parseItem(constructorForFragment.attribute('attribute', [null, null, scopeAttName, attValue]));
    }
    lexer.stackPush(name, atts);
  }

  handleFigureClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    lexer.parser.parseItem(constructorForFragment.tag('endTag', [null, null, `+fig`, '']));
  }


  handleOptBreakOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(constructorForFragment.printable('softLineBreak', ['//']));
    lexer.stackPush(name, atts);
  }

  handleOptBreakClose(lexer) {
    lexer.stackPop();
  }
}

export { UsxLexer };
