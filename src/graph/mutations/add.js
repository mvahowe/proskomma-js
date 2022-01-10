const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInt,
} = require('graphql');
const {
  pushSuccinctGraftBytes,
} = require('proskomma-utils');
const { remakeBlocks } = require('../lib/remake_blocks');
const inputKeyValue = require('../queries/input_key_value');
const inputBlockSpecType = require('../queries/inputBlockSpec');

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
      tags: {
        type: GraphQLList(GraphQLNonNull(GraphQLString)),
        description: 'A list of tags to be added',
      },
    },
    resolve: (root, args) => {
      const selectorsObject = {};

      args.selectors.forEach(
        s => {
          selectorsObject[s.key] = s.value;
        },
      );
      return !!root.importDocument(selectorsObject, args.contentType, args.content, null, null, null, args.tags || []);
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
      blocksSpec: {
        type: GraphQLList(GraphQLNonNull(inputBlockSpecType)),
        description: 'The JSON describing blocks, if any, for the new sequence',
      },
      graftToMain: {
        type: GraphQLBoolean,
        description: 'If true, graft to the first block of the main sequence',
      },
      tags: {
        type: GraphQLList(GraphQLNonNull(GraphQLString)),
        description: 'A list of tags to be added',
      },
    },
    resolve: (root, args) => {
      const document = root.documents[args.documentId];
      const docSet = document.processor.docSets[document.docSetId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      const newSeqId = document.newSequence(args.type, args.tags);

      if (args.blocksSpec) {
        remakeBlocks(docSet, document, document.sequences[newSeqId], args.blocksSpec);
        document.buildChapterVerseIndex();
      }

      if (args.graftToMain) {
        docSet.maybeBuildPreEnums();
        const mainSequenceBG = document.sequences[document.mainId].blocks[0].bg;
        const graftTypeEnumIndex = docSet.enumForCategoryValue('graftTypes', args.type, true);
        const seqEnumIndex = docSet.enumForCategoryValue('ids', newSeqId, true);
        pushSuccinctGraftBytes(mainSequenceBG, graftTypeEnumIndex, seqEnumIndex);
      }
      return newSeqId;
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
        description: 'The scope to be applied to the block, eg blockScope/p',
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
