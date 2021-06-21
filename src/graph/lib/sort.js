const { ptBooks } = require('proskomma-utils');

const ptCompare = (a, b) => {
  const bcA = a.headers.bookCode || 'GEN';
  const bcB = b.headers.bookCode || 'GEN';
  return ptBooks[bcB].position - ptBooks[bcA].position;
};

module.exports = { ptCompare };
