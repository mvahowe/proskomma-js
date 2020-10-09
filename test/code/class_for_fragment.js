const test = require('tape');
const {preTokenClassForFragment} = require("../../parser/lexers/class_for_fragment");
const {lexingRegexes} = require("../../parser/lexers/lexingRegexes");

const testGroup = "Class for Fragment";

test(
    `Exception (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            t.throws(() => preTokenClassForFragment("", lexingRegexes));
        } catch (err) {
            console.log(err)
        }
    }
);