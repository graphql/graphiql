/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import getQueryFacts from '../../utility/getQueryFacts';
import useSchema from './useSchema';
import useOperation from './useOperation';

export default function useQueryFacts() {
  const schema = useSchema();
  const { text } = useOperation();
  return useMemo(() => (schema ? getQueryFacts(schema, text) : null), [
    schema,
    text,
  ]);
}
