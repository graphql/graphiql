declare module 'graphiql' {
  import { GraphQLSchema, GraphQLNamedType } from 'graphql';
  import { Position } from 'graphql-language-service-types';
  import * as React from 'react';

  export type GraphQLOperationParameters = {
    variables?: JSON;
    query: string;
    operationName?: string;
  };

  export type GraphiQLProps = {
    fetcher: (params: GraphQLOperationParameters) => Promise<Response>;
    schema?: GraphQLSchema;
    query?: string;
    variables?: string;
    operationName?: string;
    response?: string;
    storage?: {
      getItem: (key: string) => any;
      setItem: (key: string, value: any) => void;
      removeItem: (key: string) => void;
    };
    defaultQuery?: string;
    defaultVariableEditorOpen?: boolean;
    onCopyQuery?: (query: string) => void;
    onEditQuery?: (query: string) => void;
    onEditVariables?: (variables: string) => void;
    onEditOperationName?: (name: string) => void;
    onToggleDocs?: (docExplorerOpen: boolean) => void;
    // Given a type, return an array of the field names that should
    // be added on tabbing out a new type. By default, it returns an array of the
    // required fields for that type
    getDefaultFieldNames?: (type: GraphQLNamedType) => string[];
    editorTheme?: string;
    onToggleHistory?: (queryHistoryOpen: boolean) => void;
    ResultsTooltip?: React.Component<{ pos: Position }>;
    readOnly?: boolean;
    docExplorerOpen?: boolean;
  };

  export class GraphiQL extends React.Component<GraphiQLProps, {}> {}

  export default GraphiQL;
}
