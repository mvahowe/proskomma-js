import xre from 'xregexp';

const enumStringIndex = (enumSuccinct, str) => {
  let pos = 0;
  let count = 0;

  while (pos < enumSuccinct.length) {
    const stringLength = enumSuccinct.byte(pos);
    const enumString = enumSuccinct.countedString(pos);

    if (enumString === str) {
      return count;
    }
    pos += (stringLength + 1);
    count += 1;
  }
  return -1;
};

const enumRegexIndexTuples = (enumSuccinct, regex) => {
  let pos = 0;
  let count = 0;
  const ret = [];

  while (pos < enumSuccinct.length) {
    const stringLength = enumSuccinct.byte(pos);
    const enumString = enumSuccinct.countedString(pos);

    if (xre.exec(enumString, xre(regex, 'i'))) {
      ret.push([count, enumString]);
    }
    pos += (stringLength + 1);
    count += 1;
  }
  return ret;
};

export {
  enumStringIndex,
  enumRegexIndexTuples,
};
