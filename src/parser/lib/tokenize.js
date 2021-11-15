const xre = require('xregexp');
const { mainRegex, lexingRegexes } = require('../lexers/lexingRegexes');

const tokenTypes = {};

for (const lr of lexingRegexes) {
  if (['eol', 'lineSpace', 'punctuation', 'wordLike'].includes(lr[1])) {
    tokenTypes[lr[1]] = xre(`^${lr[2].xregexp.source}$`);
  }
}

const tokenizeString = str => {
  const ret = [];

  for (const token of xre.match(str, mainRegex, 'all')) {
    let tokenType;

    if (xre.test(token, tokenTypes['wordLike'])) {
      tokenType = 'wordLike';
    } else if (xre.test(token, tokenTypes['punctuation'])) {
      tokenType = 'punctuation';
    } else if (xre.test(token, tokenTypes['lineSpace'])) {
      tokenType = 'lineSpace';
    } else if (xre.test(token, tokenTypes['eol'])) {
      tokenType = 'eol';
    } else {
      tokenType = 'unknown';
    }
    ret.push([token, tokenType]);
  }
  return ret;
};

module.exports = { tokenizeString };
