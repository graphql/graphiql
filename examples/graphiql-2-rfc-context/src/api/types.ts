/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { OperationDefinitionNode } from 'graphql';

import { Unsubscribable } from '../types';

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

export type EditorContexts = 'operation' | 'variables' | 'results';

export type SessionState = {
  sessionId: number;
  operation: File;
  variables: File;
  results: File;
  operationLoading: boolean;
  operationErrors: Error[] | null;
  // diagnostics?: IMarkerData[];
  currentTabs?: { [pane: string]: number }; // maybe this could live in another context for each "pane"? within session context
  operations: OperationDefinitionNode[];
  subscription?: Unsubscribable | null;
  operationName?: string; // current operation name
};
