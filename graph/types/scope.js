const {GraphQLObjectType, GraphQLString} = require('graphql');

const scopeType = new GraphQLObjectType({
    name: "Scope",
    fields: () => ({
        itemType: {type: GraphQLString, resolve: root => root[0]},
        label: {type: GraphQLString, resolve: root => root[1]},
        dump: {type: GraphQLString, resolve: (root) => `${root[0]} ${root[1]}`}
    })
})

module.exports = scopeType;
