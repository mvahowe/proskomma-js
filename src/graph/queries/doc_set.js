const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
} = require('graphql');
const documentType = require('./document');
const keyValueType = require('./key_value');

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
      resolve: (root, args, context) => {
        context.docSet = root;
        return root.documents();
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
  },
});

module.exports = docSetType;

