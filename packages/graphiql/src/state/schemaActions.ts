import { SchemaConfig } from './types';
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

export type SchemaChangedAction = {
  type: SchemaActionTypes.SchemaChanged;
  payload: SchemaConfig;
};

export const schemaChangedAction = (
  config: SchemaConfig,
): SchemaChangedAction => ({
  type: SchemaActionTypes.SchemaChanged,
  payload: config,
});

export type SchemaRequestedAction = {
  type: SchemaActionTypes.SchemaRequested;
};

export const schemaRequestedAction = (): SchemaRequestedAction => ({
  type: SchemaActionTypes.SchemaRequested,
});

export type SchemaSucceededAction = {
  type: SchemaActionTypes.SchemaSucceeded;
  payload: GraphQLSchema;
};

export const schemaSucceededAction = (
  schema: GraphQLSchema,
): SchemaSucceededAction => ({
  type: SchemaActionTypes.SchemaSucceeded,
  payload: schema,
});

export type SchemaErroredAction = {
  type: SchemaActionTypes.SchemaErrored;
  payload: Error;
};

export const schemaErroredAction = (error: Error): SchemaErroredAction => ({
  type: SchemaActionTypes.SchemaErrored,
  payload: error,
});

export type SchemaResetAction = {
  type: SchemaActionTypes.SchemaReset;
};

export const schemaResetAction = (): SchemaResetAction => ({
  type: SchemaActionTypes.SchemaReset,
});
