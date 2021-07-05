import xre from 'xregexp';

const makePrintable = (subclass, matchedBits) => ({
  subclass,
  printValue: matchedBits[0],
});

const makeChapter = (subclass, matchedBits) => ({
  subclass,
  numberString: matchedBits[2],
  number: parseInt(matchedBits[2]),
  printValue: `\\c ${matchedBits[2]}\n`,
});

const makeVerses = (subclass, matchedBits) => {
  const ret = {
    subclass,
    numberString: matchedBits[2],
    printValue: `\\v ${matchedBits[2]}\n`,
  };

  if (ret.numberString.includes('-')) {
    const [fromV, toV] = ret.numberString.split('-').map(v => parseInt(v));
    ret.numbers = Array.from(Array((toV - fromV) + 1).keys()).map(v => v + fromV);
  } else {
    ret.numbers = [parseInt(ret.numberString)];
  }
  return ret;
};

const makeAttribute = (subclass, matchedBits) => {
  let ret;

  if (subclass === 'defaultAttribute') {
    ret = {
      subclass,
      key: 'default',
      valueString: matchedBits[2].trim().replace(/\//g, '÷'),
    };
  } else {
    ret = {
      subclass,
      key: matchedBits[2],
      valueString: matchedBits[3].trim().replace(/\//g, '÷'),
    };
  }
  ret.values = ret.valueString.split(',').map(vb => vb.trim());
  ret.printValue = `| ${ret.key}="${ret.valueString}"`;
  return ret;
};

const makePubChapter = (subclass, matchedBits) => ({
  subclass,
  numberString: matchedBits[2],
  printValue: `\\cp ${matchedBits[2]}\n`,
});

const makeMilestone = (subclass, matchedBits) => {
  const ret = {
    subclass,
    sOrE: null,
  };

  if (subclass === 'endMilestoneMarker') {
    ret.printValue = '\\*';
  } else {
    ret.tagName = matchedBits[2];

    if (subclass === 'emptyMilestone') {
      ret.printValue = `\\${ret.tagName}\\*`;
    } else {
      ret.printValue = `\\${ret.tagName}`;
      ret.sOrE = matchedBits[3];
    }
  }
  return ret;
};

const makeTag = (subclass, matchedBits) => {
  const ret = {
    subclass,
    tagName: matchedBits[2],
    isNested: false,
  };

  if (ret.tagName.startsWith('+')) {
    ret.isNested = true;
    ret.tagName = ret.tagName.substring(1);
  }
  ret.tagLevel = matchedBits[3] !== '' ? parseInt(matchedBits[3]) : 1;
  ret.fullTagName = `${ret.tagName}${matchedBits[3] === '1' ? '' : matchedBits[3]}`;
  ret.printValue = subclass === 'startTag' ? `\\${ret.fullTagName} ` : `\\${ret.fullTagName}*`;
  return ret;
};

const constructorForFragment = {
  printable: makePrintable,
  chapter: makeChapter,
  pubchapter: makePubChapter,
  verses: makeVerses,
  tag: makeTag,
  break: makePrintable,
  milestone: makeMilestone,
  attribute: makeAttribute,
  bad: makePrintable,
};

const preTokenObjectForFragment = (fragment, lexingRegexes) => {
  for (let n = 0; n < lexingRegexes.length; n++) {
    let [tClass, tSubclass, tRE] = lexingRegexes[n];
    let matchedBits = xre.exec(fragment, tRE, 0, 'sticky');

    if (matchedBits) {
      return constructorForFragment[tClass](tSubclass, matchedBits);
    }
  }
  throw new Error(`Could not match preToken fragment '${fragment}'`);
};

module.exports = { constructorForFragment, preTokenObjectForFragment };
