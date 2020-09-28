const {GraphQLObjectType, GraphQLInt, GraphQLList} = require('graphql');
const itemType = require('./item');

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: root => root.c.length},
        bgByteLength: {type: GraphQLInt, resolve: root => root.bg.length},
        osByteLength: {type: GraphQLInt, resolve: root => root.os.length},
        c: {type: GraphQLList(itemType), resolve: root => root.c},
        bs: { type: itemType},
        bg: {type: GraphQLList(itemType), resolve: root => root.bg},
        os: {type: GraphQLList(itemType), resolve: root => root.os}
    })
})

module.exports = blockType;
