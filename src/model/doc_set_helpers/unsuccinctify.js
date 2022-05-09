import { headerBytes, itemEnum } from 'proskomma-utils';
import xre from 'xregexp';

const unsuccinctifyBlock = (docSet, block, options) => {
  docSet.maybeBuildEnumIndexes();
  const succinctBlockScope = block.bs;
  const [itemLength, itemType, itemSubtype] = headerBytes(succinctBlockScope, 0);
  const blockScope = docSet.unsuccinctifyScope(succinctBlockScope, itemType, itemSubtype, 0);
  const blockGrafts = docSet.unsuccinctifyGrafts(block.bg);
  const openScopes = docSet.unsuccinctifyScopes(block.os);
  const includedScopes = docSet.unsuccinctifyScopes(block.is);
  const nextToken = block.nt.nByte(0);
  const blockItems = docSet.unsuccinctifyItems(block.c, options || {}, nextToken);
  return {
    bs: blockScope,
    bg: blockGrafts,
    c: blockItems,
    os: openScopes,
    is: includedScopes,
    nt: nextToken,
  };
};

const unsuccinctifyItems = (docSet, succinct, options, nextToken, openScopes) => {
  if (nextToken === undefined) {
    throw new Error('nextToken (previously includeContext) must now be provided to unsuccinctifyItems');
  }

  if (nextToken !== null && typeof nextToken !== 'number') {
    throw new Error(`nextToken (previously includeContext) must be null or an integer, not ${typeof nextToken} '${JSON.stringify(nextToken)}' in unsuccinctifyItems`);
  }

  const ret = [];
  let pos = 0;
  let tokenCount = nextToken || 0;
  const scopes = new Set(openScopes || []);

  while (pos < succinct.length) {
    const [item, itemLength] = docSet.unsuccinctifyItem(succinct, pos, {});

    if (item[0] === 'token') {
      if ((Object.keys(options).length === 0) || options.tokens) {
        if (nextToken !== null) {
          item.push(item[0] === 'token' && item[1] === 'wordLike' ? tokenCount++ : null);
          item.push([...scopes]);
        }
        ret.push(item);
      }
    } else if (item[0] === 'scope' && item[1] === 'start') {
      scopes.add(item[2]);

      if ((Object.keys(options).length === 0) || options.scopes) {
        ret.push(item);
      }
    } else if (item[0] === 'scope' && item[1] === 'end') {
      scopes.delete(item[2]);

      if ((Object.keys(options).length === 0) || options.scopes) {
        ret.push(item);
      }
    } else if (item[0] === 'graft') {
      if ((Object.keys(options).length === 0) || options.grafts) {
        ret.push(item);
      }
    }
    pos += itemLength;
  }
  return ret;
};

const unsuccinctifyItem = (docSet, succinct, pos, options) => {
  let item = null;
  const [itemLength, itemType, itemSubtype] = headerBytes(succinct, pos);

  switch (itemType) {
  case itemEnum.token:
    if (Object.keys(options).length === 0 || options.tokens) {
      item = docSet.unsuccinctifyToken(succinct, itemSubtype, pos);
    }
    break;
  case itemEnum.startScope:
  case itemEnum.endScope:
    if (Object.keys(options).length === 0 || options.scopes) {
      item = docSet.unsuccinctifyScope(succinct, itemType, itemSubtype, pos);
    }
    break;
  case itemEnum.graft:
    if (Object.keys(options).length === 0 || options.grafts) {
      item = docSet.unsuccinctifyGraft(succinct, itemSubtype, pos);
    }
    break;
  }
  return [item, itemLength];
};

const unsuccinctifyPrunedItems = (docSet, block, options) => {
  const openScopes = new Set(docSet.unsuccinctifyScopes(block.os).map(ri => ri[2]));
  const requiredScopes = options.requiredScopes || [];
  const anyScope = options.anyScope || false;

  const allScopesInItem = () => {
    for (const scope of requiredScopes) {
      if (!openScopes.has(scope)) {
        return false;
      }
    }
    return true;
  };

  const anyScopeInItem = () => {
    for (const scope of requiredScopes) {
      if (openScopes.has(scope)) {
        return true;
      }
    }
    return (requiredScopes.length === 0);
  };

  const scopeTest = anyScope ? anyScopeInItem : allScopesInItem;
  const charsTest = (item) =>
    !options.withChars ||
    options.withChars.length === 0 ||
    (item[0] === 'token' && options.withChars.includes(item[2]));
  const ret = [];

  for (const item of docSet.unsuccinctifyItems(block.c, options, block.nt.nByte(0), openScopes)) {
    if (item[0] === 'scope' && item[1] === 'start') {
      openScopes.add(item[2]);
    }

    if (scopeTest() && charsTest(item)) {
      ret.push(item);
    }

    if (item[0] === 'scope' && item[1] === 'end') {
      openScopes.delete(item[2]);
    }
  }
  return ret;
};

