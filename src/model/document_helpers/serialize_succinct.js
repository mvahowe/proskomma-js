const serializeSuccinct = document => {
  const ret = { sequences: {} };
  ret.headers = document.headers;
  ret.mainId = document.mainId;
  ret.tags = Array.from(document.tags);

  for (const [seqId, seqOb] of Object.entries(document.sequences)) {
    ret.sequences[seqId] = serializeSuccinctSequence(seqOb);
  }
  return ret;
};

const serializeSuccinctSequence = seqOb => {
  const ret = {
    type: seqOb.type,
    blocks: seqOb.blocks.map(b => serializeSuccinctBlock(b)),
    tags: Array.from(seqOb.tags),
  };

  if (seqOb.type === 'main') {
    ret.chapters = {};

    for (const [chK, chV] of Object.entries(seqOb.chapters || {})) {
      chV.trim();
      ret.chapters[chK] = chV.base64();
    }
    ret.chapterVerses = {};

    for (const [chvK, chvV] of Object.entries(seqOb.chapterVerses || {})) {
      chvV.trim();
      ret.chapterVerses[chvK] = chvV.base64();
    }

    if ('tokensPresent' in seqOb) {
      ret.tokensPresent = '0x' + seqOb.tokensPresent.toString(16);
    }
  }
  return ret;
};

const serializeSuccinctBlock = blockOb => {
  for (const succName of ['bs', 'bg', 'c', 'is', 'os', 'nt']) {
    blockOb[succName].trim();
  }
  return {
    bs: blockOb.bs.base64(),
    bg: blockOb.bg.base64(),
    c: blockOb.c.base64(),
    is: blockOb.is.base64(),
    os: blockOb.os.base64(),
    nt: blockOb.nt.base64(),
  };
};

export { serializeSuccinct };
