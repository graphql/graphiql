import { FC, useRef, useState } from 'react';
import { Button, Dialog } from '@graphiql/react';
import { collectionsStore } from '../store';

type ImportDialogProps = {
  open: boolean;
  onClose(): void;
  onImport(text: string, mode: 'merge' | 'replace'): void;
  /** Hide the "Replace" import option (force merge) when false. */
  allowReplace?: boolean;
};

export const ImportDialog: FC<ImportDialogProps> = ({
  open,
  onClose,
  onImport,
  allowReplace = true,
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } catch {
        setImportError(
          'Invalid JSON file. Please select a valid collections export.',
        );
        return;
      }
      const analysis = collectionsStore.getState().actions.analyzeImport(text);
      if (!analysis.ok) {
        setImportError('This file isn’t a valid collections export.');
        return;
      }
      onImport(text, allowReplace ? importMode : 'merge');
      onClose();
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Header>Import collections</Dialog.Header>
      <Dialog.Body>
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
                checked={!allowReplace || importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              Merge (add new, update changed in place)
            </label>
            {allowReplace && (
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
            )}
          </fieldset>
          {importError && (
            <p className="graphiql-import-export-error">{importError}</p>
          )}
          <Button type="button" variant="primary" onClick={handleImport}>
            Import
          </Button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
};
