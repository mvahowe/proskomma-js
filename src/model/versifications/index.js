/* eslint-disable no-unused-vars */
import engText from './eng_vrs';
import lxxText from './lxx_vrs';
import orgText from './org_vrs';
import rscText from './rsc_vrs';
import rsoText from './rso_vrs';
import vulText from './vul_vrs';

const exports = {
  eng: { raw: engText },
  lxx: { raw: lxxText },
  org: { raw: orgText },
  rsc: { raw: rscText },
  rso: { raw: rsoText },
  vul: { raw: vulText },
};

const cvRegex = /^([A-Z0-9]{3}) (([0-9]+:[0-9]+) ?)*$/;

for (const [vrsName, vrsRecord] of Object.entries(exports)) {
  vrsRecord.cv = {};
  const lineMatches = vrsRecord.raw.split('\n').filter(l => l.match(cvRegex));

  if (!lineMatches) {
    continue;
  }

  for (const line of lineMatches) {
    const cvBook = line.slice(0,3);
    vrsRecord.cv[cvBook] = {};

    for (const cvString of line.substr(4).split(' ')) {
      const [c, v] = cvString.split(':');
      vrsRecord.cv[cvBook][c] = v;
    }
  }
}

export default exports;
