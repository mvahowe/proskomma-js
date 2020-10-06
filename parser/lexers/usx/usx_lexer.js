const sax = require("sax");
const xre = require('xregexp');

const ptClasses = require('../preTokenClasses');
const {lexingRegexes, mainRegex} = require('../lexingRegexes');
const {preTokenClassForFragment} = require("../class_for_fragment");

class UsxLexer {

    constructor() {
        this.sax = sax.parser(true);
        this.sax.ontext = text => this.handleSaxText(text);
        this.sax.onopentag = ot => this.handleSaxOpenTag(ot);
        this.sax.onclosetag = ct => this.handleSaxCloseTag(ct);
        this.lexed = [];
        this.elementStack = [];
        this.openTagHandlers = {
            usx: this.ignoreHandler,
            book: this.handleBookOpen,
            chapter: this.handleChapter,
            verse: this.handleVerses,
            para: this.handleParaOrCharOpen,
            table: this.ignoreHandler,
            row: this.handleRowOpen,
            cell: this.handleCellOpen,
            char: this.handleParaOrCharOpen,
            ms: this.notHandledHandler,
            note: this.handleNoteOpen,
            sidebar: this.notHandledHandler,
            periph: this.notHandledHandler,
            figure: this.notHandledHandler,
            optbreak: this.notHandledHandler,
            ref: this.notHandledHandler
        }
        this.closeTagHandlers = {
            usx: this.ignoreHandler,
            book: this.handleBookClose,
            chapter: this.ignoreHandler,
            verse: this.ignoreHandler,
            para: this.handleParaOrCharClose,
            table: this.ignoreHandler,
            row: this.handleRowClose,
            cell: this.handleCellClose,
            char: this.handleParaOrCharClose,
            ms: this.notHandledHandler,
            note: this.handleNoteClose,
            sidebar: this.notHandledHandler,
            periph: this.notHandledHandler,
            figure: this.notHandledHandler,
            optbreak: this.notHandledHandler,
            ref: this.notHandledHandler
        }
    }

    lex(str) {
        this.lexed = [];
        this.elementStack = [];
        this.sax.write(str).close();
        return this.lexed;
    }

    handleSaxText(text) {
        xre.match(this.replaceEntities(text), mainRegex, "all")
            .map(f => preTokenClassForFragment(f, lexingRegexes))
            .forEach(t => this.lexed.push(t));
    }

    replaceEntities(text) {
        return text.replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&apos;", "'")
            .replace("&quot;", "\"")
            .replace("&amp;", "&");
    }

    handleSaxOpenTag(tagOb) {
        const name = tagOb.name;
        const atts = tagOb.attributes
        if (name in this.openTagHandlers) {
            this.openTagHandlers[name](this, "open", name, atts);
        } else {
            throw new Error(`Unexpected open element tag '${name}' in UsxParser`);
        }
    }

    handleSaxCloseTag(name) {
        if (name in this.closeTagHandlers) {
            this.closeTagHandlers[name](this, "close", name);
        } else {
            throw new Error(`Unexpected close element tag '${name}' in UsxParser`);
        }
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
        const tagBits = xre.exec(fullTagName, xre("([^1-9]+)(.*)"));
        const tagName = tagBits[1];
        const tagNo = tagBits[2].length > 0 ? tagBits[2] : "1";
        return [tagName, tagNo];
    }

    ignoreHandler(lexer, oOrC, tag) {
    }

    handleParaOrCharOpen(lexer, oOrC, name, atts) {
        const [tagName, tagNo] = lexer.splitTagNumber(atts.style);
        lexer.lexed.push(new ptClasses.TagPT("startTag", [null, null, tagName, tagNo]));
        lexer.stackPush(name, atts);
    }

    handleParaOrCharClose(lexer) {
        const sAtts = lexer.stackPop()[1];
        const [tagName, tagNo] = lexer.splitTagNumber(sAtts.style);
        lexer.lexed.push(new ptClasses.TagPT("endTag", [null, null, tagName, tagNo]));
    }

    handleRowOpen(lexer, oOrC, name, atts) {
        const [tagName, tagNo] = lexer.splitTagNumber(atts.style);
        lexer.lexed.push(new ptClasses.TagPT("startTag", [null, null, tagName, tagNo]));
        lexer.stackPush(name, atts);
    }

    handleRowClose(lexer) {
        const sAtts = lexer.stackPop()[1];
        const [tagName, tagNo] = lexer.splitTagNumber(sAtts.style);
        lexer.lexed.push(new ptClasses.TagPT("endTag", [null, null, tagName, tagNo]));
    }

    handleCellOpen(lexer, oOrC, name, atts) {
        const [tagName, tagNo] = lexer.splitTagNumber(atts.style);
        lexer.lexed.push(new ptClasses.TagPT("startTag", [null, null, tagName, tagNo]));
        lexer.stackPush(name, atts);
    }

    handleCellClose(lexer) {
        const sAtts = lexer.stackPop()[1];
        const [tagName, tagNo] = lexer.splitTagNumber(sAtts.style);
        lexer.lexed.push(new ptClasses.TagPT("endTag", [null, null, tagName, tagNo]));
    }

    handleBookOpen(lexer, oOrC, name, atts) {
        lexer.lexed.push(new ptClasses.TagPT("startTag", [null, null, "id", ""]));
        lexer.lexed.push(new ptClasses.PrintablePT("wordLike", [atts.code]));
        lexer.lexed.push(new ptClasses.PrintablePT("lineSpace", [" "]));
        lexer.stackPush(name, atts);
    }

    handleBookClose(lexer) {
        lexer.stackPop();
        lexer.lexed.push(new ptClasses.TagPT("endTag", [null, null, "id", ""]));
    }

    handleChapter(lexer, oOrC, name, atts) {
        if (atts.number) {
            lexer.lexed.push(new ptClasses.ChapterPT("chapter", [null, null, atts.number]));
            if (atts.pubnumber) {
                console.log("PUBNUMBER");
                lexer.lexed.push(new ptClasses.PrintChapterPT("printchapter", [null, null, atts.pubnumber]));
            }
        }
    }

    handleVerses(lexer, oOrC, name, atts) {
        if (atts.number) {
            lexer.lexed.push(new ptClasses.VersesPT("verses", [null, null, atts.number]));
        }
    }

    handleNoteOpen(lexer, oOrC, name, atts) {
        lexer.lexed.push(new ptClasses.TagPT("startTag", [null, null, atts.style, ""]));
        lexer.lexed.push(new ptClasses.PrintablePT("punctuation", [atts.caller]));
        lexer.stackPush(name, atts);
    }

    handleNoteClose(lexer) {
        const sAtts = lexer.stackPop()[1];
        lexer.lexed.push(new ptClasses.TagPT("endTag", [null, null, sAtts.style, ""]));
    }

}

module.exports = { UsxLexer }
