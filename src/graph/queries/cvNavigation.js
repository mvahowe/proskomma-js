const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const cvType = require('./cv');

const cvNavigationType = new GraphQLObjectType({
  // root is [ < 0 chapter >, < 1 verse >, < 2 previousChapterIndex >, < 3 thisChapterIndex >, < 4 nextChapterIndex > ]
  name: 'cvNavigation',
  description: 'Various answers to \'previous\' and \'next\' with respect to a verse',
  fields: () => ({
    nextVerse: {
      type: cvType,
      description: 'The verse number for the next verse',
      resolve: root => {
        const chapterN = parseInt(root[0]);
        const verseN = parseInt(root[1]);

        if (root[3].length <= verseN || root[3][verseN].length === 0) {
          return null;
        }
        let ret = null;
        let nc = chapterN;
        let nv = verseN;
        let index = root[3];
        let onNextChapter = false;

        while (!ret) {
          nv += 1;

          if (nv >= index.length) {
            if (onNextChapter || !root[4]) {
              break;
            }
            nv = -1;
            nc += 1;
            index = root[4];
            onNextChapter = true;
          } else if (index[nv].length > 0) {
            ret = [nc, nv];
          }
        }
        return ret;
      },
    },
    previousVerse: {
      type: cvType,
      description: 'The verse number for the previous verse',
      resolve: root => {
        const chapterN = parseInt(root[0]);
        const verseN = parseInt(root[1]);

        if (root[3].length <= verseN || root[3][verseN].length === 0) {
          return null;
        }
        let ret = null;
        let nc = chapterN;
        let nv = verseN;
        let index = root[3];
        let onPreviousChapter = false;

        while (!ret) {
          nv -= 1;
          if (nv < 0) {
            if (onPreviousChapter || !root[2]) {
              break;
            }
            nv = root[2].length;
            nc -= 1;
            index = root[2];
            onPreviousChapter = true;
          } else if (index[nv].length > 0) {
            ret = [nc, nv];
          }
        }
        return ret;
      },
    },
    nextVerseRange: {
      type: cvType,
      description: 'The verse range for the next verse',
    },
    previousVerseRange: {
      type: cvType,
      description: 'The verse range for the previous verse',
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
