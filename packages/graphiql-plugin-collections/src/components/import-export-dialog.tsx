import { FC, useRef, useState } from 'react';
import { Button, Dialog } from '@graphiql/react';
import { collectionsStore } from '../store';

type ImportExportDialogProps = {
  open: boolean;
  onClose(): void;
};

export const ImportExportDialog: FC<ImportExportDialogProps> = ({
  open,
  onClose,
}) => {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exported = collectionsStore.getState().actions.exportCollections();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; the textarea is still selectable as a fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphiql-collections.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setImportError('Please select a file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      try {
        JSON.parse(text);
        const analysis = collectionsStore
          .getState()
          .actions.analyzeImport(text);
        collectionsStore
          .getState()
          .actions.applyImport(
            analysis,
            importMode === 'replace'
              ? { mode: 'replace' }
              : { mode: 'merge', applyChanges: true },
          );
        onClose();
      } catch {
        setImportError(
          'Invalid JSON file. Please select a valid collections export.',
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Header>Import / Export Collections</Dialog.Header>
      <Dialog.Body>
        <div className="graphiql-import-export-tabs">
          <button
            type="button"
            className={`graphiql-import-export-tab${mode === 'export' ? ' active' : ''}`}
            onClick={() => setMode('export')}
          >
            Export
          </button>
          <button
            type="button"
            className={`graphiql-import-export-tab${mode === 'import' ? ' active' : ''}`}
            onClick={() => setMode('import')}
          >
            Import
          </button>
        </div>
        {mode === 'export' && (
          <div className="graphiql-import-export-section">
            <textarea
              readOnly
              className="graphiql-import-export-textarea"
              value={exported}
              rows={12}
            />
            <div className="graphiql-import-export-actions">
              <Button
                type="button"
                variant="primary"
                state={copied ? 'success' : undefined}
                onClick={() => void handleCopy()}
              >
                {copied ? 'Copied!' : 'Copy JSON'}
              </Button>
              <Button type="button" onClick={handleDownload}>
                Download JSON
              </Button>
            </div>
          </div>
        )}
        {mode === 'import' && (
          <div className="graphiql-import-export-section">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={() => setImportError(null)}
            />
            <fieldset className="graphiql-import-export-mode">
              <legend>Import mode</legend>
              <label>
                <input
                  type="radio"
                  name="import-mode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                />
                Merge (append new collections, skip duplicates)
              </label>
              <label>
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                Replace (remove all existing collections)
              </label>
            </fieldset>
            {importError && (
              <p className="graphiql-import-export-error">{importError}</p>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={handleImport}
              className="graphiql-import-export-action"
            >
              Import
            </Button>
          </div>
        )}
      </Dialog.Body>
    </Dialog>
  );
};
