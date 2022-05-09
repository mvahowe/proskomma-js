import {
  sequenceHasChars,
  sequenceHasMatchingChars,
  regexSearchTermIndexes,
  exactSearchTermIndexes,
} from '../lib/sequence_chars';

const options = {
  tokens: false,
  scopes: true,
  grafts: false,
  requiredScopes: [],
};

const blockHasAtts = (docSet, block, attSpecsArray, attValuesArray, requireAll) => {
  let matched = new Set([]);

  for (const item of docSet.unsuccinctifyPrunedItems(block, options, false)) {
    const [att, attType, element, key, count, value] = item[2].split('/');

    for (const [n, attSpecs] of attSpecsArray.entries()) {
      for (const attSpec of attSpecs) {
        if (
          attType === attSpec.attType &&
          element === attSpec.tagName &&
          key === attSpec.attKey &&
          parseInt(count) === attSpec.valueN &&
          attValuesArray[n].includes(value)
        ) {
          if (!requireAll) {
            return true;
          }
          matched.add(n);
          break;
        }
      }

      if (matched.size === attSpecsArray.length) {
        return true;
      }
    }
  }
  return false;
};

const sequenceSchemaString = `
"""A contiguous flow of content"""
type Sequence {
  """The id of the sequence"""
  id: String!
  """The type of the sequence (main, heading...)"""
  type: String!
  """The number of blocks in the sequence"""
  nBlocks: Int!
  """The blocks in the sequence"""
  blocks(
    """Only return blocks where the list of scopes is open"""
    withScopes: [String!]
    """Only return blocks whose zero-indexed position is in the list"""
    positions: [Int!]
    """Only return blocks with the specified block scope (eg 'blockScope/p'"""
    withBlockScope: String
    """Only return blocks that contain items within the specified chapter, verse or chapterVerse range"""
    withScriptureCV: String
    """Ordered list of attribute specs whose values must match those in 'attValues'"""
    attSpecs: [[AttSpec!]!]
    """Ordered list of attribute values, used in conjunction with \\'attSpecs\\'"""
    attValues: [[String!]!]
    """If true, blocks where all attSpecs match will be included"""
    allAtts: Boolean
    """Return blocks containing a token whose payload is an exact match to one of the specified strings"""
    withChars: [String!]
    """Return blocks containing a token whose payload matches the specified regexes"""
    withMatchingChars: [String!]
    """If true, blocks where all regexes match will be included"""
    allChars: Boolean
  ): [Block!]!
  """The items for each block in the sequence"""
  blocksItems: [[Item!]!]
  """The tokens for each block in the sequence"""
  blocksTokens: [[Item!]!]
  """The text for each block in the sequence"""
  blocksText(
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ): [String!]
  """The text for the sequence"""
  text(
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ) : String!
  """Sequence content grouped by scopes or milestones"""
  itemGroups(
    """Produce one itemGroup for every different match of the list of scopes"""
    byScopes: [String!]
    """Start a new itemGroup whenever a milestone in the list is encountered"""
    byMilestones: [String!]
  ) : [ItemGroup!]!
  """A list of the tags of this sequence"""
  tags: [String!]!
  """A list of the tags of this sequence as key/value tuples"""
  tagsKv: [KeyValue!]!
  """Whether or not the sequence has the specified tag"""
  hasTag(
    """The specified tag"""
    tagName: String!
  ): Boolean!
  """A list of wordLike token strings in a main sequence"""
  wordLikes(
    """Whether to coerce the strings (toLower|toUpper|none)"""
    coerceCase: String
  ) : [String!]!
  """Returns true if a main sequence contains the specified tokens"""
  hasChars(
    """Token strings to be matched exactly"""
    chars: [String!]
    """If true all tokens must match"""
    allChars: Boolean
  ): Boolean!
  """Returns true if a main sequence contains a match for specified regexes"""
  hasMatchingChars(
    """Regexes to be matched"""
    chars: [String!]
    """If true all regexes must match"""
    allChars: Boolean
  ): Boolean!
}
`;

