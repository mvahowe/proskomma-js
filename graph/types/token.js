const {GraphQLObjectType, GraphQLString} = require('graphql');

const tokenType = new GraphQLObjectType({
    name: "Token",
    fields: () => ({
        subType: {type: GraphQLString, resolve: obj => obj[1]},
        chars: {type: GraphQLString, resolve: obj => obj[2]}
    })
})

module.exports = tokenType;
