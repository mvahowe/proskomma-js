const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
} = require('graphql');

const inputItemObject = require('../queries/inputItemObject');

const updateMutations = {
  updateItems: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Replaces the items of a block with a new set of items',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document containing the sequence containing the block for which the items will be updated',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence containing the block for which the items will be updated',
      },
      sequenceId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the sequence containing the block for which the items will be updated',
      },
      blockPosition: {
        type: GraphQLNonNull(GraphQLInt),
        description: 'The zero-indexed number of the block for which the items will be updated',
      },
      items: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemObject))),
        description: 'The new items for the block',
      },
    },
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        throw new Error(`DocSet '${args.docSetId}' not found`);
      }
      return docSet.updateItems(
        args.documentId,
        args.sequenceId,
        args.blockPosition,
        args.items,
      );
    },
  },
  gcSequences: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Garbage collects unused sequences within a document. (You probably don\'t need to do this.)',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document to be garbage collected',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document to be garbage collected',
      },
    },
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        throw new Error(`DocSet '${args.docSetId}' not found`);
      }

      const document = root.documents[args.documentId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      if (document.gcSequences()) {
        docSet.rehash();
        return true;
      } else {
        return false;
      }
    },
  },
};

module.exports = updateMutations;