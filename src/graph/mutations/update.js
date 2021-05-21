const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
} = require('graphql');

const {string2aghast, aghast2items} = require('proskomma-utils');

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
        type: GraphQLString,
        description: 'The id of the sequence containing the block for which the items will be updated (defaults to the main sequence)',
      },
      blockPosition: {
        type: GraphQLNonNull(GraphQLInt),
        description: 'The zero-indexed number of the block for which the items will be updated',
      },
      items: {
        type: GraphQLList(GraphQLNonNull(inputItemObject)),
        description: 'The new content for the block as item objects',
      },
      aghast: {
        type: GraphQLString,
        description: 'The new content for the block in AGHAST format',
      },
    },
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        throw new Error(`DocSet '${args.docSetId}' not found`);
      }

      if (!args.items && !args.aghast) {
        throw new Error('Must provide items or AGHAST');
      }

      if (args.items && args.aghast) {
        throw new Error('Must provide either items or AGHAST, not both');
      }
      return docSet.updateItems(
        args.documentId,
        args.sequenceId,
        args.blockPosition,
        args.items || aghast2items(string2aghast(args.aghast)),
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