const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Tokens withChars';

const pk = pkWithDoc('../test_data/usfm/ugnt_3jn.usfm', {
  lang: 'grc',
  abbr: 'hello',
})[0];
const pk2 = pkWithDoc('../test_data/usfm/ult_3jn.usfm', {
  lang: 'eng',
  abbr: 'hello',
})[0];

const simplifyBlocks = blocks => {
  const ret = [];

  for (const [n, block] of blocks.entries()) {
    for (const token of block.tokens) {
      ret.push({
        chars: token.chars,
        block: n,
        position: token.position,
        lemma: token.scopes.filter(s => s.includes('lemma'))[0].split('/')[5],
        content: token.scopes.filter(s => s.includes('content'))[0].split('/')[5],
      });
    }
  }
  return ret;
};

test(
  `Find lemmas by word (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query =
        '{' +
        '  documents(withBook:"3JN") {' +
        '    mainSequence {' +
        '      blocks (withScriptureCV: "1:3") {' +
        '        tokens(' +
        '          includeContext:true' +
        '          withScriptureCV: "1:3"' +
        '          withChars: ["ἐρχομένων", "ἀδελφῶν"]' +
        '        ) {' +
        '          chars position' +
        '          scopes(startsWith:["attribute/spanWithAtts/w/lemma", "attribute/spanWithAtts/w/strong"])' +
        '        }' +
        '      }' +
        '    }' +
        '  }' +
        '}';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const foundLemma = result.data.documents[0].mainSequence.blocks[0].tokens
        .map(t => t.scopes.filter(s => s.startsWith('attribute/spanWithAtts/w/lemma/0'))[0].split('/')[5]);
      t.equal(foundLemma.length, 2);

      for (const lemma of ['ἔρχομαι', 'ἀδελφός']) {
        t.ok(foundLemma.includes(lemma));
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Find words by lemma (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const query =
        '{' +
        '  documents(withBook:"3JN") {' +
        '    mainSequence {' +
        '      blocks (withScriptureCV: "1:3") {' +
        '        tokens(' +
        '          includeContext:true' +
        '          withScopes:[' +
        '            "attribute/milestone/zaln/x-lemma/0/ἔρχομαι"' +
        '            "attribute/milestone/zaln/x-lemma/0/ἀδελφός"' +
        '          ]' +
        '          anyScope:true' +
        '        ) {' +
        '          subType chars position scopes' +
        '        }' +
        '      }' +
        '    }' +
        '  }' +
        '}';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(simplifyBlocks(result.data.documents[0].mainSequence.blocks), null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);