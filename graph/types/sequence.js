const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const blockType = require('./block');

const sequenceType = new GraphQLObjectType({
    name: "Sequence",
    fields: () => ({
        id: {type: GraphQLString},
        type: {type: GraphQLString},
        blocks: {type: GraphQLList(blockType)}
    })
})

module.exports = sequenceType;
