const {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLInt, GraphQLList} = require('graphql');

const tokenType = new GraphQLObjectType({
    name: "Token",
    fields: () => ({
        itemType: {type: GraphQLNonNull(GraphQLString), resolve: root => root[0]},
        subType: {type: GraphQLNonNull(GraphQLString), resolve: root => root[1]},
        chars: {type: GraphQLNonNull(GraphQLString), resolve: root => root[2]},
        position: {type: GraphQLInt, resolve: root => root[3]},
        scopes: {type: GraphQLList(GraphQLNonNull(GraphQLString)), resolve: root => root[4]},
        dump: {type: GraphQLNonNull(GraphQLString), resolve: (root) => `${root[1]} '${root[2]}'`}
    })
})

module.exports = tokenType;
