const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString} = require('graphql');

const succinctBlockType = new GraphQLObjectType({
    name: "SuccinctBlock",
    fields: () => ({
        cBL: {type: GraphQLInt, resolve: root => root.c.length},
        bgBL: {type: GraphQLInt, resolve: root => root.bg.length},
        osBL: {type: GraphQLInt, resolve: root => root.os.length},
        isBL: {type: GraphQLInt, resolve: root => root.is.length},
        cL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.c)
        },
        bgL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.bg)
        },
        osL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.os)
        },
        isL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.is)
        },
    })
})

module.exports = succinctBlockType;
