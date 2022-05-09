import { enumRegexIndexTuples, enumStringIndex } from 'proskomma-utils';

const exactSearchTermIndexes = (docSet, chars, allChars) => {
  let charsIndexesArray = [
    chars
      .map(
        c => [enumStringIndex(docSet.enums.wordLike, c)],
      ),
  ];

  if (allChars) {
    charsIndexesArray = charsIndexesArray[0];
  } else {
    charsIndexesArray = charsIndexesArray.map(ci => ci.reduce((a, b) => a.concat(b)));
  }
  return charsIndexesArray;
};

const regexSearchTermIndexes = (docSet, chars, allChars) => {
  let charsIndexesArray = [
    chars
      .map(
        c =>
          enumRegexIndexTuples(docSet.enums.wordLike, c)
            .map(tup => tup[0]),
      ),
  ];

  if (allChars) {
    charsIndexesArray = charsIndexesArray[0];
  } else {
    charsIndexesArray = charsIndexesArray.map(ci => ci.reduce((a, b) => a.concat(b)));
  }
  return charsIndexesArray;
};

const sequenceMatchesSearchTerms = (seq, charsIndexesArray, allChars) => {
  if (allChars && charsIndexesArray.filter(i => i.length === 0).length > 0) {
    return false;
  }

  charsIndexesArray = charsIndexesArray.filter(i => i.length > 0);

  if (charsIndexesArray.length === 0) {
    return false;
  }

  for (const charsIndexes of charsIndexesArray) {
    let found = false;

    for (const charsIndex of charsIndexes) {
      const isPresent = charsIndex >= 0 && seq.tokensPresent.get(charsIndex) > 0;

      if (isPresent) {
        found = true;
        break;
      }
    }

    if (allChars && !found) {
      return false;
    } else if (!allChars && found) {
      return true;
    }
  }
  return allChars;
};

const sequenceHasChars = (docSet, seq, chars, allChars) => {
  let charsIndexesArray = exactSearchTermIndexes(docSet, chars, allChars);
  return sequenceMatchesSearchTerms(seq, charsIndexesArray, allChars);
};

const sequenceHasMatchingChars = (docSet, seq, chars, allChars) => {
  let charsIndexesArray = regexSearchTermIndexes(docSet, chars, allChars);
  return sequenceMatchesSearchTerms(seq, charsIndexesArray, allChars);
};

export {
  sequenceHasChars,
  sequenceHasMatchingChars,
  // sequenceMatchesSearchTerms,
  regexSearchTermIndexes,
  exactSearchTermIndexes,
};
