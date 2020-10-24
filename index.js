const { graphql } = require('graphql');
const packageJson = require('./package.json');
const { DocSet } = require('./model/doc_set');
const { Document } = require('./model/document');
const { gqlSchema } = require('./graph');

class ProsKomma {

    constructor() {
        this.documents = {};
        this.docSetsBySelector = {};
        this.docSets = {};
        this.filters = {};
        this.customTags = {
            heading: [],
            paragraph: [],
            char: [],
            word: [],
            intro: [],
            introHeading: []
        }
        this.emptyBlocks = [];
        this.selectors = [
            {
                name: "lang",
                type: "string",
                regex: "[a-z]{3}"
            },
            {
                name: "abbr",
                type: "string"
            }
        ];
    }

    validateSelectors() {
        if (this.selectors.length === 0) {
            throw new Error("No selectors found");
        }
        for (const [n, selector] of this.selectors.entries()) {
            if (!("name" in selector)) {
                throw new Error(`Selector ${n} has no name`);
            }
            if (!("type" in selector)) {
                throw new Error(`Selector ${n} has no type`);
            }
            if (!["string", "integer"].includes(selector.type)) {
                throw new Error(`Type for selector ${n} must be string or number, not ${selector.type}`)
            }
            for (const selectorKey of Object.keys(selector)) {
                if (!["name", "type", "regex", "min", "max", "enum"].includes(selectorKey)) {
                    throw new Error(`Unexpected key '${selectorKey}' in selector ${n}`);
                }
            }
        }
    }

    packageVersion() {
        return packageJson.version;
    };

    docSetList() {
        return Object.values(this.docSets);
    }

    docSetsById(ids) {
        return Object.values(this.docSets).filter(ds => ids.includes(ds.id));
    }

    docSetById(id) {
        return this.docSets[id];
    }

    docSetsWithBook(bookCode) {
        const docIdsWithBook = Object.values(this.documents)
            .filter(doc => "bookCode" in doc.headers && doc.headers["bookCode"] === bookCode)
            .map(doc => doc.id);
        const docIdWithBookInDocSet = (ds) => {
            for (const docId of docIdsWithBook) {
                if (ds.docIds.includes(docId)) {
                    return true;
                }
            }
            return false;
        }
        return Object.values(this.docSets).filter(ds => docIdWithBookInDocSet(ds));
    }

    nDocSets() {
        return this.docSetList().length;
    }

    nDocuments() {
        return this.documentList.length;
    }

    documentList() {
        return Object.values(this.documents);
    }

    documentById(id) {
        return this.documents[id];
    }

    documentsById(ids) {
        return Object.values(this.documents).filter(doc => ids.includes(doc.id));
    }

    documentsWithBook(bookCode) {
        return Object.values(this.documents).filter(doc => "bookCode" in doc.headers && doc.headers["bookCode"] === bookCode);
    }

    importDocument(selectors, contentType, contentString, filterOptions, customTags, emptyBlocks) {
        return this.importDocuments(selectors, contentType, [contentString], filterOptions, customTags, emptyBlocks)[0];
    }

    importDocuments(selectors, contentType, contentStrings, filterOptions, customTags, emptyBlocks) {
        if (!filterOptions) {
            filterOptions = this.filters;
        }
        if (!customTags) {
            customTags = this.customTags;
        }
        if (!emptyBlocks) {
            emptyBlocks = this.emptyBlocks;
        }
        const docSetId = this.findOrMakeDocSet(selectors);
        const docSet = this.docSets[docSetId];
        docSet.buildPreEnums();
        const docs = [];
        for (const contentString of contentStrings) {
            let doc = new Document(this, docSetId, contentType, contentString, filterOptions, customTags, emptyBlocks);
            this.addDocument(doc, docSetId);
            docs.push(doc);
        }
        docSet.preEnums = {};
        return docs;
    }

    addDocument(doc, docSetId) {
        this.documents[doc.id] = doc;
        this.docSets[docSetId].docIds.push(doc.id);
    }

    findOrMakeDocSet(selectors) {
        let selectorTree = this.docSetsBySelector;
        let docSet;
        for (const selector of this.selectors) {
            if (selector.name === this.selectors[this.selectors.length - 1].name) {
                if (selectors[selector.name] in selectorTree) {
                    docSet = selectorTree[selectors[selector.name]];
                } else {
                    docSet = new DocSet(this, selectors);
                    selectorTree[selectors[selector.name]] = docSet;
                    this.docSets[docSet.id] = docSet;
                }
            } else {
                if (!(selectors[selector.name] in selectorTree)) {
                    selectorTree[selectors[selector.name]] = {};
                }
                selectorTree = selectorTree[selectors[selector.name]];
            }
        }
        return docSet.id;
    }

    async gqlQuery(query) {
        return await graphql(gqlSchema, query, this, {});
    }

    serializeSuccinct(docSetId) {
        return this.docSets[docSetId].serializeSuccinct();
    }

}

module.exports = {ProsKomma}