const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');
const itemType = require('./item');

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: obj => obj.c.length},
        bsByteLength: {type: GraphQLInt, resolve: obj => obj.bs.length},
        bgByteLength: {type: GraphQLInt, resolve: obj => obj.bg.length},
        cItems: {type: GraphQLList(itemType)},
        bsItems: {type: GraphQLList(itemType)},
        bgItems: {type: GraphQLList(itemType)}
    })
})

module.exports = blockType;
