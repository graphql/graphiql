import { FC, useEffect, useRef, useState } from 'react';
import {
  PanelHeader,
  pick,
  useGraphiQL,
  useGraphiQLActions,
} from '@graphiql/react';
import { useCollectionsStore, collectionsStore } from '../store';
import { CollectionRow } from './collection-row';
import { ImportExportDialog } from './import-export-dialog';
import { localStorageAdapter } from '../storage/local-storage';
import type { CollectionItem, CollectionsStorage } from '../types';

type CollectionsPanelProps = {
  storage?: CollectionsStorage;
};

export const CollectionsPanel: FC<CollectionsPanelProps> = ({ storage }) => {
  const actions = useCollectionsStore(s => s.actions);
  const collections = useCollectionsStore(s => s.collections);
  const loaded = useCollectionsStore(s => s.loaded);
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    void actions.init(storage ?? localStorageAdapter);
    // storage is intentionally only read on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { addTab, updateActiveTabValues } = useGraphiQLActions();
  const { queryEditor, variableEditor, headerEditor } = useGraphiQL(
    pick('queryEditor', 'variableEditor', 'headerEditor'),
  );
  const activeTabId = useGraphiQL(s => s.tabs[s.activeTabIndex]?.id);

  // Opening an item creates a tab, then links it once the new tab is active so
  // ⌘S updates the saved item in place rather than reopening the dialog.
  const pendingLink = useRef<{ collectionId: string; itemId: string } | null>(
    null,
  );
  useEffect(() => {
    const link = pendingLink.current;
    if (link && activeTabId) {
      actions.linkTab(activeTabId, link.collectionId, link.itemId);
      pendingLink.current = null;
    }
  }, [activeTabId, actions]);

  const handleOpen = (item: CollectionItem) => {
    const collectionId = collections.find(c =>
      c.items.some(i => i.id === item.id),
    )?.id;
    if (collectionId) {
      pendingLink.current = { collectionId, itemId: item.id };
    }
    addTab();
    // `addTab` resets the editors to the new empty tab, so populate them with
    // the saved operation. The editors' change handlers sync this back to tab
    // state; `updateActiveTabValues` covers the case where an editor isn't
    // mounted yet. Seed `lastSavedQuery` too so the freshly opened tab matches
    // its saved item and doesn't show as dirty.
    queryEditor?.setValue(item.query ?? '');
    variableEditor?.setValue(item.variables ?? '');
    headerEditor?.setValue(item.headers ?? '');
    updateActiveTabValues({
      query: item.query,
      variables: item.variables ?? '',
      headers: item.headers ?? '',
      lastSavedQuery: item.query ?? null,
    });
  };

  const handleRename = actions.renameCollection;
  const handleDelete = actions.deleteCollection;
  const handleDeleteItem = actions.deleteItem;
  const handleMoveItem = actions.moveItem;
  const handleAddItem = actions.addItem;

  return (
    <div className="graphiql-collections-panel">
      <PanelHeader
        title="Collections"
        actions={
          <>
            <button
              type="button"
              className="graphiql-collections-action"
              onClick={() =>
                collectionsStore
                  .getState()
                  .actions.createCollection('New Collection')
              }
              aria-label="New collection"
              title="New collection"
            >
              + New
            </button>
            <button
              type="button"
              className="graphiql-collections-action"
              onClick={() => setShowImportExport(true)}
              aria-label="Import / Export"
              title="Import / Export"
            >
              ↑↓
            </button>
          </>
        }
      />
      {!loaded && <div className="graphiql-collections-loading">Loading…</div>}
      {loaded && collections.length === 0 && (
        <div className="graphiql-collections-empty">
          No collections yet. Save an operation to get started.
        </div>
      )}
      <div className="graphiql-collections-list">
        {collections.map(collection => (
          <CollectionRow
            key={collection.id}
            collection={collection}
            allCollections={collections}
            onRename={handleRename}
            onDelete={handleDelete}
            onOpenItem={handleOpen}
            onDeleteItem={handleDeleteItem}
            onMoveItem={handleMoveItem}
            onAddItem={handleAddItem}
          />
        ))}
      </div>
      <ImportExportDialog
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
      />
    </div>
  );
};
