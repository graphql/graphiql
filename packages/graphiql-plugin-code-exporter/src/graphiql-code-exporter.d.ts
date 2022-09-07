declare module 'graphiql-code-exporter' {
  import { GraphQLLeafType, ValueNode } from 'graphql';
  import { ComponentType } from 'react';

  export type GraphiQLCodeExporterProps = {
    query: string;
  };

  const GraphiQLCodeExporter: ComponentType<GraphiQLCodeExporterProps> & {
    defaultValue: (arg: GraphQLLeafType) => ValueNode;
  };

  export default GraphiQLCodeExporter;
}
