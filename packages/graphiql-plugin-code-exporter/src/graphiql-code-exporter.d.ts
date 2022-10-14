declare module 'graphiql-code-exporter' {
  import { ComponentType } from 'react';
  import {
    GraphQLSchema,
    OperationTypeNode,
    OperationDefinitionNode,
    FragmentDefinitionNode,
  } from 'graphql';

  type OperationData = {
    query: string;
    name: string;
    displayName: string;
    type: OperationTypeNode | 'fragment';
    variableName: string;
    variables: Record<string, any>;
    operationDefinition: OperationDefinitionNode | FragmentDefinitionNode;
    fragmentDependencies: Array<FragmentDefinitionNode>;
  };

  type GenerateOptions = {
    serverUrl: string;
    headers: Record<string, string>;
    context: Record<string, any>;
    operationDataList: Array<OperationData>;
    options: Record<string, boolean>;
  };

  type Snippet = {
    language: string;
    codeMirrorMode: string;
    name: string;
    options: Array<{
      id: string;
      label: string;
      initial: boolean;
    }>;
    generate: (options: GenerateOptions) => string;
  };

  export type GraphiQLCodeExporterProps = {
    query: string;
    snippets: Array<Snippet>;
    codeMirrorTheme?: string;
    variables?: string;
    context?: Record<string, any>;
    schema?: GraphQLSchema | null | undefined;
  };

  const GraphiQLCodeExporter: ComponentType<GraphiQLCodeExporterProps>;

  export default GraphiQLCodeExporter;
}
