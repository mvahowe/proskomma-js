const {GraphQLInputObjectType, GraphQLString, GraphQLNonNull} = require('graphql');

const inputKeyValueType = new GraphQLInputObjectType({
    name: "InputKeyValue",
    fields: () => ({
        key: {
            type: GraphQLNonNull(GraphQLString)
        },
        value: {
            type: GraphQLNonNull(GraphQLString)
        }
    })
})

module.exports = inputKeyValueType;
