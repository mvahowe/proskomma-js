const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: obj => obj.c.length},
        bsByteLength: {type: GraphQLInt, resolve: obj => obj.bs.length},
        bgByteLength: {type: GraphQLInt, resolve: obj => obj.bg.length}
    })
})

module.exports = blockType;
