import xre from 'xregexp';

const validateTags = tags => {
    for (const tag of tags) {
        validateTag(tag);
    }
}

const validateTag = tag => {
    if (!xre.exec(tag, /^[a-z][a-z0-9]*(:.+)?$/)) {
        throw new Error(`Tag '${tag}' is not valid (should be [a-z][a-z0-9]*(:.+)?)`);
    }
}

const addTag = (tags, tag) => {
    validateTag(tag);
    tags.add(tag);
}

module.exports = { validateTags, validateTag, addTag };

