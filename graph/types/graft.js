const {GraphQLObjectType, GraphQLString} = require('graphql');

const graftType = new GraphQLObjectType({
    name: "Graft",
    fields: () => ({
        type: {type: GraphQLString, resolve: obj => obj[1]},
        sequenceId: {type: GraphQLString, resolve: obj => obj[2]}
    })
})

module.exports = graftType;
