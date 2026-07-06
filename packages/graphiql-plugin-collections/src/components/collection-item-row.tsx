import { FC, useRef, useState } from 'react';
import { MethodPill, PenIcon, CopyIcon, TrashIcon } from '@graphiql/react';
import type { CollectionItem } from '../types';
import { getDocumentMethod } from '../operation-method';

type CollectionItemRowProps = {
  item: CollectionItem;
  collectionId: string;
  /** The item's position within its collection, used for drag reorder. */
  index: number;
  /** Hide write affordances (Move, Delete) and disable drag-reorder when true. */
  readOnly?: boolean;
  isGrabbed: boolean;
  onGrabToggle(): void;
  onGrabMove(direction: 'up' | 'down'): void;
  onGrabCancel(): void;
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
  readOnly = false,
  isGrabbed,
  onGrabToggle,
  onGrabMove,
  onGrabCancel,
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

  // Action buttons stop propagation so their clicks don't also trigger the
  // row's open handler.
  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(item.name);
    setEditDescription(item.description ?? '');
    setIsEditing(true);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(collectionId, item.id);
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
      data-grabbed={isGrabbed || undefined}
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
      <button
        type="button"
        className="graphiql-collection-drag-handle"
        data-collection-drag-handle={item.id}
        aria-label={`Reorder ${item.name}. Press space to grab, arrow keys to move, escape to cancel.`}
        aria-pressed={isGrabbed}
        disabled={readOnly}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            onGrabToggle();
          } else if (isGrabbed && e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            onGrabMove('down');
          } else if (isGrabbed && e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            onGrabMove('up');
          } else if (isGrabbed && e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onGrabCancel();
          }
        }}
      >
        ⠿
      </button>
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
      {!isEditing && (
        <div className="graphiql-collection-item-actions">
          {!readOnly && (
            <button
              type="button"
              className="graphiql-collection-item-action"
              aria-label={`Edit ${item.name}`}
              title={`Edit ${item.name}`}
              onClick={startEdit}
            >
              <PenIcon aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="graphiql-collection-item-action"
            aria-label={`Copy ${item.name}`}
            title={`Copy ${item.name}`}
            onClick={handleCopy}
          >
            <CopyIcon aria-hidden="true" />
          </button>
          {!readOnly && (
            <button
              type="button"
              className="graphiql-collection-item-action"
              aria-label={`Delete ${item.name}`}
              title={`Delete ${item.name}`}
              onClick={handleDelete}
            >
              <TrashIcon aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
