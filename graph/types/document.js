const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const documentType = new GraphQLObjectType({
    name: "Document",
    fields: () => ({
        id: {type: GraphQLString}
    })
})



module.exports = documentType;
