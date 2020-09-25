const {GraphQLObjectType, GraphQLString} = require('graphql');

const scopeType = new GraphQLObjectType({
    name: "Scope",
    fields: () => ({
        label: {type: GraphQLString, resolve: obj => obj[1]}
    })
})

module.exports = scopeType;
