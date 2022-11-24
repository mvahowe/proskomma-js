const test = require('tape');
const {utils} = require("../../../../dist/index");
const { validateTags, validateTag, addTag, removeTag } = utils.tags;

const testGroup = "Tags";

test(
    `Validate Tag (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            t.doesNotThrow(() => validateTag("foo"));
            t.throws(() => validateTag("foo!"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Validate Tags (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            t.doesNotThrow(() => validateTags(["foo", "baa"]));
            t.throws(() => validateTags(["foo", "baa!"]));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Add Tag (${testGroup})`,
    async function (t) {
        try {
            t.plan(5);
            let tags = new Set(["foo", "baa"]);
            t.doesNotThrow(() => addTag(tags,"frob"));
            t.equal(tags.size, 3);
            t.ok(tags.has("frob"));
            t.throws(() => addTag(tags, "fooie!"));
            t.equal(tags.size, 3);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Remove Tag (${testGroup})`,
    async function (t) {
        try {
            t.plan(6);
            let tags = new Set(["foo", "baa"]);
            t.doesNotThrow(() => removeTag(tags,"frob"));
            t.equal(tags.size, 2);
            t.doesNotThrow(() => removeTag(tags,"foo"));
            t.equal(tags.size, 1);
            t.throws(() => removeTag(tags, "fooie!"));
            t.equal(tags.size, 1);
        } catch (err) {
            console.log(err)
        }
    }
);
