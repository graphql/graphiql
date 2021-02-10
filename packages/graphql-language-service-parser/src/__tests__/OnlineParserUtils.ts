/* eslint-disable jest/expect-expect, jest/no-export */
import OnlineParser from '../onlineParser';
import CharacterStream from '../CharacterStream';
import { RuleKind } from '../types';

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
  Null: { value: 'null', kind: 'NullValue', valueType: 'Null' },
};

type TokenAssertArgs = {
  pattern: string;
  kind?: RuleKind;
  type: RuleKind;
  eatSpace: boolean;
};

type SimpleRules =
  | 'keyword'
  | 'name'
  | 'property'
  | 'qualifier'
  | 'variable'
  | 'meta'
  | 'def'
  | 'punctuation'
  | 'attribute';

type SimpleRuleAssertOptions = {
  kind?: RuleKind | string;
};

type SimpleRule = (
  pattern: string | RegExp,
  options?: SimpleRuleAssertOptions,
) => void;

type IAssertRules = {
  [name in SimpleRules]: SimpleRule;
} & {
  token: (args: TokenAssertArgs) => void;
  value: (
    kind: RuleKind | string,
    pattern: string,
    options?: { kind?: RuleKind | string },
  ) => void;
  eol: (eatSpace?: boolean) => void;
};

type Utils = { t: IAssertRules; stream?: CharacterStream };

type Args = { name?: string; onKind?: RuleKind; args?: any[]; vars?: any[] };

export const getUtils = (source: string) => {
  const parser = OnlineParser();
  const stream = new CharacterStream(source);
  const state = parser.startState();

  const token = (_stream = stream, _state = state) =>
    parser.token(_stream, _state);

  const t: IAssertRules = {
    token(
      { pattern, type, kind = state.kind, eatSpace = true }: TokenAssertArgs,
      fn = token,
    ) {
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
    qualifier(pattern, options = {}) {
      this.token({ pattern, type: 'qualifier', kind: options.kind });
    },
    variable(pattern, options = {}) {
      this.token({ pattern, type: 'variable', kind: options.kind });
    },
    meta(pattern, options = {}) {
      this.token({ pattern, type: 'meta', kind: options.kind });
    },
    def(pattern, options = {}) {
      this.token({ pattern, type: 'def', kind: options.kind });
    },
    punctuation(pattern, options = {}) {
      this.token({ pattern, type: 'punctuation', kind: options.kind });
    },
    attribute(pattern, options = {}) {
      this.token({ pattern, type: 'attribute', kind: options.kind });
    },
    value(kind, pattern, options) {
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
    test(utils, { type, value, kind, valueType }); // eslint-disable-line
  });
};

export const expectVarsDef = (
  { t, stream }: Utils,
  { onKind, vars = [] }: Args,
) => {
  t.punctuation(/\(/, { kind: 'VariableDefinitions' });

  vars.forEach(variable => {
    t.variable('$', { kind: 'Variable' });
    t.variable(variable.name);
    t.punctuation(':', { kind: 'VariableDefinition' });
    t.name(variable.type, { kind: 'NamedType' });

    stream.eatWhile(/(,|\s)/);
  });

  t.punctuation(/\)/, { kind: onKind });
};

export const expectArgs = (
  { t, stream }: Utils,
  { onKind, args = [] }: Args,
) => {
  t.punctuation(/\(/, { kind: 'Arguments' });

  args.forEach(arg => {
    t.attribute(arg.name, { kind: 'Argument' });
    t.punctuation(':');
    if (arg.isVariable) {
      t.variable('$', { kind: 'Variable' });
      t.variable(arg.value);
    } else {
      if (arg.isList) {
        t.punctuation(/\[/, { kind: 'ListValue' });
      }
      t.value(arg.valueType, arg.value, { kind: arg.kind });
      if (arg.isList) {
        t.punctuation(/\]/, { kind: 'Arguments' });
      }
    }

    stream.eatWhile(/(,|\s)/);
  });

  t.punctuation(/\)/, { kind: onKind });
};

export const expectDirective = (
  utils: Utils,
  { name, onKind, args = [] }: Args,
) => {
  const { t, stream } = utils;
  t.meta('@', { kind: 'Directive' });
  t.meta(name);

  if (args.length) {
    expectArgs(utils, { onKind, args });
  }
};
