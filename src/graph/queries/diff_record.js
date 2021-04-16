const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const gitDiff = require('git-diff');

const itemType = require('./item');

const textFromItems = i => i.filter(i => i[0] === 'token')
  .map(t => t[1] === 'lineSpace' ? ' ' : t[2])
  .join('');

const diffRecordType = new GraphQLObjectType({
  name: 'diffRecord',
  description: 'A record in a diff report',
  fields: () => ({
    chapter: {
      type: GraphQLInt,
      description: 'The chapter number',
      resolve: root => root[0],
    },
    verse: {
      type: GraphQLInt,
      description: 'The verse number',
      resolve: root => root[1],
    },
    diffType: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The type of difference for this verse',
      resolve: root => root[2],
    },
    items1: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The items for this verse from the first document',
      resolve: root => root[3],
    },
    items2: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The items for this verse from the second document',
      resolve: root => root[4],
    },
    tokens1: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The tokens for this verse from the first document',
      resolve: root => root[3].filter(i => i[0] === 'token'),
    },
    tokens2: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The tokens for this verse from the second document',
      resolve: root => root[4].filter(i => i[0] === 'token'),
    },
    text1: {
      type: GraphQLString,
      description: 'The text for this verse from the first document',
      resolve:
        root => root[3] ? textFromItems(root[3]) : null,
    },
    text2: {
      type: GraphQLString,
      description: 'The text for this verse from the second document',
      resolve: root => root[4] ? textFromItems(root[4]) : null,
    },
    wordsDiff: {
      type: GraphQLString,
      description: 'A string showing the diff of the words in this verse',
      resolve: root => {
        if (root[3] && root[4]) {
          return gitDiff(
            textFromItems(root[3]),
            textFromItems(root[4]),
            {
              noHeaders: true,
              wordDiff: true,
            },
          );
        } else if (root[4]) {
          const text = textFromItems(root[4].filter(i => i[1] !== 'punctuation'))
          return `{+${text}+}`;
        } else if (root[3]) {
          const text = textFromItems(root[3].filter(i => i[1] !== 'punctuation'))
          return `[-${text}-]`;
        } else {
          return null;
        }
      },
    },
    tokensDiff: {
      type: GraphQLString,
      description: 'A string showing the diff of the tokens in this verse (including punctuation and normalized whitespace)',
      resolve: root => {
        if (root[3] && root[4]) {
          return gitDiff(
            textFromItems(root[3]),
            textFromItems(root[4]),
            {
              noHeaders: true,
              wordDiff: true,
            },
          );
        } else if (root[4]) {
          const text = textFromItems(root[4])
          return `{+${text}+}`;
        } else if (root[3]) {
          const text = textFromItems(root[3])
          return `[-${text}-]`;
        } else {
          return null;
        }
      },
    },
  }),
});

module.exports = diffRecordType;
