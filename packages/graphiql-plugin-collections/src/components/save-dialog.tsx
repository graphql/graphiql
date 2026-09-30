import { FC, useEffect, useState } from 'react';
import { Button, Dialog } from '@graphiql/react';
import { useCollectionsStore, collectionsStore } from '../store';

const NEW_COLLECTION = '__new__';

/**
 * The single "Save to collection" dialog. Its open state and the operation
 * being saved live in the collections store, so ⌘S and the save button can open
 * it imperatively via `requestSave`.
 */
export const SaveDialog: FC = () => {
  const collections = useCollectionsStore(s => s.collections);
  const actions = useCollectionsStore(s => s.actions);
  const { open, name: initialName } = useCollectionsStore(s => s.saveDialog);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] =
    useState<string>(NEW_COLLECTION);
  const [newCollectionName, setNewCollectionName] = useState('New Collection');

  // Reset the form each time the dialog opens with a fresh operation.
  useEffect(() => {
    if (open) {
      const { collections: current } = collectionsStore.getState();
      setName(initialName);
      setDescription('');
      setSelectedCollectionId(current[0]?.id ?? NEW_COLLECTION);
      setNewCollectionName('New Collection');
      setSaving(false);
    }
  }, [open, initialName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await collectionsStore.getState().actions.commitSaveDialog({
        name: name || 'Unnamed operation',
        description: description || undefined,
        collectionId:
          selectedCollectionId === NEW_COLLECTION
            ? undefined
            : selectedCollectionId,
        newCollectionName,
      });
    } catch {
      // The editor displays the rejected save; it retains the dirty state.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && actions.closeSaveDialog()}>
      <Dialog.Header>Save to collection</Dialog.Header>
      <form
        onSubmit={e => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <Dialog.Body>
          <label className="graphiql-save-dialog-field">
            <span>Operation name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Unnamed operation"
              className="graphiql-save-dialog-input"
              autoFocus
            />
          </label>
          <label className="graphiql-save-dialog-field">
            <span>Description</span>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="graphiql-save-dialog-input"
            />
          </label>
          <label className="graphiql-save-dialog-field">
            <span>Collection</span>
            <select
              value={selectedCollectionId}
              onChange={e => setSelectedCollectionId(e.target.value)}
              className="graphiql-save-dialog-select"
            >
              <option value={NEW_COLLECTION}>+ New collection</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {selectedCollectionId === NEW_COLLECTION && (
            <label className="graphiql-save-dialog-field">
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
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            type="button"
            disabled={saving}
            onClick={() => actions.closeSaveDialog()}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
};
