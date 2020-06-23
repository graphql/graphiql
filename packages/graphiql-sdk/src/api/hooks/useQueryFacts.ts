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
