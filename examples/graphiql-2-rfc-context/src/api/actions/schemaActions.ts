/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { SchemaConfig } from '../../types';
import { GraphQLSchema } from 'graphql';

export enum SchemaActionTypes {
  SchemaChanged = 'SchemaChanged',
  SchemaRequested = 'SchemaRequested',
  SchemaSucceeded = 'SchemaSucceeded',
  SchemaErrored = 'SchemaErrored',
  SchemaReset = 'SchemaReset',
}

export type SchemaAction =
  | SchemaChangedAction
  | SchemaRequestedAction
  | SchemaSucceededAction
  | SchemaErroredAction
  | SchemaResetAction;

export const schemaChangedAction = (config: SchemaConfig) =>
  ({
    type: SchemaActionTypes.SchemaChanged,
    payload: config,
  } as const);

export type SchemaChangedAction = ReturnType<typeof schemaChangedAction>;

export const schemaRequestedAction = () =>
  ({
    type: SchemaActionTypes.SchemaRequested,
  } as const);

export type SchemaRequestedAction = ReturnType<typeof schemaRequestedAction>;

export const schemaSucceededAction = (schema: GraphQLSchema) =>
  ({
    type: SchemaActionTypes.SchemaSucceeded,
    payload: schema,
  } as const);

export type SchemaSucceededAction = ReturnType<typeof schemaSucceededAction>;

export const schemaErroredAction = (error: Error) =>
  ({
    type: SchemaActionTypes.SchemaErrored,
    payload: error,
  } as const);

export type SchemaErroredAction = ReturnType<typeof schemaErroredAction>;

export const schemaResetAction = () =>
  ({
    type: SchemaActionTypes.SchemaReset,
  } as const);

export type SchemaResetAction = ReturnType<typeof schemaResetAction>;
