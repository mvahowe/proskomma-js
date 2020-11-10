const sax = require("sax");
const xre = require('xregexp');

const ptClasses = require('../preTokenClasses');

class LexiconLexer {

    constructor() {
        this.sax = sax.parser(true);
        this.sax.ontext = text => this.handleSaxText(text);
        this.sax.onopentag = ot => this.handleSaxOpenTag(ot);
        this.sax.onclosetag = ct => this.handleSaxCloseTag(ct);
        this.lexed = [];
        this.elementStack = [];
        this.openTagHandlers = {
        }
        this.closeTagHandlers = {
        }
    }

    lexAndParse(str, parser) {
        this.parser = parser;
        this.lexed = [];
        this.elementStack = [];
        this.sax.write(str).close();
    }

    handleSaxText(text) {
        /*
        xre.match(this.replaceEntities(text), mainRegex, "all")
            .map(f => preTokenClassForFragment(f, lexingRegexes))
            .forEach(t => this.parser.parseItem(t));
         */
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
            throw new Error(`Unexpected open element tag '${name}' in LexiconParser`);
        }
    }

    handleSaxCloseTag(name) {
        this.closeTagHandlers[name](this, "close", name);
    }

    notHandledHandler(lexer, oOrC, tag) {
        console.error(`WARNING: ${oOrC} element tag '${tag}' is not handled by LexiconParser`);
    }

    stackPush(name, atts) {
        this.elementStack.push([name, atts]);
    }

    stackPop() {
        return this.elementStack.pop();
    }

    ignoreHandler(lexer, oOrC, tag) {
    }

}

module.exports = {LexiconLexer}
