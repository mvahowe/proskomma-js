import ByteArray from '../lib/byteArray';
import succinct from '../lib/succinct';
import itemDefs from '../lib/itemDefs';
import tokenDefs from '../lib/tokenDefs';
import scopeDefs from '../lib/scopeDefs';

const inspectEnum = enumString => {
  const ba = new ByteArray();
  ba.fromBase64(enumString);
  const ret = [];
  ret.push(`* Char length ${ba.length} *`);

  for (const [count, text] of succinct.unpackEnum(ba, true)) {
    ret.push(`${count}\t"${text}"`);
  }
  return ret.join('\n');
};

const inspectSuccinct = (succinctdoc, enumStrings) => {
  const ba = new ByteArray();
  ba.fromBase64(succinctdoc);
  const enums = {};

  for (const [category, enumString] of Object.entries(enumStrings)) {
    enums[category] = new ByteArray();
    enums[category].fromBase64(enumString);
  }

  const indexes = succinct.enumIndexes(enums);
  const ret = [];
  ret.push(`* Char length ${ba.length} *`);
  let pos = 0;

  while (pos < ba.length) {
    const [itemLength, itemType, itemSubtype] = succinct.headerBytes(ba, pos);
    let subtypeLabel = itemSubtype;
    let extra = '';

    switch (itemDefs.itemEnumLabels[itemType]) {
    case 'token':
      subtypeLabel = tokenDefs.tokenEnumLabels[itemSubtype];
      extra = `"${succinct.succinctTokenChars(enums, indexes, ba, itemSubtype, pos)}"`;
      break;
    case 'startScope':
    case 'endScope':
      subtypeLabel = scopeDefs.scopeEnumLabels[itemSubtype];
      extra = succinct.succinctScopeLabel(enums, indexes, ba, itemSubtype, pos);
      break;
    case 'graft':
      subtypeLabel = succinct.succinctGraftName(enums, indexes, itemSubtype);
      extra = succinct.succinctGraftSeqId(enums, indexes, ba, pos);
    }
    ret.push(`${itemDefs.itemEnumLabels[itemType]}\t${subtypeLabel}\t(${itemLength})\t${extra}`);
    pos += itemLength;
  }
  return ret.join('\n');
};

export { inspectEnum, inspectSuccinct };
