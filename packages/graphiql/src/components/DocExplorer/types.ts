import { MouseEvent } from 'react';
import {
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLType,
  GraphQLNamedType,
} from 'graphql';
import { ExplorerFieldDef } from '@graphiql/react';

export type OnClickFieldFunction = (
  field: ExplorerFieldDef,
  type?:
    | GraphQLObjectType
    | GraphQLInterfaceType
    | GraphQLInputObjectType
    | GraphQLType,
  event?: MouseEvent,
) => void;

export type OnClickTypeFunction = (
  type: GraphQLNamedType,
  event?: MouseEvent<HTMLAnchorElement>,
) => void;

export type OnClickFieldOrTypeFunction =
  | OnClickFieldFunction
  | OnClickTypeFunction;
