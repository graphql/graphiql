import { GraphQLType } from 'graphql';

export namespace GraphiQL {
  export type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
}

export type Maybe<T> = T | null | undefined;

export type ReactComponentLike =
  | string
  | ((props: any, context?: any) => any)
  | (new (props: any, context?: any) => any);

export type ReactElementLike = {
  type: ReactComponentLike;
  props: any;
  key: string | number | null;
};
// These type just taken from https://github.com/ReactiveX/rxjs/blob/master/src/internal/types.ts#L41
export type Unsubscribable = {
  unsubscribe: () => void;
};

export type Observable<T> = {
  subscribe(opts: {
    next: (value: T) => void;
    error: (error: any) => void;
    complete: () => void;
  }): Unsubscribable;
  subscribe(
    next: (value: T) => void,
    error: null | undefined,
    complete: () => void,
  ): Unsubscribable;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): Unsubscribable;
};

export type SchemaConfig = {
  uri: string;
  assumeValid?: boolean;
};

export type FetcherParams = {
  query: string;
  operationName?: string;
  variables?: string;
};

export type FetcherResult = string;

export type Fetcher = (
  graphQLParams: FetcherParams,
) => Promise<FetcherResult> | Observable<FetcherResult>;

export type ReactNodeLike =
  | {}
  | ReactElementLike
  | Array<ReactNodeLike>
  | string
  | number
  | boolean
  | null
  | undefined;
