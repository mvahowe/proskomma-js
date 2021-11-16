const serializeSuccinct = docSet => {
  const ret = {
    id: docSet.id,
    metadata: { selectors: docSet.selectors },
    enums: {},
    docs: {},
    tags: Array.from(docSet.tags),
  };

  for (const [eK, eV] of Object.entries(docSet.enums)) {
    eV.trim();
    ret.enums[eK] = eV.base64();
  }
  ret.docs = {};

  for (const docId of docSet.docIds) {
    ret.docs[docId] = docSet.processor.documents[docId].serializeSuccinct();
  }
  return ret;
};

module.exports = { serializeSuccinct };
