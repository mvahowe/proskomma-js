const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} = require('graphql');

const { do_cv } = require('../lib/do_cv');
const sequenceType = require('./sequence');
const blockType = require('./block');
const keyValueType = require('./key_value');
const cvIndexType = require('./cvIndex');
const cIndexType = require('./cIndex');
const itemGroupType = require('./itemGroup');
const itemType = require('./item');
const cvNavigationType = require('./cvNavigation');

const headerById = (root, id) =>
  (id in root.headers) ? root.headers[id] : null;

const documentType = new GraphQLObjectType({
  name: 'Document',
  description: 'A document, typically corresponding to USFM for one book',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the document',
    },
    docSetId: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the docSet to which this document belongs',
    },
    headers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      description: 'USFM header information such as TOC',
      resolve: root => Object.entries(root.headers),
    },
    header: {
      type: GraphQLString,
      description: 'One USFM header',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The header id, corresponding to the tag name minus any trailing \'1\'',
        },
      },
      resolve: (root, args) => headerById(root, args.id),
    },
    mainSequence: {
      type: GraphQLNonNull(sequenceType),
      description: 'The main sequence',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId];
      },
    },
    nSequences: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of sequences',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return Object.keys(root.sequences).length;
      },
    },
    sequences: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(sequenceType))),
      description: 'A list of sequences for this document',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'ids of sequences to include, if found',
        },
        types: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'types of sequences to include, if found',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);

        if (args.ids) {
          ret = ret.filter(s => args.ids.includes(s.id));
        }

        if (args.types) {
          ret = ret.filter(s => args.types.includes(s.type));
        }
        return ret;
      },
    },
    mainBlocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(blockType))),
      description: 'The blocks of the main sequence',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId].blocks;
      },
    },
    mainBlocksItems: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))))),
      description: 'The items for each block of the main sequence',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId].blocks.map(
          b => context.docSet.unsuccinctifyItems(b.c, {}, null),
        );
      },
    },
    mainBlocksTokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))))),
      description: 'The tokens for each block of the main sequence',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId].blocks.map(
          b => context.docSet.unsuccinctifyItems(b.c, { tokens: true }, null),
        );
      },
    },
    mainBlocksText: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The text for each block of the main sequence',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId].blocks.map(
          b => {
            const tokens = context.docSet.unsuccinctifyItems(b.c, { tokens: true }, null);
            return tokens.map(t => t[2]).join('').trim();
          },
        );
      },
    },
    mainText: {
      type: GraphQLNonNull((GraphQLString)),
      description: 'The text for the main sequence',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId].blocks.map(
          b => {
            const tokens = context.docSet.unsuccinctifyItems(b.c, { tokens: true }, null);
            return tokens.map(t => t[2]).join('').trim();
          },
        ).join('\n');
      },
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this document',
      resolve: root => Array.from(root.tags),
    },
    hasTag: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether or not the document has the specified tag',
      args: {
        tagName: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The tag',
        },
      },
      resolve: (root, args) => root.tags.has(args.tagName),
    },
    cv: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))),
      description: 'Content for a Scripture reference within this document, using local versification',
      args: {
        chapter: {
          type: GraphQLString,
          description: 'The chapter number (as a string)',
        },
        verses: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'A list of verse numbers (as strings)',
        },
        chapterVerses: {
          type: GraphQLString,
          description: 'A chapterVerse Reference (ch:v-ch:v)',
        },
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
      },
      resolve: (root, args, context) => do_cv(root, args, context, false),
    },
    mappedCv: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))),
      description: 'Content for a Scripture reference within this document, using the versification of the specified docSet',
      args: {
        chapter: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The chapter number (as a string)',
        },
        mappedDocSetId: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The id of the mapped docSet',
        },
        verses: {
          type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
          description: 'A list of verse numbers (as strings)',
        },
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
      },
      resolve: (root, args, context) => {
        if (args.verses.length !== 1) {
          throw new Error(`mappedCv expects exactly one verse, not ${args.verses.length}`);
        }
        return do_cv(root, args, context, true, args.mappedDocSetId);
      },
    },
    cvNavigation: {
      type: cvNavigationType,
      description: 'What\'s previous and next with respect to the specified verse',
      args: {
        chapter: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The chapter number (as a string)',
        },
        verse: {
          type: GraphQLNonNull(GraphQLString),
          description: 'A verse number (as a string)',
        },
      },
      resolve:
        (root, args) => [
          args.chapter,
          args.verse,
          root.chapterVerseIndex((parseInt(args.chapter) - 1).toString()),
          root.chapterVerseIndex(args.chapter),
          root.chapterVerseIndex((parseInt(args.chapter) + 1).toString()),
        ],
    },
    cvIndexes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(cvIndexType))),
      description: 'The content of the main sequence indexed by chapterVerse',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return Object.entries(root.chapterVerseIndexes());
      },
    },
    cvIndex: {
      type: GraphQLNonNull(cvIndexType),
      description: 'The content of the specified chapter indexed by chapterVerse',
      args: {
        chapter: {
          type: GraphQLNonNull(GraphQLInt),
          description: 'The chapter number',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return [args.chapter, root.chapterVerseIndex(args.chapter) || []];
      },
    },
    cIndexes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(cIndexType))),
      description: 'The content of the main sequence indexed by chapter',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return Object.entries(root.chapterIndexes());
      },
    },
    cIndex: {
      type: GraphQLNonNull(cIndexType),
      description: 'The content of a chapter',
      args: {
        chapter: {
          type: GraphQLNonNull(GraphQLInt),
          description: 'The chapter number',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        const ci = root.chapterIndex(args.chapter);
        return [args.chapter, ci || {}];
      },
    },
  }),
});

module.exports = documentType;
