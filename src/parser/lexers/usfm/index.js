import xre from 'xregexp';

const {
  lexingRegexes,
  mainRegex,
} = require('../lexingRegexes');
const { preTokenClassForFragment } = require('../class_for_fragment');

const parseUsfm = (str, parser) => {
  const matches = xre.match(str, mainRegex, 'all');

  for (let n = 0; n < matches.length; n++) {
    parser.parseItem(preTokenClassForFragment(matches[n], lexingRegexes));
  }
};

module.exports = { parseUsfm };