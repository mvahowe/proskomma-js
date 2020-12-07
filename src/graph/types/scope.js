const {GraphQLObjectType, GraphQLString, GraphQLNonNull} = require('graphql');

const scopeType = new GraphQLObjectType({
    name: "Scope",
    fields: () => ({
        itemType: {type: GraphQLNonNull(GraphQLString), resolve: root => root[0]},
        label: {type: GraphQLNonNull(GraphQLString), resolve: root => root[1]},
        dump: {type: GraphQLNonNull(GraphQLString), resolve: (root) => `${root[0]} ${root[1]}`}
    })
})

module.exports = scopeType;
