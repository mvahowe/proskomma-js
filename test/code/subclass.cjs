const test = require('tape');
const { Proskomma } = require('../../dist');

const testGroup = 'Subclass test';

test(
  `Creating a subclass from lib (${testGroup})`,
  function (t) {
    try {
      t.plan(1);
      t.doesNotThrow(() => {
        class SubClassProskomma extends Proskomma {
          constructor() {
            super();
            this.test = 'test';
          }
        }
        const sbClass = new SubClassProskomma();
        sbClass.test = 'othertest';
      });
    } catch (err) {
      console.log(err);
    }
  },
);