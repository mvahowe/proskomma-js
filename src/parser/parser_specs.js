const {
  labelForScope,
  generateId,
} = require('proskomma-utils');
const { constructorForFragment } = require('./lexers/object_for_fragment');

const buildSpecLookup = specs => {
  const ret = {};

  for (const spec of specs) {
    for (const context of spec.contexts) {
      if (!(context[0] in ret)) {
        ret[context[0]] = {};
      }

      const accessor = context[1];

      if (!accessor) {
        ret[context[0]]._noAccessor = spec.parser;
      } else {
        if (!(accessor in ret[context[0]])) {
          ret[context[0]][accessor] = {};
        }

        for (const accessorValue of context[2]) {
          ret[context[0]][accessor][accessorValue] = spec.parser;
        }
      }
    }
  }
  return ret;
};

const specs = (pt) => [
  {
    // HEADERS - make temp sequence, then add to headers object
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'id',
          'usfm',
          'ide',
          'sts',
          'h',
          'toc',
          'toca',
        ],
      ],
    ],
    parser: {
      baseSequenceType: 'header',
      forceNewSequence: true,
      newBlock: true,
      useTempSequence: true,
      newScopes: [
        {
          label: pt => pt.fullTagName,
          endedBy: ['baseSequenceChange'],
          onEnd: (parser, label) => {
            parser.headers[label] = parser.current.sequence.plainText();

            if (label === 'id') {
              if (
                parser.headers[label].length === 3 ||
                (
                  parser.headers[label].length > 3 &&
                  parser.headers[label].substring(3, 4) === ' '
                )
              ) {
                const bookCode = parser.headers[label].substring(0, 3);
                parser.headers['bookCode'] = bookCode;
              }
            }
          },
        },
      ],
    },
  },
  {
    // HEADINGS - Start new sequence
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'ms',
          'mr',
          's',
          'sr',
          'r',
          'qa',
          'sp',
          'sd',
        ].concat(pt.customTags.heading),
      ],
    ],
    parser: {
      baseSequenceType: 'heading',
      forceNewSequence: true,
      newBlock: true,
      newScopes: [],
    },
  },
  {
    // TITLE - make a sequence or add to existing one
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'mt',
        ],
      ],
    ],
    parser: {
      baseSequenceType: 'title',
      newBlock: true,
      newScopes: [],
    },
  },
  {
    // END TITLE - make a sequence or add to existing one
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'mte',
        ],
      ],
    ],
    parser: {
      baseSequenceType: 'endTitle',
      newBlock: true,
      newScopes: [],
    },
  },
  {
    // INTRODUCTION - make a sequence or add to existing one
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'imt',
          'is',
          'ip',
          'ipi',
          'im',
          'imi',
          'ipq',
          'imq',
          'ipr',
          'iq',
          'ib',
          'ili',
          'iot',
          'io',
          'iex',
          'imte',
        ].concat(pt.customTags.intro),
      ],
    ],
    parser: {
      baseSequenceType: 'introduction',
      newBlock: true,
      newScopes: [],
    },
  },
  {
    // START SIDEBAR - make a new sequence
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'esb',
        ],
      ],
    ],
    parser: {
      baseSequenceType: 'sidebar',
      newBlock: true,
      newScopes: [],
      after: (parser) => {
        parser.mainLike = parser.current.sequence;
      },
    },
  },
  {
    // END SIDEBAR - return to main
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'esbe',
        ],
      ],
    ],
    parser: {
      baseSequenceType: 'main',
      newBlock: true,
      newScopes: [],
      after: (parser) => {
        parser.mainLike = parser.sequences.main;
      },
    },
  },
  {
    // CAT - graft label and add stub scope, then remove graft and modify scope at tidy stage
    contexts: [
      [
        'startTag',
        'tagName',
        ['cat'],
      ],
    ],
    parser: {
      inlineSequenceType: 'esbCat',
      forceNewSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('inline', [pt.fullTagName]),
          endedBy: ['endTag/cat', 'endBlock', 'implicitEnd'],
          onEnd: (parser) => parser.returnToBaseSequence(),
        },
      ],
      during: (parser, pt) => {
        const scopeId = generateId();
        const esbScope = {
          label: () => labelForScope('esbCat', [scopeId]),
          endedBy: ['startTag/esbe'],
        };
        parser.openNewScope(pt, esbScope, true, parser.mainLike);
      },
    },
  },
  {
    // REMARK - make new sequence
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'rem',
        ],
      ],
    ],
    parser: {
      baseSequenceType: 'remark',
      forceNewSequence: true,
      newScopes: [],
    },
  },
  {
    // PARAGRAPH STYLES - Make new block on main
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'cd',
          'p',
          'm',
          'po',
          'pr',
          'cls',
          'pmo',
          'pm',
          'pmc',
          'pmr',
          'pi',
          'mi',
          'nb',
          'pc',
          'ph',
          'b',
          'q',
          'qr',
          'qc',
          'qa',
          'qm',
          'qd',
          'lh',
          'li',
          'lf',
          'lim',
          'd',
          'zlexorth',
          'zlexbrief',
          'zlexfull',
        ].concat(pt.customTags.paragraph),
      ],
    ],
    parser: {
      baseSequenceType: 'mainLike',
      newBlock: true,
      newScopes: [],
    },
  },
  {
    // ROW - Make new block
    contexts: [
      [
        'startTag',
        'tagName',
        ['tr'],
      ],
    ],
    parser: {
      baseSequenceType: 'mainLike',
      newBlock: true,
      newScopes: [],
    },
  },
  {
    // FOOTNOTE/ENDNOTE - new inline sequence
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'f',
          'fe',
        ],
      ],
    ],
    parser: {
      inlineSequenceType: 'footnote',
      forceNewSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('inline', [pt.fullTagName]),
          endedBy: ['endTag/f', 'endTag/fe', 'endBlock'],
          onEnd: (parser) => parser.returnToBaseSequence(),
        },
      ],
    },
  },
  {
    // CROSS REFERENCE - make new inline sequence
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'x',
        ],
      ],
    ],
    parser: {
      inlineSequenceType: 'xref',
      forceNewSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('inline', [pt.fullTagName]),
          endedBy: ['endTag/x', 'endBlock'],
          onEnd: (parser) => parser.returnToBaseSequence(),
        },
      ],
    },
  },
  {
    // FIGURE - new inline sequence
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'fig',
        ],
      ],
    ],
    parser: {
      inlineSequenceType: 'fig',
      forceNewSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('spanWithAtts', [pt.tagName]),
          endedBy: ['endBlock', 'endTag/$tagName$'],
          onEnd: (parser) => parser.clearAttributeContext(),
        },
      ],
      during: (parser, pt) => {
        parser.setAttributeContext(labelForScope('spanWithAtts', [pt.tagName]));
      },
    },
  },
  {
    // CHAPTER - chapter scope
    contexts: [['chapter']],
    parser: {
      mainSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('chapter', [pt.number]),
          endedBy: ['chapter'],
        },
      ],
    },
  },
  {
    // CP - graft label and add stub scope, then remove graft and modify scope at tidy stage
    contexts: [['pubchapter']],
    parser: {
      mainSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('pubChapter', [pt.numberString]),
          endedBy: ['pubchapter', 'chapter'],
        },
      ],
    },
  },
  {
    // CA - graft label and add stub scope, then remove graft and modify scope at tidy stage
    contexts: [
      [
        'startTag',
        'tagName',
        ['ca'],
      ],
    ],
    parser: {
      inlineSequenceType: 'altNumber',
      forceNewSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('inline', [pt.fullTagName]),
          endedBy: ['endTag/ca', 'endBlock', 'implicitEnd'],
          onEnd: (parser) => parser.returnToBaseSequence(),
        },
      ],
      during: (parser, pt) => {
        const scopeId = generateId();
        const caScope = {
          label: () => labelForScope('altChapter', [scopeId]),
          endedBy: ['startTag/ca', 'chapter'],
        };
        parser.openNewScope(pt, caScope, true, parser.sequences.main);
      },
    },
  },
  {
    // VERSES - verse and verses scopes
    contexts: [
      ['verses'],
    ],
    parser: {
      mainSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('verses', [pt.numberString]),
          endedBy: ['verses', 'chapter', 'pubchapter'],
        },
      ],
      during: (parser, pt) => {
        pt.numbers.forEach(n => {
          const verseScope = {
            label: () => labelForScope('verse', [n]),
            endedBy: ['verses', 'chapter', 'pubchapter'],
          };
          parser.openNewScope(pt, verseScope, true, parser.sequences.main);
        },
        );
      },
    },
  },
  {
    // VP - graft label and add stub scope, then remove graft and modify scope at tidy stage
    contexts: [
      [
        'startTag',
        'tagName',
        ['vp'],
      ],
    ],
    parser: {
      inlineSequenceType: 'pubNumber',
      forceNewSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('inline', [pt.fullTagName]),
          endedBy: ['endTag/vp', 'endBlock', 'implicitEnd'],
          onEnd: (parser) => parser.returnToBaseSequence(),
        },
      ],
      during: (parser, pt) => {
        const scopeId = generateId();
        const vpScope = {
          label: () => labelForScope('pubVerse', [scopeId]),
          endedBy: ['startTag/vp', 'verses', 'chapter', 'pubchapter'],
        };
        parser.openNewScope(pt, vpScope, true, parser.sequences.main);
      },
    },
  },
  {
    // VA - graft label and add stub scope, then remove graft and modify scope at tidy stage
    contexts: [
      [
        'startTag',
        'tagName',
        ['va'],
      ],
    ],
    parser: {
      inlineSequenceType: 'altNumber',
      forceNewSequence: true,
      newScopes: [
        {
          label: pt => labelForScope('inline', [pt.fullTagName]),
          endedBy: ['endTag/va', 'endBlock', 'implicitEnd'],
          onEnd: (parser) => parser.returnToBaseSequence(),
        },
      ],
      during: (parser, pt) => {
        const scopeId = generateId();
        const vpScope = {
          label: () => labelForScope('altVerse', [scopeId]),
          endedBy: ['startTag/va', 'verses', 'chapter', 'pubchapter'],
        };
        parser.openNewScope(pt, vpScope, true, parser.sequences.main);
      },
    },
  },
  {
    // CHARACTER MARKUP - add scope
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'qs',
          'qac',
          'litl',
          'lik',
          'liv',
          'fr',
          'fq',
          'fqa',
          'fk',
          'fl',
          'fw',
          'fp',
          'fv',
          'ft',
          'fdc',
          'fm',
          'xo',
          'xk',
          'xq',
          'xt',
          'xta',
          'xop',
          'xot',
          'xnt',
          'xdc',
          'rq',
          'add',
          'bk',
          'dc',
          'k',
          'nd',
          'ord',
          'pn',
          'png',
          'qt',
          'sig',
          'sls',
          'tl',
          'wj',
          'em',
          'bd',
          'it',
          'bdit',
          'no',
          'sc',
          'sup',
          'ior',
          'iqt',
        ].concat(pt.customTags.char),
      ],
    ],
    parser: {
      newScopes: [
        {
          label: pt => labelForScope('span', [pt.fullTagName]),
          endedBy: ['endBlock', 'endTag/$fullTagName$', 'implicitEnd'],
        },
      ],
    },
  },
  {
    // CELL - unpick tagName, add scope
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'th',
          'thr',
          'tc',
          'tcr',
        ],
      ],
    ],
    parser: {
      newScopes: [
        {
          label: pt => labelForScope('cell', [pt.fullTagName]),
          endedBy: [
            'startTag/th',
            'startTag/thr',
            'startTag/tc',
            'startTag/tcr',
            'startTag/th2',
            'startTag/thr2',
            'startTag/tc2',
            'startTag/tcr2',
            'startTag/th3',
            'startTag/thr3',
            'startTag/tc3',
            'startTag/tcr3',
            'endBlock',
            'endTag/$fullTagName$',
          ],
        },
      ],
    },
  },
  {
    // EMPTY MILESTONE - add open and close scope
    contexts: [
      ['emptyMilestone'],
    ],
    parser: { during: (parser, pt) => parser.addEmptyMilestone(labelForScope('milestone', [pt.tagName])) },
  },
  {
    // START MILESTONE - open scope, set attribute context
    contexts: [
      ['startMilestoneTag', 'sOrE', 's'],
    ],
    parser: {
      newScopes: [
        {
          label: pt => labelForScope('milestone', [pt.tagName]),
          endedBy: ['endMilestone/$tagName$'],
        },
      ],
      during: (parser, pt) => {
        parser.setAttributeContext(labelForScope('milestone', [pt.tagName]));
      },
    },
  },
  {
    // END MILESTONE - close scope, clear attribute context
    contexts: [
      ['endMilestoneMarker'],
    ],
    parser: { during: (parser) => parser.clearAttributeContext() },
  },
  {
    // ATTRIBUTE - open scope based on attribute context
    contexts: [
      ['attribute'],
      ['defaultAttribute'],
    ],
    parser: {
      during: (parser, pt) => {
        const defaults = {
          w: 'lemma',
          rb: 'gloss',
          xt: 'link-href',
        };

        if (parser.current.attributeContext) {
          const contextParts = parser.current.attributeContext.split('/');

          if ((pt.key === 'default') && (contextParts.length === 2)) {
            pt.key = defaults[contextParts[1]] || `unknownDefault_${contextParts[1]}`;
            pt.printValue = pt.printValue.replace(/default/, pt.key);
          }
          [...pt.values.entries()].forEach(na => {
            const attScope = {
              label: pt => labelForScope('attribute', [parser.current.attributeContext, pt.key, na[0], na[1]]),
              endedBy: [`$attributeContext$`],
            };
            parser.openNewScope(pt, attScope);
          },
          );
        } else {
          parser.addToken(constructorForFragment.printable('unknown', [pt.printValue]));
        }
      },
    },
  },
  {
    // WORD-LEVEL MARKUP - open scope and set attribute context
    contexts: [
      [
        'startTag',
        'tagName',
        [
          'w',
          'rb',
          // 'xt',
        ].concat(pt.customTags.word),
      ],
    ],
    parser: {
      newScopes: [
        {
          label: pt => labelForScope('spanWithAtts', [pt.tagName]),
          endedBy: ['endBlock', 'endTag/$tagName$'],
          onEnd: (parser) => parser.clearAttributeContext(),
        },
      ],
      during: (parser, pt) => {
        parser.setAttributeContext(labelForScope('spanWithAtts', [pt.tagName]));
      },
    },
  },
  {
    // TOKEN - add a token!
    contexts: [
      ['wordLike'],
      ['lineSpace'],
      ['punctuation'],
      ['eol'],
    ],
    parser: { during: (parser, pt) => parser.addToken(pt) },
  },
  {
    // NO BREAK SPACE - make a token!
    contexts: [
      ['noBreakSpace'],
    ],
    parser: {
      during: (parser) => {
        parser.addToken(constructorForFragment.printable('lineSpace', ['\xa0']));
      },
    },
  },
  {
    // SOFT LINE BREAK - make a token!
    contexts: [
      ['softLineBreak'],
    ],
    parser: {
      during: (parser) => {
        parser.addToken(constructorForFragment.printable('softLineBreak', ['//']));
      },
    },
  },
  {
    // BARESLASH - make a token!
    contexts: [
      ['bareSlash'],
    ],
    parser: {
      during: (parser) => {
        parser.addToken(constructorForFragment.printable('bareSlash', ['\\']));
      },
    },
  },
  {
    // UNKNOWN - make a token!
    contexts: [
      ['unknown'],
    ],
    parser: {
      during: (parser, pt) => {
        parser.addToken(constructorForFragment.printable('unknown', [pt.printValue]));
      },
    },
  },
];

module.exports = { specs, buildSpecLookup };
