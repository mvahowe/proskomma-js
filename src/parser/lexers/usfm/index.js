import xre from 'xregexp';

import {
  lexingRegexes,
  mainRegex,
} from '../lexingRegexes';
import { preTokenObjectForFragment } from '../object_for_fragment';

const parseUsfm = (str, parser) => {
  const matches = xre.match(str, mainRegex, 'all');

  for (let n = 0; n < matches.length; n++) {
    parser.parseItem(preTokenObjectForFragment(matches[n], lexingRegexes));
  }
};

export { parseUsfm };
