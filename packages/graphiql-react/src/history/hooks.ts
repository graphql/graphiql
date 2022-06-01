import { QueryStoreItem } from '@graphiql/toolkit';
import { useEditorContext } from '../editor';

export function useSelectHistoryItem() {
  const { headerEditor, queryEditor, variableEditor } = useEditorContext({
    nonNull: true,
    caller: useSelectHistoryItem,
  });
  return (item: QueryStoreItem) => {
    queryEditor?.setValue(item.query ?? '');
    variableEditor?.setValue(item.variables ?? '');
    headerEditor?.setValue(item.headers ?? '');
  };
}
