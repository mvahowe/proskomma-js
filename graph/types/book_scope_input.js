const {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList} = require('graphql');

const bookScopeType = new GraphQLObjectType({
    name: "BookScope",
    fields: () => ({
        book: {type: GraphQLNonNull(GraphQLString)},
        cvs: {type: GraphQLNonNull(GraphQLList(GraphQLString))},
    })
})

module.exports = bookScopeType;
