import { GraphQLType } from 'graphql';

export namespace GraphiQL {
  export type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
}

export namespace CodeMirror {
  export type ShowHintOptions = { container: HTMLElement | null };
}

export type Maybe<T> = T | null | undefined;
