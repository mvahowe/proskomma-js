const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} = require('graphql');

const sequenceType = require('./sequence');
const keyValueType = require('./key_value');
const cvIndexType = require('./cvIndex');
const cIndexType = require('./cIndex');
const itemGroupType = require('./itemGroup');

const headerById = (root, id) =>
  (id in root.headers) ? root.headers[id] : null;

const documentType = new GraphQLObjectType({
  name: 'Document',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLString) },
    docSetId: { type: GraphQLNonNull(GraphQLString) },
    headers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      resolve: root => Object.entries(root.headers),
    },
    header: {
      type: GraphQLString,
      args: { id: { type: GraphQLNonNull(GraphQLString) } },
      resolve: (root, args) => headerById(root, args.id),
    },
    mainSequence: {
      type: GraphQLNonNull(sequenceType),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId];
      },

    },
    nSequences: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return Object.keys(root.sequences).length;
      },
    },
    sequences: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(sequenceType))),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return Object.values(root.sequences);
      },
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      resolve: root => Array.from(root.tags),
    },
    hasTag: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: { tagName: { type: GraphQLNonNull(GraphQLString) } },
      resolve: (root, args) => root.tags.has(args.tagName),
    },
    cv: {
      type: GraphQLNonNull(itemGroupType),
      args: {
        chapter: { type: GraphQLString },
        verses: { type: GraphQLList(GraphQLNonNull(GraphQLString)) },
        chapterVerses: { type: GraphQLString },
        includeContext: { type: GraphQLBoolean },
      },
      resolve: (root, args, context) => {
        const updatedOpenScopes = (openScopes, items) => {
          let ret = openScopes;

          for (const item of items) {
            if (item[0] === 'scope') {
              if (item[1] === 'start') {
                const existingScopes = ret.filter(s => s[2] === item[2]);

                if (existingScopes.length === 0) {
                  ret.push(item[2]);
                }
              } else {
                ret = openScopes.filter(s => s[2] !== item[2]);
              }
            }
          }
          return ret;
        };

        context.docSet = root.processor.docSets[root.docSetId];
        const mainSequence = root.sequences[root.mainId];

        if (!args.chapter && !args.chapterVerses) {
          throw new Error('Must specify either chapter or chapterVerse for cv');
        }

        if (args.chapter && args.chapterVerses) {
          throw new Error('Must not specify both chapter and chapterVerse for cv');
        }

        if (args.chapterVerses && args.verses) {
          throw new Error('Must not specify both chapterVerses and verses for cv');
        }

        if (args.chapter && !args.verses) { // whole chapter
          const ci = root.chapterIndex(args.chapter);

          if (ci) {
            const block = mainSequence.blocks[ci.startBlock];
            return [
              updatedOpenScopes(
                context.docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
                context.docSet.unsuccinctifyItems(block.c, { scopes: true }, 0, []).slice(0, ci.startItem),
              ),
              context.docSet.itemsByIndex(mainSequence, ci, args.includeContext || false)
                .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))),
            ];
          } else {
            return [];
          }
        } else if (args.verses) { // c:v, c:v-v
          const cvi = root.chapterVerseIndex(args.chapter);

          if (cvi) {
            let retItems = [];
            let firstStartBlock;
            let firstStartItem;
            for (const verse of args.verses.map(v => parseInt(v))) {
              if (cvi[verse]) {
                for (const ve of cvi[verse]) {
                  if (!firstStartBlock) {
                    firstStartBlock = ve.startBlock;
                    firstStartItem = ve.startItem;
                  }
                  retItems = retItems.concat(context.docSet.itemsByIndex(mainSequence, ve, args.includeContext || null)
                    .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))));
                }
              }
            }

            const block = mainSequence.blocks[firstStartBlock];
            return [
              updatedOpenScopes(
                context.docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
                context.docSet.unsuccinctifyItems(block.c, { scopes: true }, 0, []).slice(0, firstStartItem),
              ),
              retItems,
            ];
          } else {
            return [];
          }
        } else { // ChapterVerse, c:v-c:v
          const [fromCV, toCV] = args.chapterVerses.split('-');
          const [fromC, fromV] = fromCV.split(':');
          const [toC, toV] = toCV.split(':');
          const fromCVI = root.chapterVerseIndex(fromC);
          const toCVI = root.chapterVerseIndex(toC);

          if (!fromCVI || !toCVI || !fromCVI[parseInt(fromV)] || !toCVI[parseInt(toV)]) {
            return [];
          }

          const index = {
            startBlock: fromCVI[parseInt(fromV)][0].startBlock,
            endBlock: toCVI[parseInt(toV)][0].endBlock,
            startItem: fromCVI[parseInt(fromV)][0].startItem,
            endItem: toCVI[parseInt(toV)][0].endItem,
            nextToken: toCVI[parseInt(toV)][0].nextToken,
          };

          if (index.startBlock > index.endBlock || (index.startBlock === index.endBlock && index.startItem >= index.endItem)) {
            return [];
          }

          const block = mainSequence.blocks[index.startBlock];
          return [
            updatedOpenScopes(
              context.docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
              context.docSet.unsuccinctifyItems(block.c, { scopes: true }, 0, []).slice(0, index.startItem),
            ),
            context.docSet.itemsByIndex(mainSequence, index, args.includeContext || false)
              .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))),
          ];
        }
      },
    },
    cvIndexes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(cvIndexType))),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return Object.entries(root.chapterVerseIndexes());
      },
    },
    cvIndex: {
      type: GraphQLNonNull(cvIndexType),
      args: { chapter: { type: GraphQLNonNull(GraphQLInt) } },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return [args.chapter, root.chapterVerseIndex(args.chapter) || []];
      },
    },
    cIndexes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(cIndexType))),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return Object.entries(root.chapterIndexes());
      },
    },
    cIndex: {
      type: GraphQLNonNull(cIndexType),
      args: { chapter: { type: GraphQLNonNull(GraphQLInt) } },
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
