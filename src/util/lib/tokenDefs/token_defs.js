const tokenEnum = {
  wordLike: 0,
  punctuation: 1,
  lineSpace: 2,
  eol: 3,
  softLineBreak: 4,
  noBreakSpace: 5,
  bareSlash: 6,
  unknown: 7,
};

const tokenEnumLabels = Object.entries(tokenEnum).sort((a, b) => a[1] - b[1]).map(kv => kv[0]);

const tokenCategory = {
  wordLike: 'wordLike',
  punctuation: 'notWordLike',
  lineSpace: 'notWordLike',
  eol: 'notWordLike',
  softLineBreak: 'notWordLike',
  noBreakSpace: 'notWordLike',
  bareSlash: 'notWordLike',
  unknown: 'notWordLike',
};

export {
  tokenEnum, tokenEnumLabels, tokenCategory,
};
