const {GraphQLObjectType, GraphQLString} = require('graphql');

const graftType = new GraphQLObjectType({
    name: "Graft",
    fields: () => ({
        type: {type: GraphQLString, resolve: root => root[1]},
        sequenceId: {type: GraphQLString, resolve: root => root[2]},
        dump: {type: GraphQLString, resolve: (root) => `${root[1]}->${root[2]}`}
    })
})

module.exports = graftType;
