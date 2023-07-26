// cSpell:disable

import type {
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputField,
  GraphQLScalarType,
  FragmentDefinitionNode,
  SelectionNode,
  ValueNode,
} from 'graphql';

export type Field = GraphQLField<any, any>;
export type GetDefaultScalarArgValue = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
  underlyingArgType: GraphQLEnumType | GraphQLScalarType,
) => ValueNode;

export type MakeDefaultArg = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
) => boolean;

export type StyleMap = Record<string, any>;

export type Styles = {
  explorerActionsStyle: StyleMap;
  buttonStyle: StyleMap;
  actionButtonStyle: StyleMap;
};

export type Colors = {
  keyword: string;
  def: string;
  property: string;
  qualifier: string;
  attribute: string;
  number: string;
  string: string;
  builtin: string;
  string2: string;
  variable: string;
  atom: string;
};
export type StyleConfig = {
  colors: Colors;
  arrowOpen: React.ReactNode;
  arrowClosed: React.ReactNode;
  checkboxChecked: React.ReactNode;
  checkboxUnchecked: React.ReactNode;
  styles: Styles;
};

export type CommitOptions = {
  commit: boolean;
} | null;

export type Selections = ReadonlyArray<SelectionNode>;

export type AvailableFragments = { [key: string]: FragmentDefinitionNode };

export type OperationType = 'query' | 'mutation' | 'subscription' | 'fragment';
export type NewOperationType = 'query' | 'mutation' | 'subscription';
