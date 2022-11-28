const test = require('tape');

const testGroup = 'Standard VRS';

const { Proskomma } = require('../../src');

const pk = new Proskomma();

test(
  `versifications (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      let query = '{versifications { id } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const versifications = result.data.versifications;
      t.equal(versifications.length, 6);
      t.equal(versifications.filter(v => v.id === 'eng').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `raw vrs (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      let query = '{versification(id: "eng") { id vrs } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const versification = result.data.versification;
      t.equal(versification.id, 'eng');
      t.ok(versification.vrs.includes('English'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cvBooks (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      let query = '{versification(id: "eng") { cvBooks { bookCode } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cvBooks = result.data.versification.cvBooks;
      t.equal(cvBooks.filter(b => b.bookCode === 'TIT').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cvBook details (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      let query = '{versification(id: "eng") { cvBook(bookCode: "TIT") { bookCode chapters { chapter maxVerse } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cvBook = result.data.versification.cvBook;
      t.equal(cvBook.bookCode, 'TIT');
      t.equal(cvBook.chapters.length, 3);
      t.equal(cvBook.chapters[0].chapter, 1);
      t.equal(cvBook.chapters[0].maxVerse, 16);
    } catch (err) {
      console.log(err);
    }
  },
);
