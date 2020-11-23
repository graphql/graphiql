/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { useSessionContext } from '../providers/GraphiQLSessionProvider';

export default function useOperation() {
  const { operation } = useSessionContext();
  return operation;
}
