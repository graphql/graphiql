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

/**
 * Returns how many collections `text` holds if it is a valid collections
 * export, otherwise `null`. Used to guard paste/drop so non-collections content
 * is ignored rather than mangled.
 */
function parseCollectionsExport(text: string): number | null {
  try {
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed?.collections)
      ? parsed.collections
      : Array.isArray(parsed)
        ? parsed
        : null;
    if (
      !list?.length ||
      !list.every(
        (c: unknown) =>
          c &&
          typeof c === 'object' &&
          Array.isArray((c as { items?: unknown }).items),
      )
    ) {
      return null;
    }
    return list.length;
  } catch {
    return null;
  }
}

function isEditableTarget(el: Element | null): boolean {
  if (!el) {
    return false;
  }
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    (el as HTMLElement).isContentEditable ||
    Boolean(el.closest('.monaco-editor'))
  );
}

export const CollectionsPanel: FC<CollectionsPanelProps> = ({ storage }) => {
  const actions = useCollectionsStore(s => s.actions);
  const collections = useCollectionsStore(s => s.collections);
  const loaded = useCollectionsStore(s => s.loaded);
  const [showImportExport, setShowImportExport] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  useEffect(() => {
    void actions.init(storage ?? localStorageAdapter);
    // storage is intentionally only read on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear the import feedback after a few seconds.
  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const importText = (text: string, invalidMessage: string) => {
    const count = parseCollectionsExport(text);
    if (count === null) {
      if (invalidMessage) {
        setStatus({ ok: false, message: invalidMessage });
      }
      return;
    }
    collectionsStore.getState().actions.importCollections(text, 'merge');
    setStatus({
      ok: true,
      message: `Imported ${count} collection${count === 1 ? '' : 's'}.`,
    });
  };

  const importDroppedFile = async (file: File) => {
    importText(await file.text(), "That file isn't a collections export.");
  };

  // Paste a collections export anywhere in the open panel to merge it in.
  // Guarded so it never hijacks a normal paste: ignored while typing in an
  // editor/input, and ignored unless the clipboard parses as an export.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isEditableTarget(document.activeElement)) {
        return;
      }
      const text = event.clipboardData?.getData('text') ?? '';
      if (parseCollectionsExport(text) === null) {
        return;
      }
      event.preventDefault();
      importText(text, '');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
    // bound once: only stable refs (store, setStatus) are used
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

  const handleCopy = async (collectionId: string) => {
    const json = collectionsStore
      .getState()
      .actions.exportCollection(collectionId);
    try {
      await navigator.clipboard.writeText(json);
      setStatus({ ok: true, message: 'Copied collection to clipboard.' });
    } catch {
      setStatus({ ok: false, message: 'Could not copy to clipboard.' });
    }
  };

  const handleRename = actions.renameCollection;
  const handleDelete = actions.deleteCollection;
  const handleDeleteItem = actions.deleteItem;
  const handleMoveItem = actions.moveItem;
  const handleAddItem = actions.addItem;

  return (
    <div
      className={`graphiql-collections-panel${isDragOver ? ' graphiql-collections-drop-active' : ''}`}
      onDragOver={e => {
        if (!e.dataTransfer.types.includes('Files')) {
          return;
        }
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={e => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
          return;
        }
        setIsDragOver(false);
      }}
      onDrop={e => {
        const file = e.dataTransfer.files[0];
        if (!file) {
          return; // not a file drop (e.g. an item being reordered)
        }
        e.preventDefault();
        setIsDragOver(false);
        void importDroppedFile(file);
      }}
    >
      <PanelHeader
        title="Operation Collections"
        subtitle="Save and organize operations into collections."
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
      {status && (
        <div
          className={`graphiql-collections-status${status.ok ? '' : ' graphiql-collections-status-error'}`}
          role="status"
        >
          {status.message}
        </div>
      )}
      {!loaded && <div className="graphiql-collections-loading">Loading…</div>}
      {loaded && collections.length === 0 && (
        <div className="graphiql-collections-empty">
          No collections yet. Save an operation to get started, or drop or paste
          a collections export to import one.
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
            onCopy={id => void handleCopy(id)}
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
