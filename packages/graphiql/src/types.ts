export namespace GraphiQL {
  import { GraphQLType } from 'graphql';

  export type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
}
