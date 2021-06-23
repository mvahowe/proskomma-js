import xre from 'xregexp';

const validateSelectors = (docSet, selectors) => {
  if (typeof selectors !== 'object') {
    throw new Error(`DocSet constructor expects selectors to be object, found ${typeof docSet.selectors}`);
  }

  const expectedSelectors = {};

  for (const selector of docSet.processor.selectors) {
    expectedSelectors[selector.name] = selector;
  }

  for (const [name, value] of Object.entries(selectors)) {
    if (!(name in expectedSelectors)) {
      throw new Error(`Unexpected selector '${name}' (expected one of [${Object.keys(expectedSelectors).join(', ')}])`);
    }

    if (
      (typeof value === 'string' && expectedSelectors[name].type !== 'string') ||
      (typeof value === 'number' && expectedSelectors[name].type !== 'integer')
    ) {
      throw new Error(`Selector '${name}' is of type ${typeof value} (expected ${expectedSelectors[name].type})`);
    }

    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw new Error(`Value '${value}' of integer selector '${name}' is not an integer`);
      }

      if ('min' in expectedSelectors[name] && value < expectedSelectors[name].min) {
        throw new Error(`Value '${value}' is less than ${expectedSelectors[name].min}`);
      }

      if ('max' in expectedSelectors[name] && value > expectedSelectors[name].max) {
        throw new Error(`Value '${value}' is greater than ${expectedSelectors[name].max}`);
      }
    } else {
      if ('regex' in expectedSelectors[name] && !xre.exec(value, xre(expectedSelectors[name].regex), 0)) {
        throw new Error(`Value '${value}' does not match regex '${expectedSelectors[name].regex}'`);
      }
    }

    if ('enum' in expectedSelectors[name] && !expectedSelectors[name].enum.includes(value)) {
      throw new Error(`Value '${value}' of selector '${name}' is not in enum`);
    }
  }

  for (const name of Object.keys(expectedSelectors)) {
    if (!(name in selectors)) {
      throw new Error(`Expected selector '${name}' not found`);
    }
  }
  return selectors;
};

module.exports = { validateSelectors };

