const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString, GraphQLNonNull, GraphQLBoolean} = require('graphql');
const tokenType = require('./token');
const itemType = require('./item');

// [items, scopeLabels]

const itemGroupType = new GraphQLObjectType({
    name: "ItemGroup",
    fields: () => ({
        items: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType)))
        },
        tokens: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(tokenType)))
        },
        text: {
            type: GraphQLNonNull(GraphQLString)
        },
        scopeLabels: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))
        }
    })
})

module.exports = itemGroupType;
