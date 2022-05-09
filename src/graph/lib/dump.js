const dumpItem = i => {
  let wrapper;

  switch (i[0]) {
  case 'token':
    return `|${i[2]}`;
  case 'scope':
    wrapper = i[1] === 'start' ? '+' : '-';
    return `${wrapper}${i[2]}${wrapper}`;
  case 'graft':
    return `>${i[1]}<`;
  }
};

const dumpItems = il => il.map(bci => dumpItem(bci)).join('');

const dumpItemGroup = ig => {
  const ret = ['ItemGroup:'];
  ret.push(`   Open Scopes ${ig[0].join(', ')}`);
  ret.push(`   ${dumpItems(ig[1])}`);
  return ret.join('\n');
};

const dumpBlock = b => {
  const ret = ['Block:'];

  if (b.bg.length > 0) {
    b.bg.forEach(bbg => ret.push(`   ${bbg[1]} graft to ${bbg[2]}`));
  }
  ret.push(`   Scope ${b.bs[2]}`);
  ret.push(`   ${dumpItems(b.c)}`);
  return ret.join('\n');
};

export {
  dumpBlock,
  dumpItemGroup,
  dumpItems,
  dumpItem,
};
