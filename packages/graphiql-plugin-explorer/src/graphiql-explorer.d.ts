declare module 'graphiql-explorer' {
  import {
    FragmentDefinitionNode,
    GraphQLArgument,
    GraphQLField,
    GraphQLInputField,
    GraphQLLeafType,
    GraphQLObjectType,
    GraphQLSchema,
    ValueNode,
  } from 'graphql';
  import { ComponentType, ReactNode, CSSProperties } from 'react';

  export type GraphiQLExplorerProps = {
    query: string;
    width?: number;
    title?: string;
    schema?: GraphQLSchema | null;
    onEdit?(newQuery: string): void;
    getDefaultFieldNames?(type: GraphQLObjectType): string[];
    getDefaultScalarArgValue?(
      parentField: GraphQLField<any, any>,
      arg: GraphQLArgument | GraphQLInputField,
      underlyingArgType: GraphQLLeafType,
    ): ValueNode;
    makeDefaultArg?(
      parentField: GraphQLField<any, any>,
      arg: GraphQLArgument | GraphQLInputField,
    ): boolean;
    onToggleExplorer?(): void;
    explorerIsOpen?: boolean;
    onRunOperation?(name: string | null): void;
    colors?: {
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
    } | null;
    arrowOpen?: ReactNode;
    arrowClosed?: ReactNode;
    checkboxChecked?: ReactNode;
    checkboxUnchecked?: ReactNode;
    styles?: {
      explorerActionsStyle?: CSSProperties;
      buttonStyle?: CSSProperties;
      actionButtonStyle?: CSSProperties;
    } | null;
    showAttribution: boolean;
    hideActions?: boolean;
    externalFragments?: FragmentDefinitionNode[];
  };

  const GraphiQLExplorer: ComponentType<GraphiQLExplorerProps> & {
    defaultValue: (arg: GraphQLLeafType) => ValueNode;
  };

  export default GraphiQLExplorer;
}
