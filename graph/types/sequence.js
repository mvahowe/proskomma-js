const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const blockType = require('./block');

const sequenceType = new GraphQLObjectType({
    name: "Sequence",
    fields: () => ({
        id: {type: GraphQLString},
        type: {type: GraphQLString},
        nBlocks: {type: GraphQLInt, resolve: root => root.blocks.length},
        blocks: {
            type: GraphQLList(blockType),
            resolve:
                (root, args, context) => root.blocks.map(b => context.docSet.unsuccinctifyBlock(b, {}))
        }
    })
})

module.exports = sequenceType;
