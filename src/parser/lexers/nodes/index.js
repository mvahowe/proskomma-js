const { Sequence } = require('../../model/sequence');

const parseNodes = (str, parser, bookCode) => {
  parser.headers.id = bookCode;
  parser.headers.bookCode = bookCode;
  const treeSequence = new Sequence('tree');
  const treeContentSequence = new Sequence('treeContent');

  parser.sequences.tree.push(treeSequence);
  parser.sequences.treeContent.push(treeContentSequence);
  treeSequence.addBlockGraft({
    type: 'graft',
    subType: 'treeContent',
    payload: treeContentSequence.id,
  });
  parser.sequences.main.addBlockGraft({
    type: 'graft',
    subType: 'tree',
    payload: treeSequence.id,
  });
};

module.exports = { parseNodes };
