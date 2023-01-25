declare module 'graphiql-batch-request' {
  import { ComponentType } from 'react';
  import { DocumentNode, OperationDefinitionNode } from 'graphql/language';

  type TabWithOperations = {
    id: string,
    document: DocumentNode,
    operations: OperationDefinitionNode[],
    variables: Record<string, any>,
    headers: Record<string, string>
  }

  export type TabsWithOperations = Record<string, TabWithOperations>;

  export type GraphiQLBatchRequestProps = {
    url: string,
    useAllOperations?: boolean
  }

  const GraphiQLBatchRequest: ComponentType<GraphiQLBatchRequestProps>;

  export default GraphiQLBatchRequest;
}
