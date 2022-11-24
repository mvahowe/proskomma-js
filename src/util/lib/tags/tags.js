import xre from 'xregexp';

const validateTags = tags => {
  for (const tag of tags) {
    validateTag(tag);
  }
};

const validateTag = tag => {
  if (!xre.exec(tag, /^[a-z][A-za-z0-9]*(:.+)?$/)) {
    throw new Error(`Tag '${tag}' is not valid (should be [a-z][A-za-z0-9]*(:.+)?)`);
  }
};

const addTag = (tags, tag) => {
  validateTag(tag);
  tags.add(tag);
};

const removeTag = (tags, tag) => {
  validateTag(tag);
  tags.delete(tag);
};

export {
  validateTags, validateTag, addTag, removeTag,
};

