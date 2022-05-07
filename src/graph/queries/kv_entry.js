const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const { keyValueType } = require('./key_value');
const { itemGroupType } = require('./itemGroup');

const kvEntrySchemaString = `
"""Key/Items tuple"""
type kvEntry {
    """The key"""
    key: String!
    """The secondary keys"""
    secondaryKeys: [KeyValue!]
    """The fields as itemGroups"""
    itemGroups: [ItemGroup]!
}`;

const kvEntryResolvers = {
  key: root => root[0],
  secondaryKeys: root => root[1],
  itemGroups: root => root[2],
};

const kvEntryType = new GraphQLObjectType({
  name: 'kvEntry',
  description: 'Key/Items tuple',
  fields: () => ({
    key: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The key',
      resolve: root => root[0],
    },
    secondaryKeys: {
      type: GraphQLList(GraphQLNonNull(keyValueType)),
      description: 'The secondary keys',
      resolve: root => root[1],
    },
    itemGroups: {
      type: GraphQLList(GraphQLNonNull(itemGroupType)),
      description: 'The fields as itemGroups',
      resolve: root => root[2],
    },
  }),
});

module.exports = {
  kvEntrySchemaString,
  kvEntryResolvers,
  kvEntryType,
};
