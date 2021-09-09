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
      primary: 'me',
      secondary: {
        name: 'Fred Smith',
        shoeSize: '78',
      },
      children: [
        {
          primary: 'mom',
          secondary: {
            name: 'Sally Smith née Brown',
            shoeSize: '3',
          },
          children: [
            {
              primary: 'grandma',
              secondary: {
                name: 'Emma Smith née Jones',
                shoeSize: '2',
              },
            },
            {
              primary: 'grandpa',
              secondary: {
                name: 'Simon Smith',
                shoeSize: '89',
              },
            },
          ],
        },
        {
          primary: 'pop',
          secondary: {
            name: 'Bob Smith',
            shoeSize: '91',
          },
          children: [
            {
              primary: 'granny',
              secondary: {
                name: 'Deborah Smith née Black',
                shoeSize: '5',
              },
            },
            {
              primary: 'grandpops',
              secondary: {
                name: 'Michael Smith',
                shoeSize: '79',
              },
            },
          ],
        },
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
      t.plan(12);
      const pk = new Proskomma();
      importNodes(pk);
      let query = '{documents { mainSequence { id } sequences { id type tags blocks { bs { payload} bg { payload } is { payload } tokens { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const doc = result.data.documents[0];
      const mainSequence = doc.sequences.filter(s => s.id === doc.mainSequence.id)[0];
      const treeGraft = mainSequence.blocks[0].bg[0].payload;
      const treeSequence = doc.sequences.filter(s => s.id === treeGraft)[0];
      const treeContentGraft = treeSequence.blocks[0].bg[0].payload;
      const treeContentSequence = doc.sequences.filter(s => s.id === treeContentGraft)[0];
      t.equal(treeSequence.type, 'tree');
      t.equal(treeSequence.blocks.length, 7);
      t.equal(treeSequence.blocks[0].bs.payload, 'tTreeNode/0');
      const nodeChildren = treeSequence.blocks[0].is.filter(s => s.payload.startsWith('tTreeChild')).map(s => s.payload);
      t.equal(nodeChildren.length, 2);
      const nodeParent = treeSequence.blocks[0].is.filter(s => s.payload.startsWith('tTreeParent')).map(s => s.payload);
      t.equal(nodeParent.length, 1);
      t.equal(nodeParent[0], 'tTreeParent/none');
      const nodeName = treeSequence.blocks[0].is.filter(s => s.payload.startsWith('tTreeContent/name')).map(s => s.payload);
      t.equal(nodeName.length, 1);
      const [ssT, ssName, ssBlock, ssStart, ssLength] = nodeName[0].split('/');
      t.equal(treeContentSequence.type, 'treeContent');
      t.equal(treeContentSequence.blocks.length, 7);
      const nameContent = treeContentSequence.blocks[parseInt(ssBlock)].tokens.slice(parseInt(ssStart), parseInt(ssStart) + parseInt(ssLength));
      t.equal(nameContent.length, 3);
      t.equal(nameContent.map(t => t.payload).join(''), 'Fred Smith');
    } catch (err) {
      console.log(err);
    }
  },
);
