import {
  enumRegexIndexTuples,
  enumStringIndex,
  unpackEnum,
} from 'proskomma-utils';

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} = require('graphql');
const { bookCodeCompareFunctions } = require('../lib/sort');


const {
  sequenceHasChars,
  sequenceHasMatchingChars,
} = require('../lib/sequence_chars');

const { documentType } = require('./document');
const { keyValueType } = require('./key_value');
const regexIndexType = require('./regex_index');
const { inputKeyValueType } = require('./input_key_value');

const docSetType = new GraphQLObjectType({
  name: 'DocSet',
  description: 'A collection of documents that share the same set of selector values',
  fields: {
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the docSet, which is formed by concatenating the docSet\'s selector values',
    },
    selectors: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      description: 'The selectors of the docSet',
      resolve: (root) => Object.entries(root.selectors),
    },
    selector: {
      type: GraphQLNonNull(GraphQLString),
      description: 'A selector for this docSet',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The id of the selector',
        },
      },
      resolve: (root, args) => root.selectors[args.id],
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this docSet',
      resolve: root => Array.from(root.tags),
    },
    tagsKv: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      description: 'A list of the tags of this docSet as key/value tuples',
      resolve: root => Array.from(root.tags).map(t => {
        if (t.includes(':')) {
          return [t.substring(0, t.indexOf(':')), t.substring(t.indexOf(':') + 1)];
        } else {
          return [t, ''];
        }
      }),
    },
    hasTag: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether or not the docSet has the specified tag',
      args: {
        tagName: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The tag',
        },
      },
      resolve: (root, args) => root.tags.has(args.tagName),
    },
    documents: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
      description: 'The documents in the docSet',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'A whitelist of ids of documents to include',
        },
        withChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return documents whose main sequence contains a token whose payload is an exact match to one of the specified strings',
        },
        withMatchingChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return documents whose main sequence contains a token whose payload matches the specified regexes',
        },
        allChars: {
          type: GraphQLBoolean,
          description: 'If true, documents where all search terms match will be included',
        },
        withScopes: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return documents where the list of scopes is used',
        },
        allScopes: {
          type: GraphQLBoolean,
          description: 'If true, documents where all scopes are found will be included',
        },
        withHeaderValues: {
          type: GraphQLList(GraphQLNonNull(inputKeyValueType)),
          description: 'Only return documents with the specified header key/values',
        },
        withTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return documents with all the specified tags',
        },
        withoutTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return documents with none of the specified tags',
        },
        sortedBy: {
          type: GraphQLString,
          description: `Sort returned documents by the designated method (currently ${Object.keys(bookCodeCompareFunctions).join(', ')})`,
        },
      },
      resolve: (root, args, context) => {
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
    },
    nDocuments: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number documents in the docSet',
      resolve: (root, args, context) => {
        context.docSet = root;
        return root.documents().length;
      },
    },
    document: {
      type: documentType,
      description: 'The document with the specified book code',
      args: {
        bookCode: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The book code of the required document',
        },
      },
      resolve: (root, args) => root.documentWithBook(args.bookCode),
    },
    hasMapping: {
      type: GraphQLBoolean,
      resolve: root => root.tags.has('hasMapping'),
    },
    enumIndexForString: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The internal index number corresponding to a string in a given docset enum',
      args: {
        enumType: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The enum to be searched',
        },
        searchString: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The string to match',
        },
      },
      resolve: (root, args) =>
        enumStringIndex(root.enums[args.enumType], args.searchString),
    },
    enumRegexIndexesForString: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(regexIndexType))),
      description: 'Information about internal indexes matching the case-insensitive regex in a given docset enum',
      args: {
        enumType: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The enum to be searched',
        },
        searchRegex: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The regex to match',
        },
      },
      resolve: (root, args) =>
        enumRegexIndexTuples(root.enums[args.enumType], args.searchRegex),
    },
    wordLikes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of wordLike token strings in the docSet',
      args: {
        coerceCase: {
          type: GraphQLString,
          description: 'Whether to coerce the strings (toLower|toUpper|none)',
        },
      },
      resolve: (root, args) => {
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
    },
    uniqueChars: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of unique characters in the docSet',
      resolve: root => {
        const retSet = new Set([]);

        for (const token of [...unpackEnum(root.enums.wordLike), ...unpackEnum(root.enums.notWordLike)]) {
          for (const char of token.split('')) {
            retSet.add(char);
          }
        }
        return Array.from(retSet).sort();
      },
    },
    uniqueCharsString: {
      type: GraphQLNonNull(GraphQLString),
      description: 'A string containing the unique characters in the docSet',
      resolve: root => {
        const retSet = new Set([]);

        for (const token of [...unpackEnum(root.enums.wordLike), ...unpackEnum(root.enums.notWordLike)]) {
          for (const char of token.split('')) {
            retSet.add(char);
          }
        }
        return Array.from(retSet).sort().join('');
      },
    },
  },
},
);

module.exports = { docSetType };

