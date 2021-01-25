const { Item } = require('./item');

const Graft = class extends Item {

  constructor(graftType, seqId) {
    super('graft');
    this.graftType = graftType;
    this.seqId = seqId;
  }

};

module.exports = { Graft };
