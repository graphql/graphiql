/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { getIntrospectionQuery } from 'graphql';

export const introspectionQuery = getIntrospectionQuery({
  schemaDescription: true,
});

export const staticName = 'IntrospectionQuery';

export const introspectionQueryName = staticName;

// Some GraphQL services do not support subscriptions and fail an introspection
// query which includes the `subscriptionType` field as the stock introspection
// query does. This backup query removes that field.
export const introspectionQuerySansSubscriptions = introspectionQuery.replace(
  'subscriptionType { name }',
  '',
);
