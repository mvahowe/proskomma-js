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
    args: {
      docSetId: { type: GraphQLNonNull(GraphQLString) },
      documentId: { type: GraphQLNonNull(GraphQLString) },
      sequenceId: { type: GraphQLNonNull(GraphQLString) },
      blockPosition: { type: GraphQLNonNull(GraphQLInt) },
      itemObjects: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemObject))) },
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
        args.itemObjects,
      );
    },
  },
  gcSequences: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      documentId: { type: GraphQLNonNull(GraphQLString) },
      docSetId: { type: GraphQLNonNull(GraphQLString) },
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