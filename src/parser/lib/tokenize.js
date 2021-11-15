const xre = require('xregexp');
const { mainRegex, lexingRegexes } = require('../lexers/lexingRegexes');

const tokenTypes = {};
const unionComponents = [];
for (const lr of lexingRegexes) {
  if (['wordLike', 'eol', 'lineSpace', 'punctuation', 'unknown'].includes(lr[1])) {
    tokenTypes[lr[1]] = xre(`^${lr[2].xregexp.source}$`);
    unionComponents.push(lr[2]);
  }
}

const tokenizeString = str => {
  const unionRegex = xre.union(unionComponents);
  const ret = [];
  for (const token of xre.match(str, unionRegex, 'all')) {
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
