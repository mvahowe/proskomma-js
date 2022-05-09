const rehashMutationsSchemaString = `
  """Explicitly rebuild the text lookup tables for a docSet. (You probably don't need to do this)"""
  rehashDocSet(
    """The id of the docSet"""
    docSetId: String!
  ): Boolean!
`;

const rehashMutationsResolvers = {
  rehashDocSet: (root, args) =>
    root.rehashDocSet(args.docSetId),
};

export {
  rehashMutationsSchemaString,
  rehashMutationsResolvers,
};
