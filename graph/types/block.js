const {GraphQLObjectType, GraphQLInt, GraphQLList} = require('graphql');
const itemType = require('./item');

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: root => root.c.length},
        bsByteLength: {type: GraphQLInt, resolve: root => root.bs.length},
        bgByteLength: {type: GraphQLInt, resolve: root => root.bg.length},
        osByteLength: {type: GraphQLInt, resolve: root => root.os.length},
        cItems: {type: GraphQLList(itemType)}, // root, args, CONTEXT for docSet
        bsItems: {type: GraphQLList(itemType)},
        bgItems: {type: GraphQLList(itemType)},
        osItems: {type: GraphQLList(itemType)}
    })
})

module.exports = blockType;
