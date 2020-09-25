const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');
const documentType = require('./document');

const docSetType = new GraphQLObjectType({
    name: "DocSet",
    fields: () => ({
        id: {type: GraphQLString},
        lang: {type: GraphQLString},
        abbr: {type: GraphQLString},
        documents: {type: GraphQLList(documentType)}
    })
})



module.exports = docSetType;

