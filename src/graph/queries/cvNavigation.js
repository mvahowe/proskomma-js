const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const verseNumberType = require('./verseNumber');
const verseRangeType = require('./verseRange');

const cvNavigationType = new GraphQLObjectType({
  // root is [ < 0 chapter >, < 1 verse >, < 2 previousChapterIndex >, < 3 thisChapterIndex >, < 4 nextChapterIndex > ]
  name: 'cvNavigation',
  description: 'Various answers to \'previous\' and \'next\' with respect to a verse',
  fields: () => ({
    nextVerse: {
      type: verseNumberType,
      description: 'The verse number record for the next verse',
    },
    previousVerse: {
      type: verseNumberType,
      description: 'The verse number record for the previous verse',
    },
    nextVerseRange: {
      type: verseRangeType,
      description: 'The verse range record for the next verse',
    },
    previousVerseRange: {
      type: verseRangeType,
      description: 'The verse range record for the previous verse',
    },
    nextChapter: {
      type: GraphQLString,
      description: 'The next chapter number (as a string)',
      resolve: root => {
        if (root[3].length > 0 && root[4].length > 0) {
          return (parseInt(root[0]) + 1).toString();
        } else {
          return null;
        }
      },
    },
    previousChapter: {
      type: GraphQLString,
      description: 'The previous chapter number (as a string)',
      resolve: root => {
        if (root[2].length > 0 && root[3].length > 0) {
          return (parseInt(root[0]) - 1).toString();
        } else {
          return null;
        }
      },
    },
  }),
});

module.exports = cvNavigationType;
