const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInt,
} = require('graphql');
const inputKeyValue = require('../queries/input_key_value');

const addMutations = {
  addDocument: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Adds a document which will be assigned to an existing or new docSet on the basis of the specified selectors',
    args: {
      selectors: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputKeyValue))),
        description: 'The selectors for this document, the keys of which must match those of the Proskomma instance',
      },
      contentType: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The format of the content (probably usfm or usx)',
      },
      content: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The document content as a string',
      },
    },
    resolve: (root, args) => {
      const selectorsObject = {};

      args.selectors.forEach(
        s => {
          selectorsObject[s.key] = s.value;
        },
      );
      return !!root.importDocument(selectorsObject, args.contentType, args.content);
    },
  },
  newSequence: {
    type: GraphQLNonNull(GraphQLString),
    description: 'Creates a new, empty sequence',
    args: {
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document to which the sequence will be added',
      },
      type: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The type of the new sequence (main, heading...)',
      },
    },
    resolve: (root, args) => {
      const document = root.documents[args.documentId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      return document.newSequence(args.type);
    },
  },
  newBlock: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Adds a new block to a sequence',
    args: {
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence to which the block will be added',
      },
      sequenceId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the sequence to which the block will be added',
      },
      blockN: {
        type: GraphQLNonNull(GraphQLInt),
        description: 'The zero-indexed position at which to add the block',
      },
      blockScope: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The scope to be applied to the block, eg blockScope/p'
      },
    },
    resolve: (root, args) => {
      const document = root.documents[args.documentId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      return document.newBlock(args.sequenceId, args.blockN, args.blockScope);
    },
  },
};

module.exports = addMutations;
