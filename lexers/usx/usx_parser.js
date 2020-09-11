const sax = require("sax");
const xre = require('xregexp');

const ptClasses = require('../preTokenClasses');
const {lexingRegexes, mainRegex} = require('../lexingRegexes');
const {preTokenClassForFragment} = require("../class_for_fragment");

class UsxParser {

    constructor() {
        this.sax = sax.parser(true);
        this.sax.ontext = text => this.handleSaxText(text);
        this.sax.onopentag = ot => this.handleSaxOpenTag(ot);
        this.sax.onclosetag = ct => this.handleSaxCloseTag(ct);
        this.lexed = [];
        this.elementStack = [];
        this.openTagHandlers = {
            usx: this.ignoreHandler,
            book: this.notHandledHandler,
            chapter: this.notHandledHandler,
            verse: this.notHandledHandler,
            para: this.handleParaOpen,
            table: this.notHandledHandler,
            row: this.notHandledHandler,
            cell: this.notHandledHandler,
            char: this.notHandledHandler,
            ms: this.notHandledHandler,
            note: this.notHandledHandler,
            sidebar: this.notHandledHandler,
            periph: this.notHandledHandler,
            figure: this.notHandledHandler,
            optbreak: this.notHandledHandler,
            ref: this.notHandledHandler
        }
        this.closeTagHandlers = {
            usx: this.ignoreHandler,
            book: this.notHandledHandler,
            chapter: this.notHandledHandler,
            verse: this.notHandledHandler,
            para: this.handleParaClose,
            table: this.notHandledHandler,
            row: this.notHandledHandler,
            cell: this.notHandledHandler,
            char: this.notHandledHandler,
            ms: this.notHandledHandler,
            note: this.notHandledHandler,
            sidebar: this.notHandledHandler,
            periph: this.notHandledHandler,
            figure: this.notHandledHandler,
            optbreak: this.notHandledHandler,
            ref: this.notHandledHandler
        }
    }

    parse(str) {
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
            throw new Error(`Unexpected open element tag '${name}' in UsxParser`)
        }
    }

    handleSaxCloseTag(name) {
        if (name in this.closeTagHandlers) {
            this.closeTagHandlers[name](this, "close", name);
        } else {
            throw new Error(`Unexpected close element tag '${name}' in UsxParser`)
        }
    }

    notHandledHandler(lexer, oOrC, tag) {
        console.log(`WARNING: ${oOrC} element tag '${tag}' is not handled by UsxParser`)
    }

    stackPush(name, atts) {
        this.elementStack.push([name, atts]);
    }

    stackPop() {
        return this.elementStack.pop();
    }

    splitTagNumber(tagName) {
        let tagNo = 1;
        if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(tagName[tagName.length - 1])) {
            tagNo = tagName[tagName.length - 1];
            tagName = tagName.substring(0, tagName.length - 1);
        }
        return [tagName, tagNo];
    }

    ignoreHandler(lexer, oOrC, tag) {
    }

    handleParaOpen(lexer, oOrC, name, atts) {
        const [tagName, tagNo] = lexer.splitTagNumber(atts["style"]);
        lexer.lexed.push(new ptClasses.TagPT("startTag", [null, null, tagName, tagNo]));
        lexer.stackPush(name, atts);
    }

    handleParaClose(lexer, oOrC, name) {
        const [sName, sAtts] = lexer.stackPop();
        const [tagName, tagNo] = lexer.splitTagNumber(sAtts["style"]);
        lexer.lexed.push(new ptClasses.TagPT("endTag", [null, null, tagName, tagNo]))
    }

}

module.exports = {UsxParser}
