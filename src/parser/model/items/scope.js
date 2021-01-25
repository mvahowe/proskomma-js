const { Item } = require('./item');

const Scope = class extends Item {
  constructor(sOrE, label) {
    super(`${sOrE}Scope`);
    this.label = label;
  }
};

module.exports = { Scope };
