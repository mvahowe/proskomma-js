const { ptBooks } = require('proskomma-utils');

const ptCompare = (a, b) => {
  const bcA = a.headers.bookCode || 'GEN';
  const bcB = b.headers.bookCode || 'GEN';
  const posA = ptBooks[bcA] ? ptBooks[bcA].position : 999;
  const posB = ptBooks[bcB] ? ptBooks[bcB].position : 999;
  return posA - posB;
};

const alphaCompare = (a, b) => {
  const bcA = a.headers.bookCode || 'GEN';
  const bcB = b.headers.bookCode || 'GEN';
  return bcA.localeCompare(bcB);
};

const alpha2Compare = (a, b) => {
  const digits = [1, 2, 3, 4, 5, 6];
  let bcA = a.headers.bookCode || 'GEN';

  if (digits.includes(bcA[0])) {
    bcA = bcA.substring(1) + bcA[0];
  }
  let bcB = b.headers.bookCode || 'GEN';

  if (digits.includes(bcB[0])) {
    bcB = bcB.substring(1) + bcB[0];
  }
  return bcA.localeCompare(bcB);
};

const bookCodeCompareFunctions = {
  paratext: ptCompare,
  alpha: alphaCompare,
  alpha2: alpha2Compare,
};

module.exports = { bookCodeCompareFunctions };
