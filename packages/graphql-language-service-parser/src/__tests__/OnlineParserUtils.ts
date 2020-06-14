/* eslint-disable jest/expect-expect, jest/no-export */
import onlineParser from '../onlineParser';
import CharacterStream from '../CharacterStream';

const tokenTypeMap = {
  Number: 'number',
  String: 'string',
  Boolean: 'builtin',
  Null: 'keyword',
  Enum: 'string-2',
};

const typesMap = {
  ID: { value: `"1"`, kind: 'StringValue', valueType: 'String' },
  Int: { value: '1', kind: 'NumberValue', valueType: 'Number' },
  Float: { value: '1.0', kind: 'NumberValue', valueType: 'Number' },
  String: { value: `"abc"`, kind: 'StringValue', valueType: 'String' },
  Boolean: { value: 'true', kind: 'BooleanValue', valueType: 'Boolean' },
  Enum: { value: 'ADMIN', kind: 'EnumValue', valueType: 'Enum' },
};

export const getUtils = source => {
  const parser = onlineParser();
  const stream = new CharacterStream(source);
  const state = parser.startState();

  const token = (_stream = stream, _state = state) =>
    parser.token(_stream, _state);

  const t = {
    token({ pattern, type, kind = state.kind, eatSpace = true }, fn = token) {
      if (eatSpace) {
        stream.eatSpace();
      }

      expect(Boolean(stream.match(pattern, false))).toEqual(true);
      expect(fn()).toEqual(type);
      expect(state.kind).toEqual(kind);
    },
    keyword(pattern, options = {}) {
      this.token({ pattern, type: 'keyword', kind: options.kind });
    },
    name(pattern, options = {}) {
      this.token({ pattern, type: 'atom', kind: options.kind });
    },
    property(pattern, options = {}) {
      this.token({ pattern, type: 'property', kind: options.kind });
    },
    meta(pattern, options = {}) {
      this.token({ pattern, type: 'meta', kind: options.kind });
    },
    punctuation(pattern, options = {}) {
      this.token({ pattern, type: 'punctuation', kind: options.kind });
    },
    attribute(pattern, options = {}) {
      this.token({ pattern, type: 'attribute', kind: options.kind });
    },
    value(kind, pattern, options = {}) {
      this.token({ pattern, type: tokenTypeMap[kind], kind: options.kind });
    },
    eol(eatSpace = true) {
      if (eatSpace) {
        stream.eatSpace();
      }

      expect(stream.eol()).toEqual(true);
    },
  };

  return { parser, token, stream, state, t };
};

export const performForEachType = (source, test) => {
  Object.keys(typesMap).map(type => {
    const { value, kind, valueType } = typesMap[type];
    const utils = getUtils(
      source.replace(/__VALUE__/g, value).replace(/__TYPE__/g, type),
    );

    test(utils, { type, value, kind, valueType });
  });
};
