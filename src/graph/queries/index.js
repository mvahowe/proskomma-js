import { bookCodeCompareFunctions } from '../lib/sort';
import versifications from '../../model/versifications';

const querySchemaString = `
"""The top level of Proskomma queries"""
type Query {
  """The id of the processor, which is different for each Proskomma instance"""
  id: String!
  """A string describing the processor class"""
  processor: String!
  """The NPM package version"""
  packageVersion: String!
  """The selectors used to define docSets"""
  selectors: [selectorSpec!]!
  """The number of docSets"""
  nDocSets: Int!
  """The docSets in the processor"""
  docSets(
    """A whitelist of ids of docSets to include"""
    ids: [String!]
    """Only return docSets that match the list of selector values"""
    withSelectors: [InputKeyValue!]
    """Only return docSets containing a document with the specified bookCode"""
    withBook: String
    """Only return docSets with all the specified tags"""
    withTags: [String!]
    """Only return docSets with none of the specified tags"""
    withoutTags: [String!]
  ): [DocSet!]!
  """The docSet with the specified id"""
  docSet(
    """The id of the docSet"""
    id: String!
  ): DocSet
  """The number of documents in the processor"""
  nDocuments: Int!
  """The documents in the processor"""
  documents(
    """A whitelist of ids of documents to include"""
    ids: [String!]
    """Only return documents with the specified bookCode"""
    withBook: String
    """Only return documents with the specified header key/values"""
    withHeaderValues: [InputKeyValue!]
    """Only return documents with all the specified tags"""
    withTags: [String!]
    """Only return documents with none of the specified tags"""
    withoutTags: [String!]
    """Sort returned documents by the designated method (currently ${Object.keys(bookCodeCompareFunctions).join(', ')})"""
    sortedBy: String
  ): [Document!]!
  """The document with the specified id, or the specified docSet and withBook"""
  document(
    """The id of the document"""
    id: String
    """The docSet of the document (use with withBook)"""
    docSetId: String
    """The book of the document (use with docSetId)"""
    withBook: String
  ) : Document
  """Reference information about standard versifications"""
  versifications: [versification!]!
  """Reference information about a named, standard versification"""
  versification(
    """The id of the versification"""
    id: String!
  ) : versification!
}
`;
const queryResolvers = {
  id: root => root.processorId,
  selectors: root => root.selectors,
  docSets: (root, args) => {
    const docSetMatchesSelectors = (ds, selectors) => {
      for (const selector of selectors) {
        if (ds.selectors[selector.key].toString() !== selector.value) {
          return false;
        }
      }
      return true;
    };

    let ret = ('withBook' in args ? root.docSetsWithBook(args.withBook) : Object.values(root.docSets))
      .filter(ds => !args.ids || args.ids.includes(ds.id));

    if (args.withSelectors) {
      ret = ret.filter(ds => docSetMatchesSelectors(ds, args.withSelectors));
    }

    if (args.withTags) {
      ret = ret.filter(ds => args.withTags.filter(t => ds.tags.has(t)).length === args.withTags.length);
    }

    if (args.withoutTags) {
      ret = ret.filter(ds => args.withoutTags.filter(t => ds.tags.has(t)).length === 0);
    }

    return ret;
  },
  docSet: (root, args) => root.docSetById(args.id),
  documents: (root, args) => {
    const headerValuesMatch = (docHeaders, requiredHeaders) => {
      for (const requiredHeader of requiredHeaders || []) {
        if (!(requiredHeader.key in docHeaders) || docHeaders[requiredHeader.key] !== requiredHeader.value) {
          return false;
        }
      }
      return true;
    };

    let ret = args.withBook ? root.documentsWithBook(args.withBook) : root.documentList();
    ret = ret.filter(d => !args.ids || args.ids.includes(d.id));

    if (args.withHeaderValues) {
      ret = ret.filter(d => headerValuesMatch(d.headers, args.withHeaderValues));
    }

    if (args.withTags) {
      ret = ret.filter(d => args.withTags.filter(t => d.tags.has(t)).length === args.withTags.length);
    }

    if (args.withoutTags) {
      ret = ret.filter(d => args.withoutTags.filter(t => d.tags.has(t)).length === 0);
    }

    if (args.sortedBy) {
      if (!(args.sortedBy in bookCodeCompareFunctions)) {
        throw new Error(`sortedBy value must be one of [${Object.keys(bookCodeCompareFunctions).join(', ')}], not ${args.sortedBy}`);
      }
      ret.sort(bookCodeCompareFunctions[args.sortedBy]);
    }

    return ret;
  },
  document: (root, args) => {
    if (args.id && !args.docSetId && !args.withBook) {
      return root.documentById(args.id);
    } else if (!args.id && args.docSetId && args.withBook) {
      return root.documentsWithBook(args.withBook).filter(d => d.docSetId === args.docSetId)[0];
    } else {
      throw new Error('document requires either id or both docSetId and withBook (but not all three)');
    }
  },
  versifications: root => {
    return Object.entries(versifications);
  },
  versification: (root, args) => {
    return Object.entries(versifications).filter(v => v[0] === args.id)[0];
  }
};

export {
  querySchemaString,
  queryResolvers,
};
