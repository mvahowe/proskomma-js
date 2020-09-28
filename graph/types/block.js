const {GraphQLObjectType, GraphQLInt, GraphQLList} = require('graphql');
const itemType = require('./item');

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: root => root.c.length},
        bsByteLength: {type: GraphQLInt, resolve: root => root.bs.length},
        bgByteLength: {type: GraphQLInt, resolve: root => root.bg.length},
        osByteLength: {type: GraphQLInt, resolve: root => root.os.length},
        c: {type: GraphQLList(itemType), resolve: root => root.c},
        bs: {type: GraphQLList(itemType)},
        bg: {type: GraphQLList(itemType)},
        os: {type: GraphQLList(itemType)}
    })
})

module.exports = blockType;
