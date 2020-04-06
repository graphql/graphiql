import { OperationDefinitionNode } from 'graphql';
import { QueryFacts } from '../utility/getQueryFacts';

export type FetcherParams = {
  query: string;
  operationName?: string;
  variables?: string;
};

export type FetcherResult = string;

export type Fetcher = (
  graphQLParams: FetcherParams,
  schemaConfig: SchemaConfig,
) => Promise<FetcherResult> | Observable<FetcherResult>;

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

export type File = {
  uri: string;
  text?: string;
  json?: JSON;
  formattedText?: string;
};

export type GraphQLParams = {
  query: string;
  variables?: string;
  operationName?: string;
};

export type SchemaConfig = {
  uri: string;
  assumeValid?: boolean;
};

export type EditorContexts = 'operation' | 'variables' | 'results';

export type SessionState = {
  sessionId: number;
  operation: File;
  variables: File;
  results: File;
  operationLoading: boolean;
  operationErrors: Error[] | null;
  editors: { [key in EditorContexts]: CodeMirror.Editor };
  // diagnostics?: IMarkerData[];
  currentTabs?: { [pane: string]: number }; // maybe this could live in another context for each "pane"? within session context
  operations: OperationDefinitionNode[];
  subscription?: Unsubscribable | null;
  operationName?: string; // current operation name
};
