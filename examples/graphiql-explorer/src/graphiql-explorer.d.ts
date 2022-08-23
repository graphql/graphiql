declare module 'graphiql-explorer' {
  import { GraphQLEnumType, GraphQLScalarType, ValueNode } from 'graphql';
  import { ComponentType } from 'react';

  const GraphiQLExplorer: ComponentType<any> & {
    defaultValue: (arg: GraphQLEnumType | GraphQLScalarType) => ValueNode;
  };

  export default GraphiQLExplorer;
}