const sequenceResolvers = {
  nBlocks: root => root.blocks.length,
  blocks: (root, args, context) => {
    context.docSet.maybeBuildEnumIndexes();

    if (args.withScopes && args.withScriptureCV) {
      throw new Error('Cannot specify both withScopes and withScriptureCV');
    }

    if (args.attSpecs && !args.attValues) {
      throw new Error('Cannot specify attSpecs without attValues');
    }

    if (!args.attSpecs && args.attValues) {
      throw new Error('Cannot specify attValues without attSpecs');
    }

    if (args.attSpecs && args.attValues && (args.attSpecs.length !== args.attValues.length)) {
      throw new Error('attSpecs and attValues must be same length');
    }

    if (args.withChars && args.withMatchingChars) {
      throw new Error('Cannot specify both withChars and withMatchingChars');
    }

    let ret = root.blocks;

    if (args.positions) {
      ret = Array.from(ret.entries()).filter(b => args.positions.includes(b[0])).map(b => b[1]);
    }

    if (args.withScopes) {
      ret = ret.filter(b => context.docSet.allScopesInBlock(b, args.withScopes));
    }

    if (args.withScriptureCV) {
      ret = context.docSet.blocksWithScriptureCV(ret, args.withScriptureCV);
    }

    if (args.attSpecs) {
      ret = ret.filter(b => blockHasAtts(context.docSet, b, args.attSpecs, args.attValues, args.allAtts || false));
    }

    if (args.withBlockScope) {
      ret = ret.filter(b => context.docSet.blockHasBlockScope(b, args.withBlockScope));
    }

    if (args.withChars) {
      if (
        root.type === 'main' &&
        !sequenceHasChars(context.docSet, root, args.withChars, args.allChars)
      ) {
        return [];
      }

      let charsIndexesArray = exactSearchTermIndexes(context.docSet, args.withChars, args.allChars);

      for (const charsIndexes of charsIndexesArray) {
        ret = ret.filter(b => context.docSet.blockHasChars(b, charsIndexes));
      }
    }

    if (args.withMatchingChars) {
      if (
        root.type === 'main' &&
        !sequenceHasMatchingChars(context.docSet, root, args.withMatchingChars, args.allChars)
      ) {
        return [];
      }

      let charsIndexesArray = regexSearchTermIndexes(context.docSet, args.withMatchingChars, args.allChars);

      for (const charsIndexes of charsIndexesArray) {
        ret = ret.filter(b => context.docSet.blockHasChars(b, charsIndexes));
      }
    }
    return ret;
  },
  blocksItems: (root, args, context) =>
    root.blocks.map(b => context.docSet.unsuccinctifyItems(b.c, {}, null)),
  blocksTokens: (root, args, context) =>
    root.blocks.map(b => context.docSet.unsuccinctifyItems(b.c, { tokens: true }, null)),
  blocksText: (root, args, context) =>
    root.blocks.map(
      b => {
        let ret = context.docSet
          .unsuccinctifyItems(b.c, { tokens: true }, null)
          .map(t => t[2])
          .join('');

        if (args.normalizeSpace) {
          ret = ret.replace(/[ \t\n\r]+/g, ' ');
        }
        return ret;
      },
    ),
  text: (root, args, context) => {
    let ret = root.blocks.map(b => context.docSet
      .unsuccinctifyItems(b.c, { tokens: true }, null)
      .map(t => t[2])
      .join(''),
    ).join('\n');

    if (args.normalizeSpace) {
      ret = ret.replace(/[ \t\n\r]+/g, ' ');
    }
    return ret;
  },
  itemGroups: (root, args, context) => {
    if (args.byScopes && args.byMilestones) {
      throw new Error('Cannot specify both byScopes and byMilestones');
    }

    if (!args.byScopes && !args.byMilestones) {
      throw new Error('Must specify either byScopes or byMilestones');
    }

    if (args.byScopes) {
      return context.docSet.sequenceItemsByScopes(
        root.blocks,
        args.byScopes,
      );
    } else {
      return context.docSet.sequenceItemsByMilestones(root.blocks, args.byMilestones);
    }
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
  wordLikes: (root, args, context) => {
    if (root.type !== 'main') {
      throw new Error(`Only available for the main sequence, not ${root.type}`);
    }

    if (args.coerceCase && !['toLower', 'toUpper', 'none'].includes(args.coerceCase)) {
      throw new Error(`coerceCase, when present, must be 'toLower', 'toUpper' or 'none', not '${args.coerceCase}'`);
    }
    context.docSet.maybeBuildEnumIndexes();
    let tokens = new Set();
    let n = 0;

    for (const b of root.tokensPresent) {
      if (b) {
        const enumOffset = context.docSet.enumIndexes['wordLike'][n];
        let tokenString = context.docSet.enums['wordLike'].countedString(enumOffset);

        if (args.coerceCase === 'toLower') {
          tokenString = tokenString.toLowerCase();
        }

        if (args.coerceCase === 'toUpper') {
          tokenString = tokenString.toUpperCase();
        }
        tokens.add(tokenString);
      }
      n++;
    }
    return Array.from(tokens).sort();
  },
  hasChars: (root, args, context) => {
    if (root.type !== 'main') {
      throw new Error(`Only available for the main sequence, not ${root.type}`);
    }

    return sequenceHasChars(context.docSet, root, args.chars, args.allChars || false);
  },
  hasMatchingChars: (root, args, context) => {
    if (root.type !== 'main') {
      throw new Error(`Only available for the main sequence, not ${root.type}`);
    }

    return sequenceHasMatchingChars(context.docSet, root, args.chars, args.allChars);
  },
};

export {
  sequenceSchemaString,
  sequenceResolvers,
};
