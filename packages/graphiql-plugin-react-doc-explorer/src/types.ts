import { GraphQLArgument, GraphQLField, GraphQLInputField } from 'graphql';

export type ExplorerFieldDef =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GraphQLField<any, any, any> | GraphQLInputField | GraphQLArgument;
