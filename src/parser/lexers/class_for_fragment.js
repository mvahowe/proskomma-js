const ptClasses = require('./preTokenClasses');
import xre from 'xregexp';

const classForFragment = {
  printable: ptClasses.PrintablePT,
  chapter: ptClasses.ChapterPT,
  pubchapter: ptClasses.PubChapterPT,
  verses: ptClasses.VersesPT,
  tag: ptClasses.TagPT,
  break: ptClasses.BreakPT,
  milestone: ptClasses.MilestonePT,
  attribute: ptClasses.AttributePT,
  bad: ptClasses.BadPT,
};

const preTokenClassForFragment = (fragment, lexingRegexes) => {
  for (const lexingRegex of lexingRegexes) {
    let [tClass, tSubclass, tRE] = lexingRegex;
    let matchedBits = xre.exec(fragment, tRE, 0, 'sticky');
    if (matchedBits) {
      return new classForFragment[tClass](tSubclass, matchedBits);
    }
  }
  throw new Error(`Could not match preToken fragment '${fragment}'`);
};

module.exports = { preTokenClassForFragment };
