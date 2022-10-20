import tokenDefs from '../tokenDefs';
import scopeDefs from "../scopeDefs";
import itemDefs from '../itemDefs';

const headerBytes = (succinct, pos) =>{
    const headerByte = succinct.byte(pos);
    const itemType = headerByte >> 6;
    const itemLength = headerByte & 0x0000003F;
    const itemSubtype = succinct.byte(pos + 1);
    return [itemLength, itemType, itemSubtype];
}

const succinctTokenChars = (enums, enumIndexes, succinct, itemSubtype, pos) => {
    const itemCategory = tokenDefs.tokenCategory[tokenDefs.tokenEnumLabels[itemSubtype]];
    const itemIndex = enumIndexes[itemCategory][succinct.nByte(pos + 2)];
    return enums[itemCategory].countedString(itemIndex);
}

const succinctScopeLabel = (enums, enumIndexes, succinct, itemSubtype, pos) => {
    const scopeType = scopeDefs.scopeEnumLabels[itemSubtype];
    let nScopeBits = scopeDefs.nComponentsForScope(scopeType);
    let offset = 2;
    let scopeBits = '';

    while (nScopeBits > 1) {
        const itemIndexIndex = succinct.nByte(pos + offset);
        const itemIndex = enumIndexes.scopeBits[itemIndexIndex];
        const scopeBitString = enums.scopeBits.countedString(itemIndex);
        scopeBits += `/${scopeBitString}`;
        offset += succinct.nByteLength(itemIndexIndex);
        nScopeBits--;
    }
    return `${scopeType}${scopeBits}`;
}

const succinctGraftName = (enums, enumIndexes, itemSubtype) => {
    const graftIndex = enumIndexes.graftTypes[itemSubtype];
    return enums.graftTypes.countedString(graftIndex);
}

const succinctGraftSeqId = (enums, enumIndexes, succinct, pos) => {
    const seqIndex = enumIndexes.ids[succinct.nByte(pos + 2)];
    return enums.ids.countedString(seqIndex);
}

const enumIndexes = (enums) => {
    const ret = {};
    for (const [category, succinct] of Object.entries(enums)) {
        ret[category] = enumIndex(category, succinct);
    }
    return ret;
}

const enumIndex = (category, enumSuccinct) => {
    const indexSuccinct = new Uint32Array(enumSuccinct.length);
    let pos = 0;
    let count = 0;
    while (pos < enumSuccinct.length) {
        indexSuccinct[count] = pos;
        const stringLength = enumSuccinct.byte(pos);
        pos += (stringLength + 1);
        count += 1;
    }
    return indexSuccinct;
}

const unpackEnum = (succinct, includeIndex) => {
    if (!includeIndex) {
        includeIndex = false;
    }
    let pos = 0;
    let count = 0;
    const ret = [];
    while (pos < succinct.length) {
        const stringLength = succinct.byte(pos);
        const unpacked = succinct.countedString(pos);
        ret.push(includeIndex ? [count, unpacked] : unpacked);
        pos += stringLength + 1;
        count++;
    }
    return ret;
}

const undefinedArgError = (func, field) => {
  throw new Error(`Undefined or null argument '${field}' in '${func}'`);
};

const pushSuccinctTokenBytes = (bA, tokenEnumIndex, charsEnumIndex) => {
    if (tokenEnumIndex === undefined || tokenEnumIndex === null) {
        undefinedArgError('pushSuccinctTokenBytes', 'tokenEnumIndex');
    }
    if (charsEnumIndex === undefined || charsEnumIndex === null) {
        undefinedArgError('pushSuccinctTokenBytes', 'charsEnumIndex');
    }
    const lengthPos = bA.length;
    bA.pushByte(0);
    bA.pushByte(tokenEnumIndex);
    bA.pushNByte(charsEnumIndex);
    bA.setByte(lengthPos, (bA.length - lengthPos) | itemDefs.itemEnum.token << 6);
}

const pushSuccinctGraftBytes = (bA, graftTypeEnumIndex, seqEnumIndex) => {
    if (graftTypeEnumIndex === undefined || graftTypeEnumIndex === null) {
        undefinedArgError('pushSuccinctGraftBytes', 'graftTypeEnumIndex');
    }
    if (seqEnumIndex === undefined || seqEnumIndex === null) {
        undefinedArgError('pushSuccinctGraftBytes', 'seqEnumIndex');
    }
    const lengthPos = bA.length;
    bA.pushByte(0);
    bA.pushByte(graftTypeEnumIndex);
    bA.pushNByte(seqEnumIndex);
    bA.setByte(lengthPos, (bA.length - lengthPos) | itemDefs.itemEnum.graft << 6);
}

const pushSuccinctScopeBytes = (bA, itemTypeByte, scopeTypeByte, scopeBitBytes) => {
    if (itemTypeByte === undefined || itemTypeByte === null) {
        undefinedArgError('pushSuccinctScopeBytes', 'itemTypeByte');
    }
    if (scopeTypeByte === undefined || scopeTypeByte === null) {
        undefinedArgError('pushSuccinctScopeBytes', 'scopeTypeByte');
    }
    if (scopeBitBytes === undefined || scopeBitBytes === null) {
        undefinedArgError('pushSuccinctScopeBytes', 'scopeBitBytes');
    }
    const lengthPos = bA.length;
    bA.pushByte(0);
    bA.pushByte(scopeTypeByte);

    for (const sbb of scopeBitBytes) {
        bA.pushNByte(sbb);
    }
    bA.setByte(lengthPos, (bA.length - lengthPos) | itemTypeByte << 6);
}

export {
    enumIndex,
    enumIndexes,
    headerBytes,
    pushSuccinctTokenBytes,
    pushSuccinctGraftBytes,
    pushSuccinctScopeBytes,
    succinctTokenChars,
    succinctScopeLabel,
    succinctGraftName,
    succinctGraftSeqId,
    unpackEnum
};
