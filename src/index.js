import xre from 'xregexp';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { Mutex } from 'async-mutex';
import checksum from 'checksum';
import {
  graphql,
  graphqlSync,
} from 'graphql';
import BitSet from 'bitset';

import packageJson from '../package.json';
import utils from './util';
import { DocSet } from './model/doc_set';
import { Document } from './model/document';
import {
  typeDefs,
  resolvers,
} from './graph';

import { lexingRegexes } from './parser/lexers/lexingRegexes';
import * as blocksSpecUtils from './util/blocksSpec';
import {
  flattenNodes,
  numberNodes,
} from './parser/lexers/nodes';

/**
 * Transforms a syntax tree into a flat array of nodes with numbers.
 * @param {Object} tree - The syntax tree to flatten and number.
 * @returns {Array} The flattened and numbered nodes.
 */
const tree2nodes = tree => flattenNodes(numberNodes(tree));

/**
 * Creates an executable GraphQL schema using type definitions and resolvers.
 */
const executableSchema =
  makeExecutableSchema({
    typeDefs,
    resolvers,
  });

/**
 * The main class for the Proskomma library, handling the processing of scripture documents.
 */
class Proskomma {
  /**
   * Constructs a Proskomma instance with optional selectors for document filtering.
   * @param {Array<Object>} [selectors=[]] - Selectors for filtering documents.
   */
  constructor(selectors) {
    this.processorId = utils.generateId();
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
      introHeading: [],
    };
    this.emptyBlocks = [];
    this.selectors = selectors || [
      {
        name: 'lang',
        type: 'string',
        regex: '[a-z]{3}',
      },
      {
        name: 'abbr',
        type: 'string',
      },
    ];
    this.validateSelectorSpec(this.selectors);
    this.mutex = new Mutex();
    this.nextPeriph = 0;
    this.nextTable = 0;
    this.nextNodes = 0;
  }

  /**
   * Validates the selectors provided to the Proskomma instance.
   * Throws an error if any selector is invalid.
   */
  validateSelectors() {
    if (this.selectors.length === 0) {
      throw new Error('No selectors found');
    }

    for (const [n, selector] of this.selectors.entries()) {
      if (!('name' in selector)) {
        throw new Error(`Selector ${n} has no name`);
      }

      if (!('type' in selector)) {
        throw new Error(`Selector ${n} has no type`);
      }

      if (!['string', 'integer'].includes(selector.type)) {
        throw new Error(`Type for selector ${n} must be string or number, not ${selector.type}`);
      }

      if (selector.type === 'string') {
        if ('min' in selector) {
          throw new Error('String selector should not include \'min\'');
        }

        if ('max' in selector) {
          throw new Error('String selector should not include \'max\'');
        }

        if ('regex' in selector) {
          try {
            xre(selector.regex);
          } catch (err) {
            throw new Error(`Regex '${selector.regex}' is not valid: ${err}`);
          }
        }

        if ('enum' in selector) {
          for (const enumElement of selector.enum) {
            if (typeof enumElement !== 'string') {
              throw new Error(`Enum values for selector ${selector.name} should be strings, not '${enumElement}'`);
            }
          }
        }
      } else {
        if ('regex' in selector) {
          throw new Error('Integer selector should not include \'regex\'');
        }

        if ('min' in selector && typeof selector.min !== 'number') {
          throw new Error(`'min' must be a number, not '${selector.min}'`);
        }

        if ('max' in selector && typeof selector.max !== 'number') {
          throw new Error(`'max' must be a number, not '${selector.max}'`);
        }

        if ('min' in selector && 'max' in selector && selector.min > selector.max) {
          throw new Error(`'min' cannot be greater than 'max' (${selector.min} > ${selector.max})`);
        }

        if ('enum' in selector) {
          for (const enumElement of selector.enum) {
            if (typeof enumElement !== 'number') {
              throw new Error(`Enum values for selector ${selector.name} should be numbers, not '${enumElement}'`);
            }
          }
        }
      }

      for (const selectorKey of Object.keys(selector)) {
        if (!['name', 'type', 'regex', 'min', 'max', 'enum'].includes(selectorKey)) {
          throw new Error(`Unexpected key '${selectorKey}' in selector ${n}`);
        }
      }
    }
  }

  /**
   * Validates the selector specification.
   * @param {Array<Object>} spec - The selector specification to validate.
   */
  validateSelectorSpec(spec) {
    for (const specElement of spec) {
      if (!specElement['name']) {
        throw new Error(`name not found in selector spec element '${JSON.stringify(specElement)}'`);
      }

      if (!specElement['type']) {
        throw new Error(`type not found in selector spec element '${JSON.stringify(specElement)}'`);
      }

      if (!['string', 'integer'].includes(specElement.type)) {
        throw new Error(`Type for spec element must be string or number, not ${specElement.type}`);
      }

      for (const selectorKey of Object.keys(specElement)) {
        if (!['name', 'type', 'regex', 'min', 'max', 'enum'].includes(selectorKey)) {
          throw new Error(`Unexpected key '${selectorKey}' in selectorSpec`);
        }
      }
    }
  }

  /**
   * Generates a string representation of document set selectors.
   * @param {Object} docSetSelectors - The selectors for a document set.
   * @returns {string} A string representation of the selectors.
   */
  selectorString(docSetSelectors) {
    // In root so it can be easily subclassed
    return this.selectors.map(s => s.name).map(n => `${docSetSelectors[n]}`).join('_');
  }

  /**
   * Returns the version of the Proskomma processor.
   * @returns {string} The processor version.
   */
  processor() {
    return 'Proskomma JS';
  }

  /**
   * Returns the version of the package.
   * @returns {string} The package version.
   */
  packageVersion() {
    return packageJson.version;
  }

  /**
   * Returns a list of all document sets.
   * @returns {Array} An array of all document sets.
   */
  docSetList() {
    return Object.values(this.docSets);
  }

  /**
   * Retrieves document sets by their IDs.
   * @param {Array<string>} ids - The IDs of the document sets to retrieve.
   * @returns {Array} An array of document sets corresponding to the provided IDs.
   */
  docSetsById(ids) {
    return Object.values(this.docSets).filter(ds => ids.includes(ds.id));
  }

  /**
   * Retrieves a document set by its ID.
   * @param {string} id - The ID of the document set to retrieve.
   * @returns {Object} The document set corresponding to the provided ID.
   */
  docSetById(id) {
    return this.docSets[id];
  }

  /**
   * Retrieves document sets containing a specific book.
   * @param {string} bookCode - The book code to search for within document sets.
   * @returns {Array} An array of document sets containing the specified book.
   */
  docSetsWithBook(bookCode) {
    const docIdsWithBook = Object.values(this.documents)
      .filter(doc => 'bookCode' in doc.headers && doc.headers['bookCode'] === bookCode)
      .map(doc => doc.id);

    const docIdWithBookInDocSet = (ds) => {
      for (const docId of docIdsWithBook) {
        if (ds.docIds.includes(docId)) {
          return true;
        }
      }
      return false;
    };
    return Object.values(this.docSets).filter(ds => docIdWithBookInDocSet(ds));
  }

  /**
   * Returns the number of document sets.
   * @returns {number} The total number of document sets.
   */
  nDocSets() {
    return this.docSetList().length;
  }

  /**
   * Returns the number of documents.
   * @returns {number} The total number of documents.
   */
  nDocuments() {
    return this.documentList().length;
  }

  /**
   * Returns a list of all documents.
   * @returns {Array} An array of all documents.
   */
  documentList() {
    return Object.values(this.documents);
  }

  /**
   * Retrieves a document by its ID.
   * @param {string} id - The ID of the document to retrieve.
   * @returns {Object} The document corresponding to the provided ID.
   */
  documentById(id) {
    return this.documents[id];
  }

  /**
   * Retrieves documents by their IDs.
   * @param {Array<string>} ids - The IDs of the documents to retrieve.
   * @returns {Array} An array of documents corresponding to the provided IDs.
   */
  documentsById(ids) {
    return Object.values(this.documents).filter(doc => ids.includes(doc.id));
  }

  /**
   * Retrieves documents containing a specific book.
   * @param {string} bookCode - The book code to search for within documents.
   * @returns {Array} An array of documents containing the specified book.
   */
  documentsWithBook(bookCode) {
    return Object.values(this.documents).filter(doc => 'bookCode' in doc.headers && doc.headers['bookCode'] === bookCode);
  }

  /**
   * Imports a document into the system.
   * @param {Array<Object>} selectors - Selectors for filtering documents.
   * @param {string} contentType - The type of content being imported.
   * @param {string} contentString - The string content of the document.
   * @param {Object} filterOptions - Options for filtering the content.
   * @param {Object} customTags - Custom tags for the document.
   * @param {Array} emptyBlocks - Blocks considered to be empty.
   * @param {Array<string>} tags - Tags associated with the document.
   * @returns {Document} The imported document.
   */
  importDocument(selectors, contentType, contentString, filterOptions, customTags, emptyBlocks, tags) {
    return this.importDocuments(selectors, contentType, [contentString], filterOptions, customTags, emptyBlocks, tags)[0];
  }

  /**
   * Imports multiple documents into the system.
   * @param {Array<Object>} selectors - Selectors for filtering documents.
   * @param {string} contentType - The type of content being imported.
   * @param {Array<string>} contentStrings - The string contents of the documents.
   * @param {Object} filterOptions - Options for filtering the content.
   * @param {Object} customTags - Custom tags for the documents.
   * @param {Array} emptyBlocks - Blocks considered to be empty.
   * @param {Array<string>} tags - Tags associated with the documents.
   * @returns {Array<Document>} The imported documents.
   */
  importDocuments(selectors, contentType, contentStrings, filterOptions, customTags, emptyBlocks, tags) {
    if (!filterOptions) {
      filterOptions = this.filters;
    }

    if (!customTags) {
      customTags = this.customTags;
    }

    if (!emptyBlocks) {
      emptyBlocks = this.emptyBlocks;
    }

    if (!tags) {
      tags = [];
    }

    const docSetId = this.findOrMakeDocSet(selectors);
    const docSet = this.docSets[docSetId];
    docSet.buildPreEnums();
    const docs = [];

    for (const contentString of contentStrings) {
      let doc = new Document(this, docSetId, contentType, contentString, filterOptions, customTags, emptyBlocks, tags);
      const bookCode = doc.headers.bookCode;
      const existingBookCodes = Object.values(this.documents)
        .filter(d => docSet.docIds.includes(d.id))
        .map(d => d.headers.bookCode);

      if (existingBookCodes.includes(bookCode)) {
        throw new Error(`Attempt to import document with bookCode '${bookCode}' which already exists in docSet ${docSetId}`);
      }
      this.addDocument(doc, docSetId);
      docs.push(doc);
    }
    docSet.preEnums = {};
    return docs;
  }

  /**
   * Imports peripheral content from USFM format.
   * @param {Array<Object>} selectors - Selectors for filtering documents.
   * @param {string} contentString - The USFM content string.
   * @param {Object} filterOptions - Options for filtering the content.
   * @param {Object} customTags - Custom tags for the document.
   * @param {Array} emptyBlocks - Blocks considered to be empty.
   * @param {Array<string>} tags - Tags associated with the document.
   */
  importUsfmPeriph(selectors, contentString, filterOptions, customTags, emptyBlocks, tags) {
    const lines = contentString.toString().split(/[\n\r]+/);
    const bookCode = lines[0].substring(4, 7);

    if (!['FRT', 'BAK', 'INT'].includes(bookCode)) {
      throw new Error(`importUsfmInt() expected bookCode of FRT, BAK or INT, not '${bookCode}'`);
    }

    let periphs = [];

    for (const line of lines) {
      if (line.substring(0, 7) === '\\periph') {
        let matchedBits = xre.exec(line, xre('^\\\\periph (.*)\\|\\s*id\\s*=\\s*"([^"]+)"\\s*$'));

        if (!matchedBits) {
          throw new Error(`Unable to parse periph line '${line}'`);
        }

        const periphDesc = matchedBits[1];
        const periphId = matchedBits[2];
        const periphBookCode = `\\id P${this.nextPeriph > 9 ? this.nextPeriph : '0' + this.nextPeriph}`;
        periphs.push([`${periphBookCode} INT ${periphId} - ${periphDesc}`]);
        this.nextPeriph++;
      } else if (periphs.length > 0 && line.substring(0, 3) !== '\\id') {
        periphs[periphs.length - 1].push(line);
      }
    }
    this.importDocuments(
      selectors,
      'usfm',
      periphs.map(p => p.join('\n')),
      filterOptions,
      customTags,
      emptyBlocks,
      tags,
    );
  }

  /**
   * Cleans USFM content based on specified options.
   * @param {string} usfm - The USFM content to clean.
   * @param {Object} options - Options for cleaning the USFM content.
   * @returns {string} The cleaned USFM content.
   */
  cleanUsfm(usfm, options) {
    options = options || {};
    const lines = usfm.toString().split(/[\n\r]+/);
    const ret = [];
    let inHeaders = true;
    const headers = ['\\id', '\\ide', '\\usfm', '\\sts', '\\rem', '\\h', '\\toc'];

    for (const line of lines) {
      const firstWord = line.split(' ')[0]
        .replace(/[0-9]+/g, '');

      if ('remove' in options && options.remove.includes(firstWord)) {
        continue;
      }

      const isHeaderLine = headers.includes(firstWord);

      if (inHeaders && !isHeaderLine && firstWord !== '\\mt') {
        ret.push('\\mt1 USFM');
      }
      ret.push(line);

      if (!isHeaderLine) {
        inHeaders = false;
      }
    }
    return ret.join('\n');
  }

  /**
   * Deletes a document set by its ID.
   * @param {string} docSetId - The ID of the document set to delete.
   * @returns {boolean} True if the document set was successfully deleted, false otherwise.
   */
  deleteDocSet(docSetId) {
    if (!(docSetId in this.docSets)) {
      return false;
    }

    for (const docId of Object.entries(this.documents).filter(tup => tup[1].docSetId === docSetId).map(tup => tup[0])) {
      this.deleteDocument(docSetId, docId, false, false);
    }

    let selected = this.docSetsBySelector;
    const parentSelectors = this.selectors.slice(0, this.selectors.length - 1);

    for (const selector of parentSelectors) {
      selected = selected[this.docSets[docSetId].selectors[selector.name]];
    }

    const lastSelectorName = this.selectors[this.selectors.length - 1].name;
    const lastSelectorValue = this.docSets[docSetId].selectors[lastSelectorName];

    if (!selected[lastSelectorValue]) {
      throw new Error(`Could not find docSetId '${docSetId}' in docSetsBySelector in deleteDocSet`);
    }
    delete selected[lastSelectorValue];
    delete this.docSets[docSetId];
    return true;
  }

  /**
   * Deletes a document from a document set.
   * @param {string} docSetId - The ID of the document set.
   * @param {string} documentId - The ID of the document to delete.
   * @param {boolean} maybeDeleteDocSet - Whether to delete the document set if it becomes empty.
   * @param {boolean} maybeRehashDocSet - Whether to rehash the document set after deletion.
   * @returns {boolean} True if the document was successfully deleted, false otherwise.
   */
  deleteDocument(docSetId, documentId, maybeDeleteDocSet, maybeRehashDocSet) {
    maybeDeleteDocSet = maybeDeleteDocSet === undefined ? true : maybeDeleteDocSet;
    maybeRehashDocSet = maybeRehashDocSet === undefined ? true : maybeRehashDocSet;

    if (!(docSetId in this.docSets)) {
      return false;
    }

    if (!(documentId in this.documents)) {
      return false;
    }

    delete this.documents[documentId];

    if (this.docSets[docSetId].docIds.length > 1) {
      this.docSets[docSetId].docIds = this.docSets[docSetId].docIds.filter(i => i !== documentId);

      if (maybeRehashDocSet) {
        this.rehashDocSet(docSetId);
      }
    } else if (maybeDeleteDocSet) {
      this.deleteDocSet(docSetId);
    }
    return true;
  }

  /**
   * Rehashes the document set to update its state, typically after a modification.
   * @param {string} docSetId - The ID of the document set to rehash.
   * @returns {boolean} True if the document set was successfully rehashed, false otherwise.
   */
  rehashDocSet(docSetId) {
    if (!(docSetId in this.docSets)) {
      return false;
    }

    const docSet = this.docSets[docSetId];
    return docSet.rehash();
  }

  /**
   * Adds a document to a document set.
   * @param {Document} doc - The document to add.
   * @param {string} docSetId - The ID of the document set.
   */
  addDocument(doc, docSetId) {
    this.documents[doc.id] = doc;
    this.docSets[docSetId].docIds.push(doc.id);
    this.docSets[docSetId].buildEnumIndexes();
  }

  /**
   * Loads a document set from a succinct representation.
   * @param {Object} succinctOb - The succinct object representing a document set.
   * @returns {Array<Document>} The documents loaded from the succinct representation.
   */
  loadSuccinctDocSet(succinctOb) {
    const succinctId = succinctOb.id;

    if (succinctId in this.docSets) {
      throw new Error(`Attempting to succinct load docSet ${succinctId} which is already loaded`);
    }

    const docSet = new DocSet(this, null, null, succinctOb);
    const docSetId = docSet.id;
    this.docSets[docSetId] = docSet;
    let selectorTree = this.docSetsBySelector;
    const selectors = succinctOb.metadata.selectors;

    for (const selector of this.selectors) {
      if (selector.name === this.selectors[this.selectors.length - 1].name) {
        if (!(selectors[selector.name] in selectorTree)) {
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
    docSet.buildPreEnums();
    const docs = [];

    for (const docId of Object.keys(succinctOb.docs)) {
      let doc = this.newDocumentFromSuccinct(docId, succinctOb);
      docs.push(doc);
    }
    docSet.preEnums = {};
    return docs;
  }

  /**
   * Creates a new document from a succinct representation within a document set.
   * @param {string} docId - The ID of the document.
   * @param {Object} succinctOb - The succinct object containing the document's data.
   * @returns {Document} The newly created document from the succinct representation.
   */
  newDocumentFromSuccinct(docId, succinctOb) {
    const doc = new Document(this, succinctOb.id);
    doc.id = docId;
    const succinctDocOb = succinctOb.docs[docId];
    doc.filterOptions = {};
    doc.customTags = [];
    doc.emptyBlocks = [];
    doc.tags = new Set(succinctDocOb.tags);
    doc.headers = succinctDocOb.headers;
    doc.mainId = succinctDocOb.mainId;
    doc.sequences = {};

    for (const [seqId, seq] of Object.entries(succinctDocOb.sequences)) {
      doc.sequences[seqId] = {
        id: seqId,
        type: seq.type,
        tags: new Set(seq.tags),
        blocks: [],
      };

      if (seq.type === 'main') {
        doc.sequences[seqId].chapters = {};

        if (!('chapters' in seq)) {
          throw new Error('chapters not found in main sequence');
        }

        for (const [chK, chV] of Object.entries(seq.chapters)) {
          const bA = new utils.ByteArray();
          bA.fromBase64(chV);
          doc.sequences[seqId].chapters[chK] = bA;
        }
        doc.sequences[seqId].chapterVerses = {};

        if (!('chapterVerses' in seq)) {
          throw new Error('chapterVerses not found in main sequence');
        }

        for (const [chvK, chvV] of Object.entries(seq.chapterVerses)) {
          const bA = new utils.ByteArray();
          bA.fromBase64(chvV);
          doc.sequences[seqId].chapterVerses[chvK] = bA;
        }

        if (!('tokensPresent' in seq)) {
          throw new Error('tokensPresent not found in main sequence');
        }

        doc.sequences[seqId].tokensPresent = new BitSet(seq.tokensPresent);
      }

      for (const succinctBlock of seq.blocks) {
        const block = {};

        for (const [blockField, blockSuccinct] of Object.entries(succinctBlock)) {
          const ba = new utils.ByteArray(256);
          ba.fromBase64(blockSuccinct);
          block[blockField] = ba;
        }
        doc.sequences[seqId].blocks.push(block);
      }
    }
    this.addDocument(doc, succinctOb.id);
    return doc;
  }

  /**
   * Finds an existing document set based on selectors or creates a new one if it does not exist.
   * @param {Array<Object>} selectors - Selectors for filtering documents.
   * @returns {string} The ID of the found or newly created document set.
   */
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

  /**
   * Executes a GraphQL query asynchronously.
   * @param {string} query - The GraphQL query to execute.
   * @param {Function} [callback] - An optional callback to execute with the query result.
   * @returns {Promise<Object>} The result of the GraphQL query.
   */
  async gqlQuery(query, callback) {
    const release = await this.mutex.acquire();

    try {
      const result = await graphql({
        schema: executableSchema, source: query, rootValue:this, contextValue:{},
      });

      if (callback) {
        callback(result);
      }
      return result;
    } finally {
      release();
    }
  }

  /**
   * Executes a GraphQL query synchronously.
   * @param {string} query - The GraphQL query to execute.
   * @param {Function} [callback] - An optional callback to execute with the query result.
   * @returns {Object} The result of the GraphQL query.
   */
  gqlQuerySync(query, callback) {
    const result = graphqlSync({
      schema: executableSchema, source: query, rootValue:this, contextValue:{},
    });

    if (callback) {
      callback(result);
    }
    return result;
  }

  /**
   * Serializes a document set into a succinct format.
   * @param {string} docSetId - The ID of the document set to serialize.
   * @returns {Object} The serialized succinct representation of the document set.
   */
  serializeSuccinct(docSetId) {
    return this.docSets[docSetId].serializeSuccinct();
  }

  /**
   * Computes a checksum for all document sets.
   * @returns {string} The computed checksum.
   */
  checksum() {
    const dsChecksums = Object.values(this.docSets).map(ds => ds.checksum()).sort().join(' ');
    return checksum(dsChecksums);
  }
}

export {
  Proskomma,
  typeDefs,
  resolvers,
  lexingRegexes,
  blocksSpecUtils,
  tree2nodes,
  utils,
};
