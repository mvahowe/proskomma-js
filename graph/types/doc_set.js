const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');
const packageJson = require('../../package.json');

const docSetType = new GraphQLObjectType({
    name: "DocSet",
    fields: () => ({
        id: {type: GraphQLString}
    })
})



module.exports = docSetType;

