const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        c: {type: GraphQLString, resolve: () => "foo"}
    })
})

module.exports = blockType;
