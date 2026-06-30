import { FC, useState } from 'react';
import { DropdownMenu } from '@graphiql/react';
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
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded(ex => !ex);
          }
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
              if (e.key === 'Enter') {
                commitRename();
              }
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
        <span className="graphiql-collection-badge">
          {collection.items.length}
        </span>
        <DropdownMenu>
          <DropdownMenu.Button
            className="graphiql-collection-menu"
            aria-label={`Actions for ${collection.name}`}
            onClick={e => e.stopPropagation()}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
