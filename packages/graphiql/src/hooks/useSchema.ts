import { useSchemaContext } from '../state/GraphiQLSchemaProvider';

export default function useSchema() {
  const { schema } = useSchemaContext();
  return schema;
}
