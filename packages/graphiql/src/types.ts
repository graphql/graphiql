import { GraphQLType } from 'graphql';

export namespace GraphiQL {
  export type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
}
