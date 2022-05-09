const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Multiple Chapters';

const pk = pkWithDoc(
  '../test_data/usfm/1pe_webbe.usfm',
  {
    lang: 'fra',
    abbr: 'hello',
  },
  {
    includeScopes: ['chapter', 'verse/'],
    includeGrafts: [],
  })[0];

test(
  `Chapter Closing (${testGroup})`,
  async function (t) {
    try {
      const scopeRecords = [
        {
          os: [],
          is: ['chapter/1', 'verse/1'],
        },
        {
          os: [],
          is: ['chapter/2', 'verse/1', 'verse/2'],
        },
        {
          os: ['chapter/2', 'verse/2'],
          is: ['verse/3'],
        },
      ];
      t.plan(2 + (2 * scopeRecords.length) + 8);
      const query =
        '{ documents { mainSequence { blocks { os { payload } is { payload } } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.documents[0].mainSequence.blocks;
      t.equal(scopeRecords.length, blocks.length);

      for (const [n, scopeRecord] of scopeRecords.entries()) {
        for (const blockField of ['os', 'is']) {
          t.equal(blocks[n][blockField].length, scopeRecord[blockField].length);
          const blockScopes = blocks[n][blockField].map(f => f.payload);

          for (const scopeField of scopeRecord[blockField]) {
            t.ok(blockScopes.includes(scopeField));
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
);