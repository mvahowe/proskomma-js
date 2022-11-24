import { UsxLexer } from './usx_lexer';

const parseUsx = (str, parser) => {
  new UsxLexer().lexAndParse(str, parser);
};

export { parseUsx };
