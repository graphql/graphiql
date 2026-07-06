import { FC, useState } from 'react';
import { PenIcon, CopyIcon, TrashIcon } from '@graphiql/react';
import type { Collection, CollectionItem } from '../types';
import { CollectionItemRow } from './collection-item-row';

type CollectionRowProps = {
  collection: Collection;
  expanded: boolean;
  onToggleExpand(): void;
  /** Hide write affordances (Rename, Delete, add-item) when true. */
  readOnly?: boolean;
  /** Hide "Copy to clipboard" when false. */
  allowCopy?: boolean;
  grabbed: { collectionId: string; index: number; itemId: string } | null;
  onGrabToggle(collectionId: string, index: number, itemId: string): void;
  onGrabMove(direction: 'up' | 'down'): void;
  onGrabCancel(): void;
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
  expanded,
  onToggleExpand,
  readOnly = false,
  allowCopy = true,
  grabbed,
  onGrabToggle,
  onGrabMove,
  onGrabCancel,
  onRename,
  onDelete,
  onCopy,
  onOpenItem,
  onCopyItem,
  onDeleteItem,
  onMoveItem,
  onRenameItem,
}) => {
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
            onClick={onToggleExpand}
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
        <div className="graphiql-collection-header-actions">
          {!readOnly && (
            <button
              type="button"
              className="graphiql-collection-header-action"
              aria-label={`Rename ${collection.name}`}
              title={`Rename ${collection.name}`}
              onClick={e => {
                e.stopPropagation();
                setRenameValue(collection.name);
                setIsRenaming(true);
              }}
            >
              <PenIcon aria-hidden="true" />
            </button>
          )}
          {allowCopy && (
            <button
              type="button"
              className="graphiql-collection-header-action"
              aria-label={`Copy ${collection.name}`}
              title={`Copy ${collection.name}`}
              onClick={e => {
                e.stopPropagation();
                onCopy(collection.id);
              }}
            >
              <CopyIcon aria-hidden="true" />
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              className="graphiql-collection-header-action"
              aria-label={`Delete ${collection.name}`}
              title={`Delete ${collection.name}`}
              onClick={e => {
                e.stopPropagation();
                onDelete(collection.id);
              }}
            >
              <TrashIcon aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {expanded && collection.items.length > 0 && (
        <div className="graphiql-collection-items">
          {collection.items.map((item, i) => (
            <CollectionItemRow
              key={item.id}
              item={item}
              collectionId={collection.id}
              index={i}
              readOnly={readOnly}
              allowCopy={allowCopy}
              isGrabbed={
                grabbed?.collectionId === collection.id && grabbed.index === i
              }
              onGrabToggle={() => onGrabToggle(collection.id, i, item.id)}
              onGrabMove={onGrabMove}
              onGrabCancel={onGrabCancel}
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
