const test = require('tape');

const { pkWithDoc } = require('../lib/load');
const { Proskomma } = require('../../src');

const importNodes = pk => {
  pk.importDocument({
    lang: 'deu',
    abbr: 'xyz',
  }, 'nodes',
  JSON.stringify(
    {
      rows: [
        ['ab.c', 'c ba'],
        ['de.f', 'f ed'],
        ['gh.i', 'i hg'],
      ],
    },
  ),
  {},
  );
};

const testGroup = 'Nodes';

test(
  `Import (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const pk = new Proskomma();
      importNodes(pk);
      let query = '{documents { mainSequence { id } sequences { id type tags blocks { bs { payload} bg { payload } is { payload } tokens { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      console.log(JSON.stringify(result, null, 2));
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);
