/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { useSchemaContext } from '../providers/GraphiQLSchemaProvider';

export default function useSchema() {
  const { schema } = useSchemaContext();
  return schema;
}
