import xre from 'xregexp';

const {
  lexingRegexes,
  mainRegex,
} = require('../lexingRegexes');
const { preTokenClassForFragment } = require('../class_for_fragment');

const parseUsfm = (str, parser) => {
  let ptTime = 0;
  let piTime = 0;
  for (const match of xre.match(str, mainRegex, 'all')) {
    let t = Date.now();
    const preToken = preTokenClassForFragment(match, lexingRegexes);
    ptTime += Date.now() - t;
    t = Date.now();
    parser.parseItem(preToken);
    piTime += Date.now() - t;
  }
  // console.log(ptTime, piTime);
};

module.exports = { parseUsfm };