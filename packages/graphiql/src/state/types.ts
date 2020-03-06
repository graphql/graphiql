import { OperationDefinitionNode } from 'graphql';
import { QueryFacts } from '../utility/getQueryFacts';

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
  operationErrors: string[] | null;
  editors: { [key in EditorContexts]: CodeMirror.Editor };
  // diagnostics?: IMarkerData[];
  currentTabs?: { [pane: string]: number }; // maybe this could live in another context for each "pane"? within session context
  operations: OperationDefinitionNode[];
} & QueryFacts;
