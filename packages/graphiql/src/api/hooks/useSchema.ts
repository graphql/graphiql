import { useSchemaContext } from '../providers/GraphiQLSchemaProvider';

export default function useSchema() {
  const { schema } = useSchemaContext();
  return schema;
}