const unsuccinctifyItemsWithScriptureCV = (docSet, block, cv, options) => {
  options = options || {};
  const openScopes = new Set(docSet.unsuccinctifyScopes(block.os).map(ri => ri[2]));

  const cvMatchFunction = () => {
    if (xre.exec(cv, xre('^[1-9][0-9]*$'))) {
      return () => openScopes.has(`chapter/${cv}`);
    } else if (xre.exec(cv, xre('^[1-9][0-9]*-[1-9][0-9]*$'))) {
      return () => {
        const [fromC, toC] = cv.split('-').map(v => parseInt(v));

        if (fromC > toC) {
          throw new Error(`Chapter range must be from min to max, not '${cv}'`);
        }

        for (const scope of [...Array((toC - fromC) + 1).keys()].map(n => `chapter/${n + fromC}`)) {
          if (openScopes.has(scope)) {
            return true;
          }
        }
        return false;
      };
    } else if (xre.exec(cv, xre('^[1-9][0-9]*:[0-9]+$'))) {
      return () => {
        const [fromC, fromV] = cv.split(':').map(v => parseInt(v));

        if (fromV === 0) {
          return (
            openScopes.has(`chapter/${fromC}`) &&
            [...openScopes].filter(s => s.startsWith('verse')).length === 0
          );
        } else {
          for (const scope of [`chapter/${fromC}`, `verse/${fromV}`]) {
            if (!openScopes.has(scope)) {
              return false;
            }
          }
          return true;
        }
      };
    } else if (xre.exec(cv, xre('^[1-9][0-9]*:[0-9]+-[1-9][0-9]*$'))) {
      return () => {
        const [fromC, vs] = cv.split(':');
        const [fromV, toV] = vs.split('-').map(v => parseInt(v));

        if (fromV > toV) {
          throw new Error(`Verse range must be from min to max, not '${vs}'`);
        }

        const chapterScope = `chapter/${fromC}`;
        const verseScopes = [...Array((toV - fromV) + 1).keys()].map(n => `verse/${n + fromV}`);

        if (!openScopes.has(chapterScope)) {
          return false;
        }

        for (const scope of verseScopes) {
          if (openScopes.has(scope)) {
            return true;
          }
        }
        return fromV === 0 && [...openScopes].filter(s => s.startsWith('verse')).length === 0;
      };
    } else if (xre.exec(cv, xre('^[1-9][0-9]*:[0-9]+-[1-9][0-9]*:[0-9]+$'))) {
      return () => {
        const [fromCV, toCV] = cv.split('-');
        const [fromC, fromV] = fromCV.split(':').map(c => parseInt(c));
        const [toC, toV] = toCV.split(':').map(v => parseInt(v));

        if (fromC > toC) {
          throw new Error(`Chapter range must be from min to max, not '${fromC}-${toV}'`);
        }

        const scopeArray = [...openScopes];
        const chapterScopes = scopeArray.filter(s => s.startsWith('chapter/'));

        if (chapterScopes.length > 1) {
          throw new Error(`Expected zero or one chapter for item, found ${chapterScopes.length}`);
        }

        const chapterNo = parseInt(chapterScopes[0].split('/')[1]);

        if ((chapterNo < fromC) || (chapterNo > toC)) {
          return false;
        } else if (chapterNo === fromC) {
          return scopeArray.filter(
            s =>
              s.startsWith('verse/') &&
              parseInt(s.split('/')[1]) >= fromV,
          ).length > 0 ||
            (fromV === 0 && scopeArray.filter(s => s.startsWith('verse')).length === 0);
        } else if (chapterNo === toC) {
          return scopeArray.filter(
            s =>
              s.startsWith('verse/') &&
              parseInt(s.split('/')[1]) <= toV,
          ).length > 0 ||
            (toV === 0 && scopeArray.filter(s => s.startsWith('verse')).length === 0);
        } else {
          return true;
        }
      };
    } else {
      throw new Error(`Bad cv reference '${cv}'`);
    }
  };

  const itemMatchesCV = cvMatchFunction();

  const itemInOptions = (item) => {
    if (!options || Object.keys(options).length === 0) {
      return true;
    } else {
      const itemType = item[0];
      return (
        (itemType === 'token' && 'tokens' in options) ||
        (itemType === 'graft' && 'grafts' in options) ||
        (itemType === 'scope' && 'scopes' in options)
      );
    }
  };

  const ret = [];

  for (const item of docSet.unsuccinctifyItems(block.c, {}, block.nt.nByte(0))) {
    if (item[0] === 'scope' && item[1] === 'start') {
      openScopes.add(item[2]);
    }

    if (itemMatchesCV() && itemInOptions(item)) {
      ret.push(item);
    }

    if (item[0] === 'scope' && item[1] === 'end') {
      openScopes.delete(item[2]);
    }
  }
  return ret;
};

export {
  unsuccinctifyBlock,
  unsuccinctifyItem,
  unsuccinctifyItems,
  unsuccinctifyItemsWithScriptureCV,
  unsuccinctifyPrunedItems,
};
