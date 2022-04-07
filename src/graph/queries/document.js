import xre from 'xregexp';

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
const tableSequenceType = require('./table_sequence');
const treeSequenceType = require('./tree_sequence');
const kvSequenceType = require('./kv_sequence');
const blockType = require('./block');
const keyValueType = require('./key_value');
const cvIndexType = require('./cvIndex');
const cIndexType = require('./cIndex');
const itemGroupType = require('./itemGroup');
const itemType = require('./item');
const cvNavigationType = require('./cvNavigation');
const idPartsType = require('./idParts');

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
    idParts: {
      type: GraphQLNonNull(idPartsType),
      description: 'A parsed version of the id header',
      resolve: root => {
        const idHeader = headerById(root, 'id');

        if (!idHeader) {
          return [null, null];
        }

        const periphMatch = xre.exec(idHeader, /^(P\d\d)\s+([A-Z0-6]{3})\s+(\S+)\s+-\s+(.*)/);

        if (periphMatch) {
          return ['periph', periphMatch.slice(1)];
        }

        const bookMatch = xre.exec(idHeader, /^([A-Z0-6]{3})\s+(.*)/);

        if (bookMatch) {
          return ['book', bookMatch.slice(1)];
        }
        return [null, [idHeader]];
      },
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
        withTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with all the specified tags',
        },
        withoutTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with none of the specified tags',
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

        if (args.withTags) {
          ret = ret.filter(s => args.withTags.filter(t => s.tags.has(t)).length === args.withTags.length);
        }

        if (args.withoutTags) {
          ret = ret.filter(s => args.withoutTags.filter(t => s.tags.has(t)).length === 0);
        }

        return ret;
      },
    },
    tableSequences: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(tableSequenceType))),
      description: 'A list of table sequences for this document',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'ids of sequences to include, if found',
        },
        withTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with all the specified tags',
        },
        withoutTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with none of the specified tags',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);

        ret = ret.filter(s => s.type === 'table');

        if (args.ids) {
          ret = ret.filter(s => args.ids.includes(s.id));
        }

        if (args.withTags) {
          ret = ret.filter(s => args.withTags.filter(t => s.tags.has(t)).length === args.withTags.length);
        }

        if (args.withoutTags) {
          ret = ret.filter(s => args.withoutTags.filter(t => s.tags.has(t)).length === 0);
        }

        return ret;
      },
    },
    treeSequences: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(treeSequenceType))),
      description: 'A list of tree sequences for this document',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'ids of sequences to include, if found',
        },
        withTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with all the specified tags',
        },
        withoutTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with none of the specified tags',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);

        ret = ret.filter(s => s.type === 'tree');

        if (args.ids) {
          ret = ret.filter(s => args.ids.includes(s.id));
        }

        if (args.withTags) {
          ret = ret.filter(s => args.withTags.filter(t => s.tags.has(t)).length === args.withTags.length);
        }

        if (args.withoutTags) {
          ret = ret.filter(s => args.withoutTags.filter(t => s.tags.has(t)).length === 0);
        }

        return ret;
      },
    },
    kvSequences: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(kvSequenceType))),
      description: 'A list of key-value sequences for this document',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'ids of sequences to include, if found',
        },
        withTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with all the specified tags',
        },
        withoutTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with none of the specified tags',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);

        ret = ret.filter(s => s.type === 'kv');

        if (args.ids) {
          ret = ret.filter(s => args.ids.includes(s.id));
        }

        if (args.withTags) {
          ret = ret.filter(s => args.withTags.filter(t => s.tags.has(t)).length === args.withTags.length);
        }

        if (args.withoutTags) {
          ret = ret.filter(s => args.withoutTags.filter(t => s.tags.has(t)).length === 0);
        }

        return ret;
      },
    },
    textSequences: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(sequenceType))),
      description: 'A list of text (ie non-table, non-tree, non-kv) sequences for this document',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'ids of sequences to include, if found',
        },
        withTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with all the specified tags',
        },
        withoutTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return sequences with none of the specified tags',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);

        ret = ret.filter(s => s.type !== 'tree' && s.type !== 'table' && s.type !== 'kv');

        if (args.ids) {
          ret = ret.filter(s => args.ids.includes(s.id));
        }

        if (args.withTags) {
          ret = ret.filter(s => args.withTags.filter(t => s.tags.has(t)).length === args.withTags.length);
        }

        if (args.withoutTags) {
          ret = ret.filter(s => args.withoutTags.filter(t => s.tags.has(t)).length === 0);
        }

        return ret;
      },
    },
    sequence: {
      type: sequenceType,
      description: 'The sequence with the specified id',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'id of the sequence',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);
        ret = ret.filter(s => args.id.includes(s.id));
        return ret[0] || null;
      },
    },
    tableSequence: {
      type: tableSequenceType,
      description: 'The table sequence with the specified id',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'id of the table sequence',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);
        ret = ret.filter(s => args.id.includes(s.id));

        if (ret[0] && ret[0].type !== 'table') {
          throw new Error(`Expected sequence id ${ret[0].id} to be of type 'table', not '${ret[0].type}'`);
        }
        return ret[0] || null;
      },
    },
    treeSequence: {
      type: treeSequenceType,
      description: 'The tree sequence with the specified id',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'id of the tree sequence',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);
        ret = ret.filter(s => args.id.includes(s.id));

        if (ret[0] && ret[0].type !== 'tree') {
          throw new Error(`Expected sequence id ${ret[0].id} to be of type 'tree', not '${ret[0].type}'`);
        }
        return ret[0] || null;
      },
    },
    kvSequence: {
      type: kvSequenceType,
      description: 'The key-value sequence with the specified id',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'id of the tree sequence',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        let ret = Object.values(root.sequences);
        ret = ret.filter(s => args.id.includes(s.id));

        if (ret[0] && ret[0].type !== 'vk') {
          throw new Error(`Expected sequence id ${ret[0].id} to be of type 'kv', not '${ret[0].type}'`);
        }
        return ret[0] || null;
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
      args: {
        normalizeSpace: {
          type: GraphQLBoolean,
          description: 'If true, converts each whitespace character to a single space',
        },
      },
      description: 'The text for each block of the main sequence',
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId].blocks.map(
          b => {
            const tokens = context.docSet.unsuccinctifyItems(b.c, { tokens: true }, null);
            let ret = tokens.map(t => t[2]).join('').trim();

            if (args.normalizeSpace) {
              ret = ret.replace(/[ \t\n\r]+/g, ' ');
            }
            return ret;
          },
        );
      },
    },
    mainText: {
      type: GraphQLNonNull((GraphQLString)),
      description: 'The text for the main sequence',
      args: {
        normalizeSpace: {
          type: GraphQLBoolean,
          description: 'If true, converts each whitespace character to a single space',
        },
      },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId].blocks.map(
          b => {
            const tokens = context.docSet.unsuccinctifyItems(b.c, { tokens: true }, null);
            let ret = tokens.map(t => t[2]).join('').trim();

            if (args.normalizeSpace) {
              ret = ret.replace(/[ \t\n\r]+/g, ' ');
            }
            return ret;
          },
        ).join('\n');
      },
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this document',
      resolve: root => Array.from(root.tags),
    },
    tagsKv: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      description: 'A list of the tags of this document as key/value tuples',
      resolve: root => Array.from(root.tags).map(t => {
        if (t.includes(':')) {
          return [t.substring(0, t.indexOf(':')), t.substring(t.indexOf(':') + 1)];
        } else {
          return [t, ''];
        }
      }),
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
    mappedCvs: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))))),
      description: 'Content for each verse of a chapter within this document, using the versification of the specified docSet',
      args: {
        chapter: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The chapter number (as a string)',
        },
        mappedDocSetId: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The id of the mapped docSet',
        },
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
      },
      resolve: (root, args, context) => {
        const cvIndex = root.chapterVerseIndex(args.chapter);
        const verses = cvIndex.filter(ve => ve.length > 0).map(ve => ve[0].verses);
        let ret = [];

        for (const verse of verses) {
          ret.push(
            do_cv(root, {
              ...args,
              verses: [verse],
            }, context, true, args.mappedDocSetId)
              .map(ig => [[`fromChapter/${args.chapter}`, `fromVerse/${verse}`, ...ig[0]], ig[1]]),
          );
        }
        return ret;
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
    cvMatching: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))),
      description: 'Verses matching the arguments',
      args: {
        withChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return verses containing a token whose payload is an exact match to one of the specified strings',
        },
        withMatchingChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return verses containing a token whose payload matches the specified regexes',
        },
        withScopes: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return blocks where the list of scopes is open',
        },
        allChars: {
          type: GraphQLBoolean,
          description: 'If true, verses where all regexes match will be included',
        },
        allScopes: {
          type: GraphQLBoolean,
          description: 'If true, verses where all scopes match will be included',
        },
      },
      resolve: (root, args, context) => {
        if (!args.withChars && !args.withMatchingChars && !args.withScopes) {
          throw new Error('Must specify at least one of withChars or withMatchingChars or withScopes');
        }

        if (args.withChars && args.withMatchingChars) {
          throw new Error('Must not specify both withChars and withMatchingChars');
        }

        context.docSet = root.processor.docSets[root.docSetId];

        let charsRegexes;

        if (args.withChars && args.allChars) {
          charsRegexes = args.withChars.map(s => xre(`^${s}$`));
        } else if (args.withChars) {
          charsRegexes = [xre.union(args.withChars.map(s => xre(`^${s}$`, 'i')))];
        } else if (args.withMatchingChars && args.allChars) {
          charsRegexes = args.withMatchingChars.map(s => xre(s, 'i'));
        } else if (args.withMatchingChars) {
          charsRegexes = [xre.union(args.withMatchingChars.map(s => xre(s, 'i')))];
        }

        const allScopesInGroup = scopes => {
          for (const expectedScope of args.withScopes || []) {
            if (!scopes.includes(expectedScope)) {
              return false;
            }
          }
          return true;
        };

        const anyScopesInGroup = scopes => {
          const expectedScopes = args.withScopes || [];

          for (const expectedScope of expectedScopes) {
            if (scopes.includes(expectedScope)) {
              return true;
            }
          }
          return expectedScopes.length === 0;
        };

        const allRegexesInGroup = items => {
          for (const regex of charsRegexes || []) {
            let found = false;

            for (const item of items) {
              if (xre.test(item[2], regex)) {
                found = true;
                break;
              }
            }

            if (!found) {
              return false;
            }
          }
          return true;
        };

        const itemGroups = context.docSet.sequenceItemsByScopes(
          root.sequences[root.mainId].blocks,
          ['chapter/', 'verses/'],
        );
        return itemGroups.filter(
          ig =>
            (args.allScopes ? allScopesInGroup : anyScopesInGroup)(
              ig[1].filter(i => i[0] === 'scope' && i[1] === 'start').map(s => s[2])) &&
            allRegexesInGroup(ig[1]),
        );
      },
    },
  }),
});

module.exports = documentType;
