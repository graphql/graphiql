import { MouseEvent } from 'react';
import {
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLType,
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
