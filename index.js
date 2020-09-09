const { DocSet, Document } = require('./processor');

class ProsKomma {

    constructor() {
        this.documents = {};
        this.docSetsByLang = {};
        this.docSets = {};
    }

    importDocument(lang, abbr, usfmString, filterOptions) {
        const docSetId = this.findOrMakeDocSet(lang, abbr);
        let doc;
        doc = new Document(this, lang, abbr, docSetId, usfmString, filterOptions);
        this.documents[doc.id] = doc;
        this.docSets[docSetId].docIds.push(doc.id);
        return doc;
    }

    findOrMakeDocSet(lang, abbr) {
        if (!(lang in this.docSetsByLang)) {
            this.docSetsByLang[lang] = {};
        }
        if (!(abbr in this.docSetsByLang[lang])) {
            this.docSetsByLang[lang][abbr] = new DocSet(this, lang, abbr);
        }
        const docSet = this.docSetsByLang[lang][abbr];
        if (!(docSet.id in this.docSets)) {
            this.docSets[docSet.id] = docSet;
        }
        return this.docSetsByLang[lang][abbr].id;
    }

}

module.exports = {ProsKomma}