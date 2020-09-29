const {GraphQLObjectType, GraphQLString} = require('graphql');

const keyValueType = new GraphQLObjectType({
    name: "KeyValue",
    fields: () => ({
        key: {
            type: GraphQLString,
            resolve: root => root[0]
        },
        value: {
            type: GraphQLString,
            resolve: root => root[1]
        }
    })
})

module.exports = keyValueType;
