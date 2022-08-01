import { parser } from './syntax.grammar';
import {
  LRLanguage,
  LanguageSupport,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  delimitedIndent,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';

const nodesWithBraces =
  'RootTypeDefinition InputFieldsDefinition EnumValuesDefinition FieldsDefinition SelectionSet';
const keywords =
  'scalar type interface union enum input implements fragment extend schema directive on repeatable';
const punctuations = '( ) { } : [ ]';
export const graphqlLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Variable: t.variableName,
        BooleanValue: t.bool,
        StringValue: t.string,
        Comment: t.lineComment,
        IntValue: t.integer,
        FloatValue: t.float,
        EnumValue: t.special(t.name),
        NullValue: t.null,
        DirectiveName: t.modifier,
        [keywords]: t.keyword,
        OperationType: t.definitionKeyword,
        FieldName: t.propertyName,
        Field: t.propertyName,
        ArgumentAttributeName: t.attributeName,
        Name: t.atom,
        '( )': t.paren,
        '{ }': t.brace,
        ',': t.separator,
        [punctuations]: t.punctuation,
      }),
      // https://codemirror.net/docs/ref/#language.indentNodeProp
      indentNodeProp.add({
        [nodesWithBraces]: delimitedIndent({ closing: '}', align: true }),
      }),
      foldNodeProp.add({
        [nodesWithBraces]: foldInside,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: '#' },
    indentOnInput: /^\s*(\{|\})$/,
  },
});

export function graphqlLanguageSupport() {
  return new LanguageSupport(graphqlLanguage);
}
