import { MouseEvent } from 'react';
import {
  GraphQLField,
  GraphQLInputField,
  GraphQLArgument,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLType,
} from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';

export type FieldType =
  | GraphQLField<{}, {}, {}>
  | GraphQLInputField
  | GraphQLArgument;

export type OnClickFieldFunction = <TSource, TContext, TArgs>(
  field: GraphQLField<TSource, TContext, TArgs> | GraphQLInputField,
  type?:
    | GraphQLObjectType
    | GraphQLInterfaceType
    | GraphQLInputObjectType
    | GraphQLType,
  event?: MouseEvent,
) => void;

export type OnClickTypeFunction = (
  type: Maybe<GraphQLType>,
  event?: MouseEvent<HTMLAnchorElement>,
) => void;
