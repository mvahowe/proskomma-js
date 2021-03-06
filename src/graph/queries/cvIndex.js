const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const cvVerseElementType = new GraphQLObjectType({
  name: 'cvVerseElement',
  fields: () => ({
    startBlock: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.startBlock,
    },
    endBlock: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.endBlock,
    },
    startItem: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.startItem,
    },
    endItem: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.endItem,
    },
  }),
});

const cvVersesType = new GraphQLObjectType({
  name: 'cvVerses',
  fields: () => ({
    verse: {
      type: GraphQLList(cvVerseElementType),
      resolve: root => root,
    },
  }),
});

const cvIndexType = new GraphQLObjectType({
  name: 'cvIndex',
  fields: () => ({
    chapter: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root[0],
    },
    verses: {
      type: GraphQLList(cvVersesType),
      resolve: root => root[1],
    },
  }),
});

module.exports = cvIndexType;
