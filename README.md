# proskomma-js
A Javascript Implementation of the Proskomma Scripture Processing Model.

# Installing and testing the code
```
npm install
npm test
npm run rawTest
TESTSCRIPT=cp_vp npm run testOne
npm run coverage
```

# Running the code
```
cd scripts
node do_graph.js ../test/test_data/usx/web_rut_1.usx example_query.txt
node do_graph.js ../test/test_data/usfm/hello.usfm example_query.txt
```

# Documentation
See the project's [ReadtheDocs](https://doc.proskomma.bible)
## Overall Structure
- docSet => bundle
- document => book document (created from USFM or USX)
- each document has >= 1 sequence
- a sequence contains flowable text
- every document has a "main" sequence with canonical content
- other sequences may contain headers, introductions, footnotes...
- sequences contain blocks (~= USFM paragraphs such as \p, \q...)
- blocks contain tokens, scopes and grafts
- tokens are printable text
- scopes are markup around tokens
- grafts are anchors for inserting another sequence
- blocks are stored in a succinct (compact but queryable) format
- queries are expressed in GraphQL
## Block items
### Tokens
#### printable
- wordLike
- lineSpace
- eol
- punctuation
#### break
- softLineBreak
- noBreakSpace
### Scopes
- most paragraph-level tags
- most character-level tags
- chapters and verses
- milestones
- attributes (denormalized)
### Grafts
- non-canonical headings
- footnotes and cross-references
- REMarks
- character-based content which adds content
## Architecture
### Lexer (USFM or USX)
Produces PreTokens for each syntactic chunk of the input.
- USFM lexer uses a monster regex
- USX uses SAX
### Parser
Iterates over lexed input to produce a hierarchy of sequences, blocks and items
### Tidier
Fixes issues that are hard to address in a streaming model such as
- leading/trailing whitespace
- inconsistent position of attributes (milestone vs \w)
- note caller character (+, -...)
### Filter
Removes markup that is not needed by the processor for the anticipated use case
- for scopes and/or grafts
- by inclusion or exclusion
### Serializer
Turns parsed content into succinct data structures
- use enums, stored at the docSet level, for strings
- reference enums using variable-length ints (1 or more byte)
- export succinct block representation as Base64
### GraphQL query API
- return app-friendly JSON, HTML and/or plain text
