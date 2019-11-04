
declare module 'graphiql' {
  import React from 'react'
  import { GraphQLSchema } from 'graphql'
  export interface GraphiQL extends React.Component<GraphiQLProps, GraphiQLState>{}

  export interface GraphiQLProps {
    fetcher?: (props: {
      query: string,
      operationName: string,
    }) => Promise<any>,
    schema?: GraphQLSchema,
    query?: string,
    variables?: string,
    operationName?: string,
    response?: string,
    storage: {
      getItem: (name: string) => any,
      setItem: (name: string, item: any) => void,
      removeItem: (name: string) => void,
    },
    defaultQuery?: string,
    defaultVariableEditorOpen?: boolean,
    onCopyQuery?: Function,
    onEditQuery?: Function,
    onEditVariables?: Function,
    onEditOperationName?: Function,
    onToggleDocs?: Function,
    getDefaultFieldNames?: Function,
    editorTheme?: string,
    onToggleHistory?: Function,
    ResultsTooltip?: any,
    readOnly?: boolean,
    docExplorerOpen?: boolean,
  }
  export interface GraphiQLState {
    schema?: GraphQLSchema,
    response?: string,
    query?: string
  }
  type RenderGraphiQLConfig = {
    /**
     * the url if no fetcher is provided
     */
    url: string
    /**
     * the headers if no fetcher is provided
     */
    headers: string
    containerId?: string
    containerEl?: HTMLElement
  } & GraphiQLProps
  export function renderGraphiQL(config: RenderGraphiQLConfig): Promise<void>
}

