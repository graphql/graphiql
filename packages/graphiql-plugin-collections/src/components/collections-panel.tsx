import { FC, useEffect, useState } from 'react';
import { PanelHeader, useGraphiQLActions } from '@graphiql/react';
import { useCollectionsStore, collectionsStore } from '../store';
import { CollectionRow } from './collection-row';
import { SaveDialog } from './save-dialog';
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    void actions.init(storage ?? localStorageAdapter);
    // storage is intentionally only read on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { addTab, updateActiveTabValues } = useGraphiQLActions();

  const handleOpen = (item: CollectionItem) => {
    addTab();
    updateActiveTabValues({
      query: item.query,
      variables: item.variables ?? '',
      headers: item.headers ?? '',
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
      <SaveDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        initialQuery=""
        initialName="Unnamed operation"
      />
      <ImportExportDialog
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
      />
    </div>
  );
};
