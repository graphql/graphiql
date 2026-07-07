import { FC } from 'react';
import { Button, Dialog } from '@graphiql/react';
import { collectionsStore } from '../store';

type ExportDialogProps = {
  open: boolean;
  onClose(): void;
};

export const ExportDialog: FC<ExportDialogProps> = ({ open, onClose }) => {
  const exported = open
    ? collectionsStore.getState().actions.exportCollections()
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
    } catch {
      // clipboard unavailable; leave the dialog open so the textarea stays
      // selectable as a fallback.
      return;
    }
    onClose();
  };

  const handleDownload = () => {
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphiql-collections.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Header>Export collections</Dialog.Header>
      <Dialog.Body>
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
              onClick={() => void handleCopy()}
            >
              Copy JSON
            </Button>
            <Button type="button" onClick={handleDownload}>
              Download JSON
            </Button>
          </div>
        </div>
      </Dialog.Body>
    </Dialog>
  );
};
