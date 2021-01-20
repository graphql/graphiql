import type { DocumentNode, IntrospectionQuery } from 'graphql';

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

// These type just taken from https://github.com/ReactiveX/rxjs/blob/master/src/internal/types.ts#L41
export type Unsubscribable = {
  unsubscribe: () => void;
};

export type FetcherParams = {
  query: string;
  operationName: string;
  variables?: any;
};

export type FetcherOpts = {
  headers?: { [key: string]: any };
  shouldPersistHeaders: boolean;
  documentAST?: DocumentNode;
};

export type FetcherResult =
  | {
      data: IntrospectionQuery;
    }
  | string
  | { data: any };

export type MaybePromise<T> = T | Promise<T>;

export type SyncFetcherResult =
  | FetcherResult
  | Observable<FetcherResult>
  | AsyncIterable<FetcherResult>;

export type FetcherReturnType = MaybePromise<SyncFetcherResult>;

export type Fetcher = (
  graphQLParams: FetcherParams,
  opts?: FetcherOpts,
) => FetcherReturnType;
