const xre = require('xregexp');

const validateTags = tags => {
    for (const tag of tags) {
        if (!xre.exec(tag, /^[a-z][a-z0-9]*(:.+)?$/)) {
            throw new Error(`Tag '${tag}' is not valid (should be [a-z][a-z0-9]*(:.+)?)`);
        }
    }
}

module.exports = validateTags;

