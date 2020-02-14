import { GraphQLType } from 'graphql';
import { ShowHintOptions as HintOptions } from 'codemirror';

export namespace GraphiQL {
  export type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
}

export namespace CodeMirror {
  export type ShowHintOptions = HintOptions & { container: HTMLElement | null };
}

export type Maybe<T> = T | null | undefined;
