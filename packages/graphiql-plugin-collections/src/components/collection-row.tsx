import { FC, useState } from 'react';
import { DropdownMenu } from '@graphiql/react';
import type { Collection, CollectionItem } from '../types';
import { CollectionItemRow } from './collection-item-row';

type CollectionRowProps = {
  collection: Collection;
  allCollections: Collection[];
  onRename(id: string, name: string): void;
  onDelete(id: string): void;
  onOpenItem(item: CollectionItem): void;
  onDeleteItem(collectionId: string, itemId: string): void;
  onMoveItem(fromCollectionId: string, fromIndex: number, toCollectionId: string, toIndex: number): void;
  onAddItem(collectionId: string, item: Omit<CollectionItem, 'id' | 'createdAt' | 'updatedAt'>): CollectionItem;
};

export const CollectionRow: FC<CollectionRowProps> = ({
  collection,
  allCollections,
  onRename,
  onDelete,
  onOpenItem,
  onDeleteItem,
  onMoveItem,
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
      <div
        className="graphiql-collection-header"
        onClick={() => !isRenaming && setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(ex => !ex);
        }}
      >
        <span className="graphiql-collection-chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
        {isRenaming ? (
          <input
            className="graphiql-collection-rename-input"
            value={renameValue}
            autoFocus
            onChange={e => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setRenameValue(collection.name);
                setIsRenaming(false);
              }
              e.stopPropagation();
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="graphiql-collection-name">{collection.name}</span>
        )}
        <span className="graphiql-collection-badge">{collection.items.length}</span>
        <DropdownMenu>
          <DropdownMenu.Button
            className="graphiql-collection-menu"
            aria-label={`Actions for ${collection.name}`}
            onClick={e => e.stopPropagation()}
          >
            ···
          </DropdownMenu.Button>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={() => {
              setRenameValue(collection.name);
              setIsRenaming(true);
            }}>
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={() => onDelete(collection.id)}>
              Delete
            </DropdownMenu.Item>
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
              onOpen={onOpenItem}
              onDelete={onDeleteItem}
              onMove={onMoveItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};
