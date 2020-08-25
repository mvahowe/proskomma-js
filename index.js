const { DocSet, Document } = require('./processor');

class ProsKomma {

    constructor() {
        this.documents = {};
        this.docSetsByLang = {};
        this.docSets = {};
    }

    importDocument(lang, abbr, usfmString) {
        const docSetId = this.findOrMakeDocSet(lang, abbr);
        let doc;
        try {
            doc = new Document(this, lang, abbr, docSetId, usfmString);
            this.documents[doc.id] = doc;
            this.docSets[docSetId].docIds.push(doc.id);
        } catch (err) {
            throw new Error(`importDocument('${lang}', '${abbr}'): ${err}`);
        }
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