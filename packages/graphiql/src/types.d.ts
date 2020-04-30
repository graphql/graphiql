import { GraphQLType } from 'graphql';

export namespace GraphiQL {
  export type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
  export type Maybe<T> = T | null | undefined;
}
