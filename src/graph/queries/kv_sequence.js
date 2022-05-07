const xre = require('xregexp');

const kvSequenceSchemaString = `
"""A contiguous flow of content for key-values"""
type kvSequence {
  """The id of the sequence"""
  id: String!
  """The number of entries in the key-value sequence"""
  nEntries: Int!
  """The entries in the key-value sequence"""
  entries(
    """Only return entries whose key matches the specification"""
    keyMatches: String
    """Only return entries whose key equals one of the values in the specification"""
    keyEquals: [String!]
    """Only return entries whose secondary keys match the specification"""
    secondaryMatches: [KeyMatches!]
    """Only return entries whose secondary keys equal one of the values in the specification"""
    secondaryEquals: [KeyValues!]
    """Only return entries whose content matches the specification"""
    contentMatches: [KeyMatches!]
    """Only return entries whose content equals one of the values in the specification"""
    contentEquals: [KeyValues!]
  ): [kvEntry!]
  """A list of the tags of this sequence"""
  tags: [String!]!
  """A list of the tags of this sequence as key/value tuples"""
  tagsKv: [KeyValue!]!
  """Whether or not the sequence has the specified tag"""
  hasTag(
    """The tag name"""
    tagName: String
  ): Boolean!
}
`;

const kvSequenceResolvers = {
  nEntries: root => root.blocks.length,
  entries: (root, args, context) => {
    let ret = root.blocks.map(
      b => [
        context.docSet.unsuccinctifyScopes(b.bs)
          .map(s => s[2].split('/')[1])[0],
        context.docSet.unsuccinctifyScopes(b.is)
          .filter(s => s[2].startsWith('kvSecondary/'))
          .map(s => [s[2].split('/')[1], s[2].split('/')[2]]),
        context.docSet.sequenceItemsByScopes([b], ['kvField/'], false),
      ],
    );

    if (args.keyMatches) {
      ret = ret.filter(e => xre.test(e[0], xre(args.keyMatches)));
    }

    if (args.keyEquals) {
      ret = ret.filter(e => args.keyEquals.includes(e[0]));
    }

    if (args.secondaryMatches) {
      const matchesOb = {};
      args.secondaryMatches.forEach(sm => (matchesOb[sm.key] = sm.matches));
      ret = ret.filter(
        e => {
          const secondaryOb = {};
          e[1].forEach(st => (secondaryOb[st[0]] = st[1]));

          for (const mo of Object.entries(matchesOb)) {
            const secondaryString = secondaryOb[mo[0]];

            if (!secondaryString || !xre.test(secondaryString, xre(mo[1]))) {
              return false;
            }
          }
          return true;
        });
    }

    if (args.secondaryEquals) {
      const equalsOb = {};
      args.secondaryEquals.forEach(sm => (equalsOb[sm.key] = sm.values));
      ret = ret.filter(
        e => {
          const secondaryOb = {};
          e[1].forEach(st => (secondaryOb[st[0]] = st[1]));

          for (const mo of Object.entries(equalsOb)) {
            const secondaryString = secondaryOb[mo[0]];

            if (!secondaryString || !mo[1].includes(secondaryString)) {
              return false;
            }
          }
          return true;
        });
    }

    if (args.contentMatches) {
      const matchesOb = {};
      args.contentMatches.forEach(sm => (matchesOb[sm.key] = sm.matches));
      ret = ret.filter(
        e => {
          const contentOb = {};
          e[2].forEach(st => (contentOb[st[0].filter(s => s.startsWith('kvField'))[0].split('/')[1]] = st[1].filter(i => i[0] === 'token').map(t => t[2]).join('')));

          for (const mo of Object.entries(matchesOb)) {
            const contentString = contentOb[mo[0]];

            if (!contentString || !xre.test(contentString, xre(mo[1]))) {
              return false;
            }
          }
          return true;
        });
    }

    if (args.contentEquals) {
      const equalsOb = {};
      args.contentEquals.forEach(sm => (equalsOb[sm.key] = sm.values));
      ret = ret.filter(
        e => {
          const contentOb = {};
          e[2].forEach(st => (contentOb[st[0].filter(s => s.startsWith('kvField'))[0].split('/')[1]] = st[1].filter(i => i[0] === 'token').map(t => t[2]).join('')));

          for (const mo of Object.entries(equalsOb)) {
            const contentString = contentOb[mo[0]];

            if (!contentString || !contentString.includes(mo[1])) {
              return false;
            }
          }
          return true;
        });
    }

    return ret;
  },
  tags: root => Array.from(root.tags),
  tagsKv: root => Array.from(root.tags).map(t => {
    if (t.includes(':')) {
      return [t.substring(0, t.indexOf(':')), t.substring(t.indexOf(':') + 1)];
    } else {
      return [t, ''];
    }
  }),
  hasTag: (root, args) => root.tags.has(args.tagName),
};

module.exports = {
  kvSequenceSchemaString,
  kvSequenceResolvers,
};
