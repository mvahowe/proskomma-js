const buildPreEnum = (docSet, succinct) => {
  const ret = new Map();
  let pos = 0;
  let enumCount = 0;

  while (pos < succinct.length) {
    ret.set(
      succinct.countedString(pos),
      {
        'enum': enumCount++,
        'frequency': 0,
      },
    );
    pos += succinct.byte(pos) + 1;
  }

  return ret;
};

const recordPreEnum = (docSet, category, value) => {
  if (!(category in docSet.preEnums)) {
    throw new Error(`Unknown category ${category} in recordPreEnum. Maybe call buildPreEnums()?`);
  }

  if (value.length > 255) {
    console.log('Value length of', value.length, 'in recordPreEnum');
  }

  if (!docSet.preEnums[category].has(value)) {
    docSet.preEnums[category].set(
      value,
      {
        'enum': docSet.preEnums[category].size,
        'frequency': 1,
      },
    );
  } else {
    docSet.preEnums[category].get(value).frequency++;
  }
};

const buildEnum = (docSet, category, preEnumOb) => {
  const sortedPreEnums = new Map([...preEnumOb.entries()]);

  for (const enumText of sortedPreEnums.keys()) {
    if (enumText.length > 255) {
      console.log('enum text for', category, 'has length', enumText.length, 'in buildEnum - truncating');
    }
    docSet.enums[category].pushCountedString(enumText.substring(0, 255));
  }
  docSet.enums[category].trim();
};

const enumForCategoryValue = (docSet, category, value, addUnknown) => {
  if (!addUnknown) {
    addUnknown = false;
  }

  if (!(category in docSet.preEnums)) {
    throw new Error(`Unknown category ${category} in preEnums. Maybe call buildPreEnums()?`);
  }

  if (docSet.preEnums[category].has(value)) {
    return docSet.preEnums[category].get(value).enum;
  } else if (addUnknown) {
    docSet.preEnums[category].set(
      value,
      {
        'enum': docSet.preEnums[category].size,
        'frequency': 1,
      },
    );
    docSet.enums[category].pushCountedString(value);
    docSet.buildEnumIndex(category);
    return docSet.preEnums[category].get(value).enum;
  } else {
    throw new Error(`Unknown value '${value}' for category ${category} in enumForCategoryValue. Maybe call buildPreEnums()?`);
  }
};


export {
  buildPreEnum,
  recordPreEnum,
  buildEnum,
  enumForCategoryValue,
};
