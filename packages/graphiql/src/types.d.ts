import { ShowHintOptions as HintOptions } from 'codemirror';
import { GraphQLType } from 'graphql';
import { Options as PrintSchemaOptions } from 'graphql/utilities/printSchema';

declare namespace GraphiQL {
  export type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
}

declare namespace CodeMirror {
  export type ShowHintOptions = HintOptions & { container: HTMLElement | null };
}

declare type Maybe<T> = T | null | undefined;

declare module 'graphql/utilities/schemaPrinter' {
  export type Options = PrintSchemaOptions;
}
