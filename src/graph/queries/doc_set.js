import {
  enumRegexIndexTuples,
  enumStringIndex,
  unpackEnum,
} from 'proskomma-utils';

const { bookCodeCompareFunctions } = require('../lib/sort');

const {
  sequenceHasChars,
  sequenceHasMatchingChars,
} = require('../lib/sequence_chars');

const docSetSchemaString = `
"""A collection of documents that share the same set of selector values"""
type DocSet {
  """The id of the docSet, which is formed by concatenating the docSet's selector values"""
  id: String!
  """The selectors of the docSet"""
  selectors: [KeyValue!]!
  """A selector for this docSet"""
  selector(
    """The id of the selector"""
    id: String!
  ): String!
  """A list of the tags of this docSet"""
  tags: [String!]!
  """A list of the tags of this docSet as key/value tuples"""
  tagsKv: [KeyValue!]!
  """Whether or not the docSet has the specified tag"""
  hasTag(
    """The tag"""
    tagName: String!
  ): Boolean!
  """The documents in the docSet"""
  documents(
    """A whitelist of ids of documents to include"""
    ids: [String!]
    """A whitelist of ids of documents to include"""
    withChars: [String!]
    """Return documents whose main sequence contains a token whose payload is an exact match to one of the specified strings"""
    withMatchingChars: [String!]
    """If true, documents where all search terms match will be included"""
    allChars: Boolean
    """Only return documents where the list of scopes is used"""
    withScopes: [String!]
    """If true, documents where all scopes are found will be included"""
    allScopes: Boolean
    """Only return documents with the specified header key/values"""
    withHeaderValues: [InputKeyValue!]
    """Only return documents with all the specified tags"""
    withTags: [String!]
    """Only return documents with none of the specified tags"""
    withoutTags: [String!]
    """Sort returned documents by the designated method (currently ${Object.keys(bookCodeCompareFunctions).join(', ')})\`"""
    sortedBy: String
  ): [Document!]!
  """The number of documents in the docSet"""
  nDocuments: Int!
  """The book code of the required document"""
  document(
    """The book code of the required document"""
    bookCode: String!
  ): Document
  """Whether the docSet has versification information loaded"""
  hasMapping: Boolean!
  """The internal index number corresponding to a string in a given docSet enum"""
  enumIndexForString(
    """The enum to be searched"""
    enumType: String!
    """The string to match"""
    searchString: String!
  ): Int!
  """Information about internal indexes matching the case-insensitive regex in a given docSet enum"""
  enumRegexIndexesForString(
    """The enum to be searched"""
    enumType: String!
    """The regex to match"""
    searchRegex: String!
  ): [regexIndex!]!
  """A list of wordLike token strings in the docSet"""
  wordLikes(
    """Whether to coerce the strings (toLower|toUpper|none)"""
    coerceCase: String
  ): [String!]!
  """A list of unique characters in the docSet"""
  uniqueChars: [String!]!
  """A string containing the unique characters in the docSet"""
  uniqueCharsString: String!
  }
`;

const docSetResolvers = {
  selectors: (root) => Object.entries(root.selectors),
  selector: (root, args) => root.selectors[args.id],
  tags: root => Array.from(root.tags),
  tagsKv: root => Array.from(root.tags).map(t => {
    if (t.includes(':')) {
      return [t.substring(0, t.indexOf(':')), t.substring(t.indexOf(':') + 1)];
    } else {
      return [t, ''];
    }
  }),
  hasTag: (root, args) => root.tags.has(args.tagName),
  documents: (root, args, context) => {
    const headerValuesMatch = (docHeaders, requiredHeaders) => {
      for (const requiredHeader of requiredHeaders || []) {
        if (!(requiredHeader.key in docHeaders) || docHeaders[requiredHeader.key] !== requiredHeader.value) {
          return false;
        }
      }
      return true;
    };

    if (args.withChars && args.withMatchingChars) {
      throw new Error('Cannot specify both withChars and withMatchingChars');
    }

    context.docSet = root;
    let ret = root.documents();

    if (args.ids) {
      ret = ret.filter(d => args.ids.includes(d.id));
    }

    if (args.withChars) {
      ret = ret.filter(d => sequenceHasChars(root, d.sequences[d.mainId], args.withChars, args.allChars));
    }

    if (args.withMatchingChars) {
      ret = ret.filter(d => sequenceHasMatchingChars(root, d.sequences[d.mainId], args.withMatchingChars, args.allChars));
    }

    if (args.withScopes) {
      const allSequenceScopes = doc => new Set(
        doc.sequences[doc.mainId].blocks
          .map(b => context.docSet.unsuccinctifyBlockScopeLabelsSet(b))
          .map(s => Array.from(s))
          .reduce((a, b) => a.concat(b)),
      );

      ret = ret.filter(
        d => {
          const docScopes = allSequenceScopes(d);
          const minHits = args.allScopes ? args.withScopes.length : 1;
          return args.withScopes.filter(s => docScopes.has(s)).length >= minHits;
        },
      );
    }

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
        throw new Error(`sortedBy value must be one of [${Object.keys(bookCodeCompareFunctions)}], not ${args.sortedBy}`);
      }
      ret.sort(bookCodeCompareFunctions[args.sortedBy]);
    }

    return ret;
  },
  nDocuments: (root, args, context) => {
    context.docSet = root;
    return root.documents().length;
  },
  document: (root, args) => root.documentWithBook(args.bookCode),
  hasMapping: root => root.tags.has('hasMapping'),
  enumIndexForString: (root, args) =>
    enumStringIndex(root.enums[args.enumType], args.searchString),
  enumRegexIndexesForString: (root, args) =>
    enumRegexIndexTuples(root.enums[args.enumType], args.searchRegex),
  wordLikes: (root, args) => {
    if (args.coerceCase && !['toLower', 'toUpper', 'none'].includes(args.coerceCase)) {
      throw new Error(`coerceCase, when present, must be 'toLower', 'toUpper' or 'none', not '${args.coerceCase}'`);
    }

    let tokens = unpackEnum(root.enums.wordLike);

    if (args.coerceCase === 'toLower') {
      tokens = tokens.map(t => t.toLowerCase());
    }

    if (args.coerceCase === 'toUpper') {
      tokens = tokens.map(t => t.toUpperCase());
    }
    return Array.from(new Set(tokens));
  },
  uniqueChars: root => {
    const retSet = new Set([]);

    for (const token of [...unpackEnum(root.enums.wordLike), ...unpackEnum(root.enums.notWordLike)]) {
      for (const char of token.split('')) {
        retSet.add(char);
      }
    }
    return Array.from(retSet).sort();
  },
  uniqueCharsString: root => {
    const retSet = new Set([]);

    for (const token of [...unpackEnum(root.enums.wordLike), ...unpackEnum(root.enums.notWordLike)]) {
      for (const char of token.split('')) {
        retSet.add(char);
      }
    }
    return Array.from(retSet).sort().join('');
  },
};

module.exports = {
  docSetSchemaString,
  docSetResolvers,
};

