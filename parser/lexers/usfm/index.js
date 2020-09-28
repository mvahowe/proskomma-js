const xre = require('xregexp');

const { lexingRegexes, mainRegex } = require('../lexingRegexes');
const { preTokenClassForFragment } = require("../class_for_fragment");

const lexifyUsfm = (str) => {
    return xre.match(str, mainRegex, "all").map(f => preTokenClassForFragment(f, lexingRegexes));
}

module.exports = { lexifyUsfm };