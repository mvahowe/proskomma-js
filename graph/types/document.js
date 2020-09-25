const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const sequenceType = require('./sequence');

const documentType = new GraphQLObjectType({
    name: "Document",
    fields: () => ({
        id: {type: GraphQLString},
        docSetId: {type: GraphQLString},
        mainSequence: {type: sequenceType},
        sequences: {type: GraphQLList(sequenceType)}
    })
})

module.exports = documentType;
