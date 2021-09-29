const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const kvEntryType = require('./kv_entry');

const kvSequenceType = new GraphQLObjectType({
  name: 'kvSequence',
  description: 'A contiguous flow of content for key-values',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the sequence',
    },
    nEntries: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of entries in the key-value sequence',
      resolve: root => root.blocks.length,
    },
    entries: {
      type: GraphQLList(GraphQLNonNull(kvEntryType)),
      description: 'The entries in the key-value sequence',
      resolve: (root, args, context) => {
        const ret = root.blocks.map(
          b => [
            context.docSet.unsuccinctifyScopes(b.bs)
              .map(s => s[2].split('/')[1])[0],
            context.docSet.unsuccinctifyScopes(b.is)
              .filter(s => s[2].startsWith('kvSecondary/'))
              .map(s => [s[2].split('/')[1], s[2].split('/')[2] ]),
            context.docSet.sequenceItemsByScopes([b], ['kvField/'], false),
          ],
        );
        return ret;
      },
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this sequence',
      resolve: root => Array.from(root.tags),
    },
    hasTag: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether or not the sequence has the specified tag',
      args: {
        tagName: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The tag name',
        },
      },
      resolve: (root, args) => root.tags.has(args.tagName),
    },
  }),
});

module.exports = kvSequenceType;
