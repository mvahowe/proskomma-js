const { Item } = require('./item');

const Token = class extends Item {

  constructor(pt) {
    super(pt.subclass);
    this.chars = pt.printValue;
  }

};

module.exports = { Token };
