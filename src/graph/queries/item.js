const { GraphQLUnionType } = require('graphql');
const tokenType = require('./token');
const graftType = require('./graft');
const scopeType = require('./scope');

const itemType = new GraphQLUnionType({
  name: 'Item',
  types: [tokenType, graftType, scopeType],
  resolveType: value => {
    if (value[0] === 'token') {
      return tokenType;
    }
    if (value[0] === 'graft') {
      return graftType;
    }
    if (value[0] === 'startScope' || value[0] === 'endScope') {
      return scopeType;
    }
  },
});

module.exports = itemType;
