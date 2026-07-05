import { FC, useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  PanelHeader,
  pick,
  useGraphiQL,
  useGraphiQLActions,
} from '@graphiql/react';
import { useCollectionsStore, collectionsStore } from '../store';
import { CollectionRow } from './collection-row';
import { ImportDialog } from './import-dialog';
import { ExportDialog } from './export-dialog';
import { ConflictDialog } from './conflict-dialog';
import DownloadIcon from '../icons/download.svg?react';
import UploadIcon from '../icons/upload.svg?react';
import type {
  CollectionItem,
  ImportAnalysis,
  ImportResolution,
} from '../types';

type CollectionsPanelProps = {
  /** Capability flags; all default on. See `CollectionsConfig`. */
  readOnly?: boolean;
  allowImportExport?: boolean;
  allowReplace?: boolean;
  allowCopy?: boolean;
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

/** Derive a human-readable label from the parsed incoming collections. */
function deriveSourceLabel(incoming: ImportAnalysis['_incoming']): string {
  if (incoming.length === 1 && incoming[0]) {
    return incoming[0].name;
  }
  return `${incoming.length} collections`;
}

export const CollectionsPanel: FC<CollectionsPanelProps> = ({
  readOnly = false,
  allowImportExport = true,
  allowReplace = true,
  allowCopy = true,
}) => {
  // Importing is a write; it's available only when both writes and the
  // import/export feature are enabled.
  const allowImport = !readOnly && allowImportExport;
  const actions = useCollectionsStore(s => s.actions);
  const collections = useCollectionsStore(s => s.collections);
  const loaded = useCollectionsStore(s => s.loaded);
  const [openDialog, setOpenDialog] = useState<'import' | 'export' | null>(
    null,
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pendingConflict, setPendingConflict] = useState<{
    analysis: ImportAnalysis;
    sourceLabel: string;
  } | null>(null);
  // Text awaiting replace confirmation (destructive, so we prompt before applying).
  const [pendingReplace, setPendingReplace] = useState<string | null>(null);

  // Clear the import feedback after a few seconds.
  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const applyReplace = (text: string) => {
    const analysis = collectionsStore.getState().actions.analyzeImport(text);
    collectionsStore
      .getState()
      .actions.applyImport(analysis, { mode: 'replace' });
    const count = analysis._incoming.length;
    setStatus({
      ok: true,
      message: `Replaced with ${count} collection${count === 1 ? '' : 's'}.`,
    });
  };

  const runImport = (text: string, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setPendingReplace(text);
      return;
    }

    // merge path
    const count = parseCollectionsExport(text);
    if (count === null) {
      setStatus({
        ok: false,
        message: "That file isn't a collections export.",
      });
      return;
    }
    const analysis = collectionsStore.getState().actions.analyzeImport(text);
    if (!analysis.ok) {
      setStatus({ ok: false, message: 'Invalid collections export.' });
      return;
    }
    if (analysis.changedItems.length === 0) {
      // No conflicts — apply immediately.
      collectionsStore
        .getState()
        .actions.applyImport(analysis, { mode: 'merge', applyChanges: true });
      setStatus({
        ok: true,
        message: `Imported ${count} collection${count === 1 ? '' : 's'}.`,
      });
      return;
    }
    // Conflicts present — open the dialog.
    setPendingConflict({
      analysis,
      sourceLabel: deriveSourceLabel(analysis._incoming),
    });
  };

  const handleConflictResolve = (resolution: ImportResolution) => {
    if (!pendingConflict) {
      return;
    }
    const { analysis } = pendingConflict;
    collectionsStore.getState().actions.applyImport(analysis, resolution);
    setPendingConflict(null);
    const newCount = analysis.newItems.length;
    const changedCount =
      'changedItemIds' in resolution
        ? resolution.changedItemIds.size
        : 'applyChanges' in resolution && resolution.applyChanges
          ? analysis.changedItems.length
          : 0;
    const parts = [
      analysis.newCollections.length > 0 &&
        `${analysis.newCollections.length} new collection${analysis.newCollections.length !== 1 ? 's' : ''}`,
      newCount > 0 && `${newCount} new operation${newCount !== 1 ? 's' : ''}`,
      changedCount > 0 &&
        `${changedCount} operation${changedCount !== 1 ? 's' : ''} updated`,
    ].filter(Boolean);
    setStatus({
      ok: true,
      message:
        parts.length > 0
          ? `Imported: ${parts.join(', ')}.`
          : 'Import complete.',
    });
  };

  const importDroppedFile = async (file: File) => {
    const text = await file.text();
    if (parseCollectionsExport(text) === null) {
      setStatus({
        ok: false,
        message: "That file isn't a collections export.",
      });
      return;
    }
    runImport(text, 'merge');
  };

  // Keep a live ref so the once-bound paste listener honors current config.
  const allowImportRef = useRef(allowImport);
  allowImportRef.current = allowImport;

  // Paste a collections export anywhere in the open panel to merge it in.
  // Guarded so it never hijacks a normal paste: ignored while typing in an
  // editor/input, ignored unless the clipboard parses as an export, and
  // ignored entirely when importing is disabled.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (!allowImportRef.current) {
        return;
      }
      if (isEditableTarget(document.activeElement)) {
        return;
      }
      const text = event.clipboardData?.getData('text') ?? '';
      if (parseCollectionsExport(text) === null) {
        return;
      }
      event.preventDefault();
      runImport(text, 'merge');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
    // bound once: only stable refs (store, setStatus) are used
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { addTab, changeTab, updateActiveTabValues } = useGraphiQLActions();
  const { queryEditor, variableEditor, headerEditor } = useGraphiQL(
    pick('queryEditor', 'variableEditor', 'headerEditor'),
  );
  const tabs = useGraphiQL(s => s.tabs);
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
    // A saved operation is married to its tab. If that tab is still open, just
    // focus it rather than opening a duplicate — and leave its contents alone so
    // any in-progress edits survive. Links persist across reloads, so this holds
    // after a page refresh too.
    const { links } = collectionsStore.getState();
    const openIndex = tabs.findIndex(
      t => t.id && links[t.id]?.itemId === item.id,
    );
    if (openIndex !== -1) {
      changeTab(openIndex);
      return;
    }

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

  const handleCopyItem = async (itemId: string) => {
    const json = collectionsStore.getState().actions.exportItem(itemId);
    try {
      await navigator.clipboard.writeText(json);
      setStatus({ ok: true, message: 'Copied operation to clipboard.' });
    } catch {
      setStatus({ ok: false, message: 'Could not copy to clipboard.' });
    }
  };

  const handleRename = actions.renameCollection;
  const handleDelete = actions.deleteCollection;
  const handleDeleteItem = actions.deleteItem;
  const handleMoveItem = actions.moveItem;
  const handleAddItem = actions.addItem;
  const handleRenameItem = (
    collectionId: string,
    itemId: string,
    updates: { name: string; description: string },
  ) => {
    collectionsStore.getState().actions.updateItem(collectionId, itemId, {
      name: updates.name,
      description: updates.description || undefined,
    });
  };

  return (
    <div
      className={`graphiql-collections-panel${isDragOver ? ' graphiql-collections-drop-active' : ''}`}
      onDragOver={e => {
        if (!allowImport || !e.dataTransfer.types.includes('Files')) {
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
        if (!allowImport) {
          return;
        }
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
      />
      {(!readOnly || allowImportExport) && (
        <div className="graphiql-collections-toolbar">
          <div className="graphiql-collections-toolbar-left">
            {!readOnly && (
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
            )}
          </div>
          <div className="graphiql-collections-toolbar-right">
            {allowImport && (
              <button
                type="button"
                className="graphiql-collections-action"
                onClick={() => setOpenDialog('import')}
                aria-label="Import collections"
                title="Import collections"
              >
                <DownloadIcon />
              </button>
            )}
            {allowImportExport && (
              <button
                type="button"
                className="graphiql-collections-action"
                onClick={() => setOpenDialog('export')}
                aria-label="Export collections"
                title="Export collections"
              >
                <UploadIcon />
              </button>
            )}
          </div>
        </div>
      )}
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
          {readOnly
            ? 'No collections.'
            : allowImport
              ? 'No collections yet. Save an operation to get started, or drop or paste a collections export to import one.'
              : 'No collections yet. Save an operation to get started.'}
        </div>
      )}
      <div className="graphiql-collections-list">
        {collections.map(collection => (
          <CollectionRow
            key={collection.id}
            collection={collection}
            allCollections={collections}
            readOnly={readOnly}
            allowCopy={allowCopy}
            onRename={handleRename}
            onDelete={handleDelete}
            onCopy={id => void handleCopy(id)}
            onOpenItem={handleOpen}
            onCopyItem={id => void handleCopyItem(id)}
            onDeleteItem={handleDeleteItem}
            onMoveItem={handleMoveItem}
            onAddItem={handleAddItem}
            onRenameItem={handleRenameItem}
          />
        ))}
      </div>
      {allowImportExport && (
        <ExportDialog
          open={openDialog === 'export'}
          onClose={() => setOpenDialog(null)}
        />
      )}
      {allowImport && (
        <ImportDialog
          open={openDialog === 'import'}
          onClose={() => setOpenDialog(null)}
          onImport={runImport}
          allowReplace={allowReplace}
        />
      )}
      {pendingConflict && (
        <ConflictDialog
          analysis={pendingConflict.analysis}
          sourceLabel={pendingConflict.sourceLabel}
          open
          onClose={() => setPendingConflict(null)}
          onResolve={handleConflictResolve}
        />
      )}
      <Dialog
        open={pendingReplace !== null}
        onOpenChange={o => !o && setPendingReplace(null)}
      >
        <Dialog.Header>Replace all collections?</Dialog.Header>
        <Dialog.Body>
          <p className="graphiql-conflict-summary">
            This will remove all existing collections and replace them with the
            imported data. This cannot be undone.
          </p>
          <div className="graphiql-conflict-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const text = pendingReplace;
                setPendingReplace(null);
                if (text !== null) {
                  applyReplace(text);
                }
              }}
            >
              Replace
            </Button>
            <Button type="button" onClick={() => setPendingReplace(null)}>
              Cancel
            </Button>
          </div>
        </Dialog.Body>
      </Dialog>
    </div>
  );
};
