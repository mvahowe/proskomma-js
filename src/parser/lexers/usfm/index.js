import xre from 'xregexp';

const {
  lexingRegexes,
  mainRegex,
} = require('../lexingRegexes');
const { preTokenClassForFragment } = require('../class_for_fragment');

const parseUsfm = (str, parser) => {
  for (const match of xre.match(str, mainRegex, 'all')) {
    parser.parseItem(preTokenClassForFragment(match, lexingRegexes));
  }
};

module.exports = { parseUsfm };