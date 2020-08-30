import { OnlineParser, OnlineParserState, TokenKind } from 'graphql/experimentalOnlineParser';
import CharacterStream from './CharacterStream';
import { isIgnored, LexRules } from './Rules';
const styles = require('./styles.json');

export interface State extends ParserState {
  name: string | null;
  type: string | null;
  prevState: State | null;
}

export default class GraphqlParser {
  config: any;

  constructor(config = {}) {
    this.config = config;
  }

  static startState = (): State => {
    const state: any = OnlineParser.startState();
    state.prevState = null;

    return state;
  };

  static copyState = (state: State): State => {
    const newState: any = OnlineParser.copyState(state);
    newState.prevState = state.prevState;

    return newState as State;
  };

  token(stream: CharacterStream, state: State): string {
    const prevState = GraphqlParser.copyState(state);

    if (stream.eatWhile(isIgnored)) {
      return 'ws';
    }

    if (stream.eol()) {
      return 'invalidchar';
    }

    const source = ((stream.match(/.*/, false) as Array<string>) || [])[0] || '';
    const parserState = OnlineParser.copyState(state);
    const parser = new OnlineParser(source, parserState, this.config);

    const token = parser.parseToken();

    if (token.kind !== 'Invalid' && token.value) {
      Object.assign(state, parserState);
      if (token.kind === TokenKind.PUNCTUATION) {
        stream.match(LexRules.Punctuation);
      } else {
        stream.match(token.value);
      }
    } else {
      stream.skipToEnd();
    }

    state.prevState = prevState;

    return styles[token.tokenName] || styles[token.ruleName] || styles[token.kind] || '';
  }
}

export type ContextToken = {
  start: number;
  end: number;
  string: string;
  state: State;
  style: string;
};

export type ContextTokenForCodeMirror = {
  start: number;
  end: number;
  string: string;
  type: string | null;
  state: State;
};

export type ContextTokenUnion = ContextToken | ContextTokenForCodeMirror;
