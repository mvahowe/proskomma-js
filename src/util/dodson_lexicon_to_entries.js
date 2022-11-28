import fse from 'fs-extra';
import { tokenizeString } from '../../src/util/blocksSpec';

const itemTokens = str => tokenizeString(str).map(tr => ({
  type: 'token',
  subType: tr[1],
  payload: tr[0],
}));

const rowRecord = rowArray => ({
  'bs': {
    'type': 'scope',
    'subType': 'start',
    'payload': `kvPrimary/${rowArray[0]}`,
  },
  'bg': [],
  'os': [],
  'is': [
    {
      'type': 'scope',
      'subType': 'start',
      'payload': `kvSecondary/strong/${rowArray[1]}`,
    },
    {
      'type': 'scope',
      'subType': 'start',
      'payload': 'kvField/briefDef',
    },
    {
      'type': 'scope',
      'subType': 'start',
      'payload': 'kvField/fullDef',
    },
  ],
  'items': [
    {
      'type': 'scope',
      'subType': 'start',
      'payload': `kvSecondary/strong/${rowArray[1]}`,
    },
    {
      'type': 'scope',
      'subType': 'start',
      'payload': 'kvField/briefDef',
    },
    ...itemTokens(rowArray[2]),
    {
      'type': 'scope',
      'subType': 'end',
      'payload': 'kvField/briefDef',
    },
    {
      'type': 'scope',
      'subType': 'start',
      'payload': 'kvField/fullDef',
    },
    ...itemTokens(rowArray[3]),
    {
      'type': 'scope',
      'subType': 'end',
      'payload': 'kvField/fullDef',
    },
    {
      'type': 'scope',
      'subType': 'end',
      'payload': `kvSecondary/strong/${rowArray[1]}`,
    },
  ],
});

const lexicon_tsv = fse.readFileSync(process.argv[2])
  .toString()
  .split('\n')
  .map(row => row.split('\t'))
  .filter(row => row.length > 1);

console.log(
  JSON.stringify(
    lexicon_tsv.map(
      row => rowRecord(row),
    ),
    null,
    2,
  ),
);
