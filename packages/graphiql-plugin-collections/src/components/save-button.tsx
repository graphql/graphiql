import { FC, useState } from 'react';
import { useGraphiQL } from '@graphiql/react';
import CollectionsIcon from '../icons/collections.svg?react';
import { SaveDialog } from './save-dialog';

function deriveOperationName(query: string): string {
  const match = /(?:query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(query);
  return match?.[1] ?? 'Unnamed operation';
}

export const CollectionsSaveButton: FC = () => {
  const [open, setOpen] = useState(false);
  const { query, variables, headers } = useGraphiQL(s => {
    const tab = s.tabs[s.activeTabIndex];
    return {
      query: tab?.query ?? '',
      variables: tab?.variables ?? '',
      headers: tab?.headers ?? '',
    };
  });

  return (
    <>
      <button
        type="button"
        className="graphiql-tab-strip-action"
        onClick={() => setOpen(true)}
        aria-label="Save to collection"
        title="Save to collection"
      >
        <CollectionsIcon aria-hidden="true" className="graphiql-toolbar-icon" />
      </button>
      <SaveDialog
        open={open}
        onClose={() => setOpen(false)}
        initialQuery={query}
        initialVariables={variables ?? ''}
        initialHeaders={headers ?? ''}
        initialName={deriveOperationName(query)}
      />
    </>
  );
};
