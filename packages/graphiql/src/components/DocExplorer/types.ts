import { GraphQLField, GraphQLInputField, GraphQLArgument } from 'graphql';

export type FieldType =
  | GraphQLField<{}, {}, {}>
  | GraphQLInputField
  | GraphQLArgument;
