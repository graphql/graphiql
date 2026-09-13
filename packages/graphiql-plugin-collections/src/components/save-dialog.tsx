import { FC, useEffect, useState } from 'react';
import { Button, Dialog, useGraphiQLActions } from '@graphiql/react';
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
  const { markTabSaved } = useGraphiQLActions();

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
    }
  }, [open, initialName]);

  const handleSave = () => {
    const { saveDialog, actions: a } = collectionsStore.getState();
    let collectionId = selectedCollectionId;
    if (selectedCollectionId === NEW_COLLECTION) {
      collectionId = a.createCollection(
        newCollectionName || 'New Collection',
      ).id;
    }
    const item = a.addItem(collectionId, {
      name: name || 'Unnamed operation',
      description: description || undefined,
      query: saveDialog.query,
      variables: saveDialog.variables,
      headers: saveDialog.headers,
    });
    if (saveDialog.tabId) {
      a.linkTab(saveDialog.tabId, collectionId, item.id);
      markTabSaved(saveDialog.tabId);
    }
    a.closeSaveDialog();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && actions.closeSaveDialog()}>
      <Dialog.Header>Save to collection</Dialog.Header>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSave();
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
          <Button type="button" onClick={() => actions.closeSaveDialog()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
};
