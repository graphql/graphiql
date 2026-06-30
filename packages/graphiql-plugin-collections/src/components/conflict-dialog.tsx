import { FC, useState } from 'react';
import { Button, Dialog } from '@graphiql/react';
import type { ImportAnalysis, ImportResolution, ItemConflict } from '../types';

type ConflictDialogProps = {
  analysis: ImportAnalysis;
  sourceLabel: string;
  open: boolean;
  onClose(): void;
  onResolve(resolution: ImportResolution): void;
};

/** Returns a human-readable relative time hint comparing two timestamps. */
function updatedAtHint(incoming: number, current: number): string {
  const diffMs = incoming - current;
  if (Math.abs(diffMs) < 60_000) {
    return 'same time';
  }
  const diffMin = Math.round(Math.abs(diffMs) / 60_000);
  const diffHr = Math.round(Math.abs(diffMs) / 3_600_000);
  const diffDays = Math.round(Math.abs(diffMs) / 86_400_000);
  let magnitude: string;
  if (diffDays >= 1) {
    magnitude = `${diffDays}d`;
  } else if (diffHr >= 1) {
    magnitude = `${diffHr}h`;
  } else {
    magnitude = `${diffMin}m`;
  }
  return diffMs > 0
    ? `theirs: ${magnitude} newer`
    : `theirs: ${magnitude} older`;
}

type ReviewRowProps = {
  conflict: ItemConflict;
  checked: boolean;
  onChange(id: string, checked: boolean): void;
  collectionName: string | undefined;
};

const ReviewRow: FC<ReviewRowProps> = ({
  conflict,
  checked,
  onChange,
  collectionName,
}) => {
  const hint = updatedAtHint(
    conflict.incoming.updatedAt,
    conflict.current.updatedAt,
  );
  return (
    <label className="graphiql-conflict-review-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(conflict.incoming.id, e.target.checked)}
        className="graphiql-conflict-review-checkbox"
      />
      <span className="graphiql-conflict-review-name">
        {conflict.incoming.name}
      </span>
      {collectionName && (
        <span className="graphiql-conflict-review-collection">
          in {collectionName}
        </span>
      )}
      <span className="graphiql-conflict-review-hint">{hint}</span>
    </label>
  );
};

export const ConflictDialog: FC<ConflictDialogProps> = ({
  analysis,
  sourceLabel,
  open,
  onClose,
  onResolve,
}) => {
  const [reviewing, setReviewing] = useState(false);
  // Default all to unchecked (keep mine = safe default)
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const handleCheckChange = (id: string, isChecked: boolean) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const collectionNameById = new Map(
    analysis._incoming.map(c => [c.id, c.name]),
  );

  const summary = [
    analysis.newItems.length > 0 && `${analysis.newItems.length} new`,
    analysis.changedItems.length > 0 &&
      `${analysis.changedItems.length} with changes`,
    analysis.unchangedCount > 0 && `${analysis.unchangedCount} unchanged`,
  ]
    .filter(Boolean)
    .join(', ');

  const newCollectionCount = analysis.newCollections.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Header>Import conflicts</Dialog.Header>
      <Dialog.Body>
        <p className="graphiql-conflict-summary">
          Importing <strong>{sourceLabel}</strong>: {summary} operation
          {analysis.newItems.length +
            analysis.changedItems.length +
            analysis.unchangedCount !==
          1
            ? 's'
            : ''}
          {newCollectionCount > 0 &&
            `, ${newCollectionCount} new collection${newCollectionCount !== 1 ? 's' : ''}`}
          .
        </p>

        {!reviewing ? (
          <div className="graphiql-conflict-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() => onResolve({ mode: 'merge', applyChanges: true })}
            >
              Apply changes
            </Button>
            <Button
              type="button"
              onClick={() => onResolve({ mode: 'merge', applyChanges: false })}
            >
              Keep my versions
            </Button>
            <Button
              type="button"
              onClick={() => {
                setChecked(new Set());
                setReviewing(true);
              }}
            >
              Review each…
            </Button>
          </div>
        ) : (
          <div className="graphiql-conflict-review">
            <p className="graphiql-conflict-review-hint-label">
              Check which incoming versions to accept (unchecked = keep yours):
            </p>
            <div className="graphiql-conflict-review-list">
              {analysis.changedItems.map(conflict => (
                <ReviewRow
                  key={conflict.incoming.id}
                  conflict={conflict}
                  checked={checked.has(conflict.incoming.id)}
                  onChange={handleCheckChange}
                  collectionName={collectionNameById.get(
                    conflict.currentCollectionId,
                  )}
                />
              ))}
            </div>
            <div className="graphiql-conflict-review-confirm">
              <Button
                type="button"
                variant="primary"
                onClick={() =>
                  onResolve({ mode: 'merge', changedItemIds: new Set(checked) })
                }
              >
                Confirm selection
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setReviewing(false);
                  setChecked(new Set());
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </Dialog.Body>
    </Dialog>
  );
};
