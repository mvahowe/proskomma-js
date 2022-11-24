import utils from '../../util';
import { remakeBlocks } from '../lib/remake_blocks';

const addMutationsSchemaString = `
  """Adds a document which will be assigned to an existing or new docSet on the basis of the specified selectors"""
  addDocument(
    """The selectors for this document, the keys of which must match those of the Proskomma instance"""
    selectors: [InputKeyValue!]!
    """The format of the content (probably usfm or usx)"""
    contentType: String!
    """The document content as a string"""
    content: String!
    """A list of tags to be added"""
    tags: [String!]
  ): Boolean!
  """Creates a new, empty sequence"""
  newSequence(
    """The id of the document to which the sequence will be added"""
    documentId: String!
    """The type of the new sequence (main, heading...)"""
    type: String!
    """The JSON describing blocks, if any, for the new sequence"""
    blocksSpec: [inputBlockSpec!]
    """If true, graft to the first block of the main sequence"""
    graftToMain: Boolean
    """'A list of tags to be added"""
    tags: [String!]
  ): String!
  """Adds a new block to a sequence"""
  newBlock(
    """The id of the document containing the sequence to which the block will be added"""
    documentId: String!
    """The id of the sequence to which the block will be added"""
    sequenceId: String!
    """The zero-indexed position at which to add the block"""
    blockN: Int!
    """The scope to be applied to the block, eg blockScope/p"""
    blockScope: String!
  ): Boolean!
`;

const addMutationsResolvers = {
  addDocument: (root, args) => {
    const selectorsObject = {};

    args.selectors.forEach(
      s => {
        selectorsObject[s.key] = s.value;
      },
    );
    return !!root.importDocument(selectorsObject, args.contentType, args.content, null, null, null, args.tags || []);
  },
  newSequence: (root, args) => {
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
      utils.succinct.pushSuccinctGraftBytes(mainSequenceBG, graftTypeEnumIndex, seqEnumIndex);
    }
    return newSeqId;
  },
  newBlock: (root, args) => {
    const document = root.documents[args.documentId];

    if (!document) {
      throw new Error(`Document '${args.documentId}' not found`);
    }

    return document.newBlock(args.sequenceId, args.blockN, args.blockScope);
  },
};

export {
  addMutationsSchemaString,
  addMutationsResolvers,
};
