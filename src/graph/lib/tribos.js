import xre from 'xregexp';

const doAbsoluteStep = (docSet, result, queryStep, matches) => {
  const values = matches[1].split(',').map(v => v.trim());
  return { data: result.data.filter(n => values.includes(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
};

const stepActions = [
  [xre('^#\\{([^}]+)\\}$'), doAbsoluteStep],
];

const doStep = (docSet, result, queryStep) => {
  for (const stepAction of stepActions) {
    const matches = xre.exec(queryStep, stepAction[0]);

    if (matches) {
      return stepAction[1](docSet, result, queryStep, matches);
    }
  }
  return { errors: `Unable to match step ${queryStep}` };
};

const tribos1 = (docSet, result, queryArray) => {
  if (queryArray.length > 0) {
    const stepResult = doStep(docSet, result, queryArray[0]);

    if (result.errors) {
      return result;
    } else {
      return tribos1(docSet, stepResult, queryArray.slice(1));
    }
  } else {
    return result;
  }
};

const queryArray = qs => {
  const ret = [];

  for (const s of qs.split('/')) {
    ret.push(s);
  }
  return ret;
};

const tribos = (docSet, nodes, queryString) => {
  const result = tribos1(docSet, { data: nodes }, queryArray(queryString));

  if (result.data) {
    result.data = result.data.map(n => docSet.unsuccinctifyBlock(n, {}));
  }
  return (JSON.stringify(result, null, 2));
};

module.exports = tribos;
