import { enumStringIndex, enumRegexIndexTuples } from 'proskomma-utils';

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} = require('graphql');

const {
  sequenceHasChars,
  sequenceHasMatchingChars,
} = require('../lib/sequence_chars');

const documentType = require('./document');
const keyValueType = require('./key_value');
const regexIndexType = require('./regex_index');

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
      args: { id: { type: GraphQLNonNull(GraphQLString) } },
      resolve: (root, args) => root.selectors[args.id],
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this docSet',
      resolve: root => Array.from(root.tags),
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
      },
      resolve: (root, args, context) => {
        if (args.withChars && args.withMatchingChars) {
          throw new Error('Cannot specify both withChars and withMatchingChars');
        }

        context.docSet = root;
        let ret = root.documents();

        if (args.withChars) {
          ret = ret.filter(d => sequenceHasChars(root, d.sequences[d.mainId], args.withChars, args.allChars));
        }

        if (args.withMatchingChars) {
          ret = ret.filter(d => sequenceHasMatchingChars(root, d.sequences[d.mainId], args.withMatchingChars, args.allChars));
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
  },

});

module.exports = docSetType;

