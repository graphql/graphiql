export type GraphQLParams = {
  query: string;
  variables?: string;
  operationName?: string;
};

export type SchemaConfig = {
  uri: string;
  assumeValid?: boolean;
};
