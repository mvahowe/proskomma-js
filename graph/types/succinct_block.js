const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString} = require('graphql');

const succinctBlockType = new GraphQLObjectType({
    name: "SuccinctBlock",
    fields: () => ({
        cBL: {type: GraphQLInt, resolve: root => root.c.length},
        bgBL: {type: GraphQLInt, resolve: root => root.bg.length},
        osBL: {type: GraphQLInt, resolve: root => root.os.length},
        isBL: {type: GraphQLInt, resolve: root => root.is.length}
    })
})

module.exports = succinctBlockType;
