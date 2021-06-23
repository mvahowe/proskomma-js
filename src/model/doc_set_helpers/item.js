import { headerBytes } from 'proskomma-utils';

const countItems = (docSet, succinct) => {
  let count = 0;
  let pos = 0;

  while (pos < succinct.length) {
    count++;
    const headerByte = succinct.byte(pos);
    const itemLength = headerByte & 0x0000003F;
    pos += itemLength;
  }
  return count;
};

const itemsByIndex= (docSet, mainSequence, index, includeContext) => {
  let ret = [];

  if (!index) {
    return ret;
  }

  let currentBlock = index.startBlock;
  let nextToken = index.nextToken;

  while (currentBlock <= index.endBlock) {
    let blockItems = docSet.unsuccinctifyItems(mainSequence.blocks[currentBlock].c, {}, nextToken);
    const blockScope = docSet.unsuccinctifyScopes(mainSequence.blocks[currentBlock].bs)[0];
    const blockGrafts = docSet.unsuccinctifyGrafts(mainSequence.blocks[currentBlock].bg);

    if (currentBlock === index.startBlock && currentBlock === index.endBlock) {
      blockItems = blockItems.slice(index.startItem, index.endItem + 1);
    } else if (currentBlock === index.startBlock) {
      blockItems = blockItems.slice(index.startItem);
    } else if (currentBlock === index.endBlock) {
      blockItems = blockItems.slice(0, index.endItem + 1);
    }

    if (includeContext) {
      let extendedBlockItems = [];

      for (const bi of blockItems) {
        extendedBlockItems.push(bi.concat([bi[0] === 'token' && bi[1] === 'wordLike' ? nextToken++ : null]));
      }
      blockItems = extendedBlockItems;
    }
    ret.push([...blockGrafts, ['scope', 'start', blockScope[2]], ...blockItems, ['scope', 'end', blockScope[2]]]);
    currentBlock++;
  }
  return ret;
};

const sequenceItemsByScopes = (docSet, blocks, byScopes) => {
  // Return array of [scopes, items]
  // Scan block items, track scopes
  // If all scopes found:
  //   - turn found scopes into string
  //   - if that scope string doesn't exist, add to lookup table and push array
  //   - add item to array matching scope string
  let allBlockScopes = [];

  const allScopesPresent = () => {
    for (const requiredScope of byScopes) {
      if (!matchingScope(requiredScope)) {
        return false;
      }
    }
    return true;
  };

  const matchingScope = (scopeToMatch) => {
    for (const blockScope of allBlockScopes) {
      if (blockScope.startsWith(scopeToMatch)) {
        return blockScope;
      }
    }
    return null;
  };

  const scopesString = () => byScopes.map(s => matchingScope(s)).sort().join('_');

  docSet.maybeBuildEnumIndexes();
  const ret = [];
  const scopes2array = {};

  for (const block of blocks) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = docSet.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[2];
    const startBlockScope = ['scope', 'start', blockScope];
    const endBlockScope = ['scope', 'end', blockScope];
    const blockGrafts = docSet.unsuccinctifyGrafts(block.bg);

    allBlockScopes = new Set(docSet.unsuccinctifyScopes(block.os)
      .map(s => s[2])
      .concat([blockScope]),
    );

    for (
      const item of blockGrafts.concat(
        [
          startBlockScope,
          ...docSet.unsuccinctifyItems(block.c, {}, block.nt.nByte(0), allBlockScopes),
          endBlockScope,
        ],
      )
    ) {
      if (item[0] === 'scope' && item[1] === 'start') {
        allBlockScopes.add(item[2]);
      }

      if (allScopesPresent()) {
        const scopeKey = scopesString();

        if (!(scopeKey in scopes2array)) {
          scopes2array[scopeKey] = ret.length;
          ret.push([[...allBlockScopes], []]);
        }
        ret[ret.length - 1][1].push(item);
      }

      if (item[0] === 'scope' && item[1] === 'end') {
        allBlockScopes.delete(item[2]);
      }
    }
  }
  return ret;
};

const sequenceItemsByMilestones = (docSet, blocks, byMilestones) => {
  // Return array of [scopes, items]
  // Scan block items
  // If milestone found:
  //   - add array
  // push item to last array
  let allBlockScopes = new Set([]);
  const milestoneFound = (item) => item[0] === 'scope' && item[1] === 'start' && byMilestones.includes(item[2]);

  docSet.maybeBuildEnumIndexes();
  const ret = [[[], []]];

  for (const block of blocks) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = docSet.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[2];
    const blockGrafts = docSet.unsuccinctifyGrafts(block.bg);
    allBlockScopes.add(blockScope);
    docSet.unsuccinctifyScopes(block.os).forEach(s => allBlockScopes.add(s[2]));
    const items = blockGrafts.concat(
      [blockScope].concat(
        docSet.unsuccinctifyItems(block.c, {}, block.nt.nByte(0)),
      ),
    );

    for (const item of items) {
      if (item[0] === 'scope' && item[1] === 'start') {
        allBlockScopes.add(item[2]);
      }

      if (milestoneFound(item)) {
        ret[ret.length - 1][0] = [...allBlockScopes].sort();
        ret.push([[], []]);

        for (
          const bs of [...allBlockScopes]
            .filter(
              s => {
                const excludes = ['blockTag', 'verse', 'verses', 'chapter'];
                return excludes.includes(s.split('/')[0]) || byMilestones.includes(s);
              },
            )
        ) {
          allBlockScopes.delete(bs);
        }
        allBlockScopes.add(blockScope);
      }
      ret[ret.length - 1][1].push(item);
    }
    ret[ret.length - 1][1].push(['scope', 'end', blockScope]);
    ret[ret.length - 1][1].push(['token', 'punctuation', '\n']);
  }
  ret[ret.length - 1][0] = [...allBlockScopes].sort();
  return ret;
};

module.exports = {
  countItems,
  itemsByIndex,
  sequenceItemsByMilestones,
  sequenceItemsByScopes,
};
