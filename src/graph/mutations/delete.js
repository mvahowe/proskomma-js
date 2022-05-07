const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} = require('graphql');

const deleteMutationsSchemaString = `
  """Deletes a docSet"""
  deleteDocSet(
    """The id of the docSet containing the document to be deleted"""
    docSetId: String!
  ): Boolean
  """Deletes a document"""
  deleteDocument(
    """The id of the docSet containing the document to be deleted"""
    docSetId: String!
    """The id of the document to be deleted"""
    documentId: String!
  ): Boolean
  """Deletes a sequence from a document"""
  deleteSequence(
    """The id of the document containing the sequence to be deleted"""
    documentId: String!
    """The id of the sequence to be deleted"""
    sequenceId: String!
  ): Boolean
  """Deletes a block from a sequence"""
  deleteBlock(
    """The id of the document containing the sequence from which the block will be deleted"""
    documentId: String!
    """The id of the sequence from which the block will be deleted"""
    sequenceId: String!
    """The zero-indexed number of the block to be deleted"""
    blockN: Int!
  ): Boolean
`;

const deleteMutationsResolvers = {
  deleteDocSet: (root, args) =>
    root.deleteDocSet(args.docSetId),
  deleteDocument: (root, args) =>
    root.deleteDocument(args.docSetId, args.documentId),
  deleteSequence: (root, args) => {
    const document = root.documents[args.documentId];

    if (!document) {
      throw new Error(`Document '${args.documentId}' not found`);
    }

    return document.deleteSequence(args.sequenceId);
  },
  deleteBlock: (root, args) => {
    const document = root.documents[args.documentId];

    if (!document) {
      throw new Error(`Document '${args.documentId}' not found`);
    }

    return document.deleteBlock(args.sequenceId, args.blockN);
  },
};

const deleteMutations = {
  deleteDocSet: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Deletes a docSet',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet to be deleted',
      },
    },
    resolve: deleteMutationsResolvers.deleteDocSet,
  },
  deleteDocument: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Deletes e document',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document to be deleted',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document to be deleted',
      },
    },
    resolve: deleteMutationsResolvers.deleteDocument,
  },
  deleteSequence: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Deletes a sequence from a document',
    args: {
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence to be deleted',
      },
      sequenceId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the sequence to be deleted',
      },
    },
    resolve: deleteMutationsResolvers.deleteSequence,
  },
  deleteBlock: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Deletes a block from a sequence',
    args: {
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence from which the block will be deleted',
      },
      sequenceId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the sequence from which the block will be deleted',
      },
      blockN: {
        type: GraphQLNonNull(GraphQLInt),
        description: 'The zero-indexed number of the block to be deleted',
      },
    },
    resolve: deleteMutationsResolvers.deleteBlock,
  },
};

module.exports = {
  deleteMutationsSchemaString,
  deleteMutationsResolvers,
  deleteMutations,
};
