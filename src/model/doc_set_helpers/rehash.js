const rehash = docSet => {
  docSet.preEnums = {};

  for (const category of Object.keys(docSet.enums)) {
    docSet.preEnums[category] = new Map();
  }
  docSet.maybeBuildEnumIndexes();

  for (const document of docSet.documents()) {
    for (const sequence of Object.values(document.sequences)) {
      document.rerecordPreEnums(docSet, sequence);
    }
  }
  docSet.sortPreEnums();
  const oldToNew = docSet.makeRehashEnumMap();

  for (const document of docSet.documents()) {
    for (const sequence of Object.values(document.sequences)) {
      document.rewriteSequenceBlocks(sequence.id, oldToNew);
    }
  }
  docSet.buildEnums();
  docSet.buildEnumIndexes();
  return true;
};

const makeRehashEnumMap = docSet => {
  const ret = {};

  for (const [category, enumSuccinct] of Object.entries(docSet.enums)) {
    ret[category] = [];
    let pos = 0;

    while (pos < enumSuccinct.length) {
      const stringLength = enumSuccinct.byte(pos);
      const enumString = enumSuccinct.countedString(pos);

      if (docSet.preEnums[category].has(enumString)) {
        ret[category].push(docSet.preEnums[category].get(enumString).enum);
      } else {
        ret[category].push(null);
      }

      pos += stringLength + 1;
    }
  }
  return ret;
};

module.exports = { rehash, makeRehashEnumMap };
