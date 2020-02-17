/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { getIntrospectionQuery, getOperationAST, parse } from 'graphql';

export const introspectionQuery = getIntrospectionQuery();

export const staticName = 'introspectionQuery';
const operationDocument = getOperationAST(parse(introspectionQuery), null);

export const introspectionQueryName = operationDocument
  ? operationDocument.name?.value || staticName
  : staticName;

// Some GraphQL services do not support subscriptions and fail an introspection
// query which includes the `subscriptionType` field as the stock introspection
// query does. This backup query removes that field.
export const introspectionQuerySansSubscriptions = introspectionQuery.replace(
  'subscriptionType { name }',
  '',
);
