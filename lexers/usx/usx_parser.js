const sax = require("sax");
const xre = require('xregexp');

const ptClasses = require('../preTokenClasses');
const { lexingRegexes, mainRegex } = require('../lexingRegexes');
const { preTokenClassForFragment } = require("../class_for_fragment");

class UsxParser {

    constructor() {
        this.sax = sax.parser(true);
        this.sax.ontext = text => this.handleText(text);
        this.sax.onopentag = ot => this.handleOpenTag(ot);
        this.sax.onclosetag = ct => this.handleCloseTag(ct);
        this.lexed = [];
        this.openTagHandlers = {
            usx: this.ignoreHandler,
            book: this.notHandledHandler,
            chapter: this.notHandledHandler,
            verse: this.notHandledHandler,
            para: this.notHandledHandler,
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
            para: this.notHandledHandler,
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
        this.sax.write(str).close();
        return this.lexed;
    }

    handleText(text) {
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

    handleOpenTag(tagOb) {
        const name = tagOb.name;
        const atts = tagOb.attributes
        if (name in this.openTagHandlers) {
            this.openTagHandlers[name]("open", name, atts);
        } else {
            throw new Error(`Unexpected open element tag '${name}' in UsxParser`)
        }
    }

    handleCloseTag(name) {
        if (name in this.closeTagHandlers) {
            this.closeTagHandlers[name]("close", name);
        } else {
            throw new Error(`Unexpected close element tag '${name}' in UsxParser`)
        }
    }

    notHandledHandler(oOrC, tag) {
        console.log(`WARNING: ${oOrC} element tag '${tag}' is not handled by UsxParser`)
    }

    ignoreHandler(oOrC, tag) {
    }

}

module.exports = {UsxParser}
