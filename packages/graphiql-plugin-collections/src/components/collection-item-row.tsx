import { FC, useRef, useState } from 'react';
import { DropdownMenu, MethodPill, PenIcon } from '@graphiql/react';
import type { Collection, CollectionItem } from '../types';
import { getDocumentMethod } from '../operation-method';

type CollectionItemRowProps = {
  item: CollectionItem;
  collectionId: string;
  index: number;
  totalItems: number;
  allCollections: Collection[];
  /** Hide write affordances (Move, Delete) and disable drag-reorder when true. */
  readOnly?: boolean;
  /** Hide "Copy operation" when false. */
  allowCopy?: boolean;
  onOpen(item: CollectionItem): void;
  onCopy(itemId: string): void;
  onDelete(collectionId: string, itemId: string): void;
  onMove(
    fromCollectionId: string,
    fromIndex: number,
    toCollectionId: string,
    toIndex: number,
  ): void;
  onRenameItem(
    collectionId: string,
    itemId: string,
    updates: { name: string; description: string },
  ): void;
};

export const CollectionItemRow: FC<CollectionItemRowProps> = ({
  item,
  collectionId,
  index,
  totalItems,
  allCollections,
  readOnly = false,
  allowCopy = true,
  onOpen,
  onCopy,
  onDelete,
  onMove,
  onRenameItem,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [editName, setEditName] = useState(item.name);
  const [editDescription, setEditDescription] = useState(
    item.description ?? '',
  );
  const method = getDocumentMethod(item.query);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(item.name);
    setEditDescription(item.description ?? '');
    setIsEditing(true);
  };

  const commitEdit = () => {
    const name = editName.trim() || item.name;
    onRenameItem(collectionId, item.id, {
      name,
      description: editDescription,
    });
    setIsEditing(false);
  };

  // Commit only when focus leaves the whole form; moving between the name and
  // description inputs must not tear down the edit UI mid-edit.
  const handleBlur = (e: React.FocusEvent) => {
    if (editFormRef.current?.contains(e.relatedTarget as Node | null)) {
      return;
    }
    commitEdit();
  };

  const cancelEdit = () => {
    setEditName(item.name);
    setEditDescription(item.description ?? '');
    setIsEditing(false);
  };

  return (
    <div
      className={`graphiql-collection-item-row${isDragOver ? ' graphiql-collection-drop-target' : ''}`}
      draggable={!readOnly && !isEditing}
      onDragStart={
        readOnly || isEditing
          ? undefined
          : e => {
              e.dataTransfer.setData(
                'application/x-graphiql-item',
                JSON.stringify({ collectionId, index }),
              );
              e.dataTransfer.effectAllowed = 'move';
            }
      }
      onDragOver={
        readOnly
          ? undefined
          : e => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setIsDragOver(true);
            }
      }
      onDragLeave={readOnly ? undefined : () => setIsDragOver(false)}
      onDrop={
        readOnly
          ? undefined
          : e => {
              e.preventDefault();
              setIsDragOver(false);
              try {
                const data = JSON.parse(
                  e.dataTransfer.getData('application/x-graphiql-item'),
                );
                onMove(data.collectionId, data.index, collectionId, index);
              } catch {
                // malformed drag data
              }
            }
      }
      onClick={() => {
        if (!isEditing) {
          onOpen(item);
        }
      }}
    >
      <span className="graphiql-collection-drag-handle" aria-hidden="true">
        ⠿
      </span>
      {method === 'mix' ? (
        <span
          className="graphiql-method-pill graphiql-collection-method-pill-mix"
          aria-hidden
        >
          MIX
        </span>
      ) : (
        <MethodPill operation={method} aria-hidden />
      )}
      {isEditing ? (
        <div
          ref={editFormRef}
          className="graphiql-collection-item-edit-form"
          onClick={e => e.stopPropagation()}
        >
          <input
            className="graphiql-collection-item-edit-input"
            value={editName}
            autoFocus
            placeholder={item.name}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                commitEdit();
              }
              if (e.key === 'Escape') {
                cancelEdit();
              }
              e.stopPropagation();
            }}
          />
          <input
            className="graphiql-collection-item-edit-input"
            value={editDescription}
            placeholder="Description (optional)"
            onChange={e => setEditDescription(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                commitEdit();
              }
              if (e.key === 'Escape') {
                cancelEdit();
              }
              e.stopPropagation();
            }}
          />
        </div>
      ) : (
        <div className="graphiql-collection-item-main">
          <span className="graphiql-collection-item-name" title={item.name}>
            {item.name}
          </span>
          {item.description && (
            <span
              className="graphiql-collection-item-description"
              title={item.description}
            >
              {item.description}
            </span>
          )}
        </div>
      )}
      {!readOnly && !isEditing && (
        <button
          type="button"
          className="graphiql-collection-item-rename-btn"
          aria-label={`Edit ${item.name}`}
          title={`Edit ${item.name}`}
          onClick={startEdit}
        >
          <PenIcon />
        </button>
      )}
      <DropdownMenu>
        <DropdownMenu.Button
          className="graphiql-collection-item-menu"
          aria-label={`Actions for ${item.name}`}
          onClick={e => e.stopPropagation()}
        >
          ···
        </DropdownMenu.Button>
        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={() => onOpen(item)}>
            Open
          </DropdownMenu.Item>
          {allowCopy && (
            <DropdownMenu.Item onSelect={() => onCopy(item.id)}>
              Copy operation
            </DropdownMenu.Item>
          )}
          {!readOnly && index > 0 && (
            <DropdownMenu.Item
              onSelect={() =>
                onMove(collectionId, index, collectionId, index - 1)
              }
            >
              Move up
            </DropdownMenu.Item>
          )}
          {!readOnly && index < totalItems - 1 && (
            <DropdownMenu.Item
              onSelect={() =>
                onMove(collectionId, index, collectionId, index + 1)
              }
            >
              Move down
            </DropdownMenu.Item>
          )}
          {!readOnly && allCollections.some(c => c.id !== collectionId) && (
            <>
              <DropdownMenu.Separator />
              {allCollections
                .filter(c => c.id !== collectionId)
                .map(c => (
                  <DropdownMenu.Item
                    key={c.id}
                    onSelect={() =>
                      onMove(collectionId, index, c.id, c.items.length)
                    }
                  >
                    Move to: {c.name}
                  </DropdownMenu.Item>
                ))}
            </>
          )}
          {!readOnly && (
            <>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onSelect={() => onDelete(collectionId, item.id)}
              >
                Delete
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
};
