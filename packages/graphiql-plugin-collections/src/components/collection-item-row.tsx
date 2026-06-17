import { FC, useState } from 'react';
import { DropdownMenu, MethodPill } from '@graphiql/react';
import type { Operation } from '@graphiql/react';
import type { Collection, CollectionItem } from '../types';

function inferOperationType(query: string): Operation {
  const match = /^\s*(query|mutation|subscription)/i.exec(query);
  const keyword = match?.[1]?.toLowerCase();
  if (keyword === 'mutation' || keyword === 'subscription') {
    return keyword;
  }
  return 'query';
}

type CollectionItemRowProps = {
  item: CollectionItem;
  collectionId: string;
  index: number;
  totalItems: number;
  allCollections: Collection[];
  onOpen(item: CollectionItem): void;
  onDelete(collectionId: string, itemId: string): void;
  onMove(fromCollectionId: string, fromIndex: number, toCollectionId: string, toIndex: number): void;
};

export const CollectionItemRow: FC<CollectionItemRowProps> = ({
  item,
  collectionId,
  index,
  totalItems,
  allCollections,
  onOpen,
  onDelete,
  onMove,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const operationType = inferOperationType(item.query);

  return (
    <div
      className={`graphiql-collection-item-row${isDragOver ? ' graphiql-collection-drop-target' : ''}`}
      aria-grabbed={isDragging || undefined}
      draggable
      onDragStart={e => {
        setIsDragging(true);
        e.dataTransfer.setData(
          'application/x-graphiql-item',
          JSON.stringify({ collectionId, index }),
        );
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setIsDragOver(false);
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/x-graphiql-item'));
          onMove(data.collectionId, data.index, collectionId, index);
        } catch {
          // malformed drag data
        }
      }}
      onClick={() => onOpen(item)}
    >
      <span className="graphiql-collection-drag-handle" aria-hidden="true">⠿</span>
      <MethodPill operation={operationType} aria-hidden />
      <span className="graphiql-collection-item-name" title={item.name}>
        {item.name}
      </span>
      <DropdownMenu>
        <DropdownMenu.Button
          className="graphiql-collection-item-menu"
          aria-label={`Actions for ${item.name}`}
          onClick={e => e.stopPropagation()}
        >
          ···
        </DropdownMenu.Button>
        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={() => onOpen(item)}>Open</DropdownMenu.Item>
          {index > 0 && (
            <DropdownMenu.Item onSelect={() => onMove(collectionId, index, collectionId, index - 1)}>
              Move up
            </DropdownMenu.Item>
          )}
          {index < totalItems - 1 && (
            <DropdownMenu.Item onSelect={() => onMove(collectionId, index, collectionId, index + 1)}>
              Move down
            </DropdownMenu.Item>
          )}
          {allCollections.filter(c => c.id !== collectionId).length > 0 && (
            <>
              <DropdownMenu.Separator />
              {allCollections
                .filter(c => c.id !== collectionId)
                .map(c => (
                  <DropdownMenu.Item
                    key={c.id}
                    onSelect={() => onMove(collectionId, index, c.id, c.items.length)}
                  >
                    Move to: {c.name}
                  </DropdownMenu.Item>
                ))}
            </>
          )}
          <DropdownMenu.Separator />
          <DropdownMenu.Item onSelect={() => onDelete(collectionId, item.id)}>
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
};
