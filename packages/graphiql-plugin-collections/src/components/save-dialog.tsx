import { FC, useState } from 'react';
import { Dialog } from '@graphiql/react';
import { useCollectionsStore, collectionsStore } from '../store';

type SaveDialogProps = {
  open: boolean;
  onClose(): void;
  initialQuery: string;
  initialVariables?: string;
  initialHeaders?: string;
  initialName: string;
};

export const SaveDialog: FC<SaveDialogProps> = ({
  open,
  onClose,
  initialQuery,
  initialVariables = '',
  initialHeaders = '',
  initialName,
}) => {
  const collections = useCollectionsStore(s => s.collections);
  const [name, setName] = useState(initialName);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('__new__');
  const [newCollectionName, setNewCollectionName] = useState('New Collection');

  const handleSave = () => {
    const { actions } = collectionsStore.getState();
    let collectionId = selectedCollectionId;
    if (selectedCollectionId === '__new__') {
      const c = actions.createCollection(newCollectionName);
      collectionId = c.id;
    }
    actions.addItem(collectionId, {
      name: name || 'Unnamed operation',
      query: initialQuery,
      variables: initialVariables,
      headers: initialHeaders,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Title>Save to collection</Dialog.Title>
      <div className="graphiql-save-dialog-form">
        <label>
          <span>Operation name</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Unnamed operation"
            className="graphiql-save-dialog-input"
          />
        </label>
        <label>
          <span>Collection</span>
          <select
            value={selectedCollectionId}
            onChange={e => setSelectedCollectionId(e.target.value)}
            className="graphiql-save-dialog-select"
          >
            <option value="__new__">+ New collection</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {selectedCollectionId === '__new__' && (
          <label>
            <span>Collection name</span>
            <input
              type="text"
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="graphiql-save-dialog-input"
            />
          </label>
        )}
      </div>
      <div className="graphiql-save-dialog-actions">
        <button type="button" onClick={onClose} className="graphiql-save-dialog-cancel">
          Cancel
        </button>
        <button type="button" onClick={handleSave} className="graphiql-save-dialog-save">
          Save
        </button>
      </div>
      <Dialog.Close />
    </Dialog>
  );
};
