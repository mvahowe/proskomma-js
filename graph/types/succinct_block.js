const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString} = require('graphql');

const succinctBlockType = new GraphQLObjectType({
    name: "SuccinctBlock",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: root => root.c.length},
        bgByteLength: {type: GraphQLInt, resolve: root => root.bg.length},
        osByteLength: {type: GraphQLInt, resolve: root => root.os.length},
        isByteLength: {type: GraphQLInt, resolve: root => root.is.length}
    })
})

module.exports = succinctBlockType;
