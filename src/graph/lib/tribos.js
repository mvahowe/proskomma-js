import xre from 'xregexp';

const doAbsoluteStep = (docSet, result, queryStep, matches) => {
  const values = matches[1].split(',').map(v => v.trim());
  return {
    data: result.data.filter(n => values.includes(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])),
  };
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
    return tribos1(docSet, doStep(docSet, result, queryArray[0]), queryArray.slice(1));
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
  return JSON.stringify(
    tribos1(docSet, { data: nodes }, queryArray(queryString))
      .data.map(n => docSet.unsuccinctifyBlock(n, {})),
    null,
    2,
  );
};

module.exports = tribos;
