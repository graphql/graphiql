export type QueryExecutorArgs = {
  query: string;
  operationName?: string;
  variables?: unknown;
};

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [prop: string]: Json };

export type QueryExecutor = (args: QueryExecutorArgs) => Promise<Json>;
