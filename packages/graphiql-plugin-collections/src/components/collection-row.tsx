import { FC, useState } from 'react';
import { DropdownMenu, PenIcon } from '@graphiql/react';
import type { Collection, CollectionItem } from '../types';
import { CollectionItemRow } from './collection-item-row';

type CollectionRowProps = {
  collection: Collection;
  allCollections: Collection[];
  /** Hide write affordances (Rename, Delete, add-item) when true. */
  readOnly?: boolean;
  /** Hide "Copy to clipboard" when false. */
  allowCopy?: boolean;
  onRename(id: string, name: string): void;
  onDelete(id: string): void;
  onCopy(id: string): void;
  onOpenItem(item: CollectionItem): void;
  onCopyItem(itemId: string): void;
  onDeleteItem(collectionId: string, itemId: string): void;
  onMoveItem(
    fromCollectionId: string,
    fromIndex: number,
    toCollectionId: string,
    toIndex: number,
  ): void;
  onAddItem(
    collectionId: string,
    item: Omit<CollectionItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): CollectionItem;
  onRenameItem(
    collectionId: string,
    itemId: string,
    updates: { name: string; description: string },
  ): void;
};

export const CollectionRow: FC<CollectionRowProps> = ({
  collection,
  allCollections,
  readOnly = false,
  allowCopy = true,
  onRename,
  onDelete,
  onCopy,
  onOpenItem,
  onCopyItem,
  onDeleteItem,
  onMoveItem,
  onRenameItem,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(collection.name);

  const commitRename = () => {
    if (renameValue.trim()) {
      onRename(collection.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div className="graphiql-collection-row">
      <div className="graphiql-collection-header">
        {isRenaming ? (
          <input
            className="graphiql-collection-rename-input"
            value={renameValue}
            autoFocus
            onChange={e => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                commitRename();
              }
              if (e.key === 'Escape') {
                setRenameValue(collection.name);
                setIsRenaming(false);
              }
              e.stopPropagation();
            }}
          />
        ) : (
          <button
            type="button"
            className="graphiql-collection-toggle"
            aria-expanded={expanded}
            aria-label={`Toggle ${collection.name}`}
            onClick={() => setExpanded(e => !e)}
          >
            <span className="graphiql-collection-chevron" aria-hidden="true">
              {expanded ? '▾' : '▸'}
            </span>
            <span className="graphiql-collection-name">{collection.name}</span>
          </button>
        )}
        <span className="graphiql-collection-badge">
          {collection.items.length}
        </span>
        {!readOnly && (
          <button
            type="button"
            className="graphiql-collection-rename-btn"
            aria-label={`Rename ${collection.name}`}
            title={`Rename ${collection.name}`}
            onClick={e => {
              e.stopPropagation();
              setRenameValue(collection.name);
              setIsRenaming(true);
            }}
          >
            <PenIcon />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenu.Button
            className="graphiql-collection-menu"
            aria-label={`Actions for ${collection.name}`}
          >
            ···
          </DropdownMenu.Button>
          <DropdownMenu.Content>
            {!readOnly && (
              <DropdownMenu.Item
                onSelect={() => {
                  setRenameValue(collection.name);
                  setIsRenaming(true);
                }}
              >
                Rename
              </DropdownMenu.Item>
            )}
            {allowCopy && (
              <DropdownMenu.Item onSelect={() => onCopy(collection.id)}>
                Copy to clipboard
              </DropdownMenu.Item>
            )}
            {!readOnly && (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onSelect={() => onDelete(collection.id)}>
                  Delete
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      {expanded && collection.items.length > 0 && (
        <div className="graphiql-collection-items">
          {collection.items.map((item, i) => (
            <CollectionItemRow
              key={item.id}
              item={item}
              collectionId={collection.id}
              index={i}
              totalItems={collection.items.length}
              allCollections={allCollections}
              readOnly={readOnly}
              allowCopy={allowCopy}
              onOpen={onOpenItem}
              onCopy={onCopyItem}
              onDelete={onDeleteItem}
              onMove={onMoveItem}
              onRenameItem={onRenameItem}
            />
          ))}
        </div>
      )}
      {expanded && collection.items.length === 0 && (
        <div className="graphiql-collection-empty-hint">
          {readOnly
            ? 'No operations here yet.'
            : 'No operations here yet. Save a query to add it to this collection.'}
        </div>
      )}
    </div>
  );
};
