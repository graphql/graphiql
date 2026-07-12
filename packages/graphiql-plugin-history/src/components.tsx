import type { QueryStoreItem } from '@graphiql/toolkit';
import { FC, MouseEventHandler, useEffect, useRef, useState } from 'react';
import {
  cn,
  CloseIcon,
  PenIcon,
  StarFilledIcon,
  StarIcon,
  TrashIcon,
  useGraphiQL,
  pick,
  Button,
  MethodPill,
  Tooltip,
  UnStyledButton,
  PanelHeader,
} from '@graphiql/react';
import { useHistory, useHistoryActions } from './context';

export const History: FC = () => {
  const all = useHistory();
  const { deleteFromHistory } = useHistoryActions();

  // Reverse items since we push them in so want the latest one at the top, and pass the
  // original index in case multiple items share the same label so we can edit the correct item
  let items = all
    .slice()
    .map((item, i) => ({ ...item, index: i }))
    .reverse();
  const favorites = items.filter(item => item.favorite);
  if (favorites.length) {
    items = items.filter(item => !item.favorite);
  }

  const handleClear = () => {
    for (const item of items) {
      deleteFromHistory(item, true);
    }
  };
  const hasFavorites = Boolean(favorites.length);
  const hasItems = Boolean(items.length);

  const clearButton = hasItems ? (
    <Button type="button" onClick={handleClear}>
      Clear
    </Button>
  ) : undefined;

  return (
    <section aria-label="History" className="graphiql-history">
      <PanelHeader
        title="History"
        subtitle="Last 20 runs."
        actions={clearButton}
      />

      {hasFavorites && (
        <ul className="graphiql-history-items">
          {favorites.map(item => (
            <HistoryItem item={item} key={item.index} />
          ))}
        </ul>
      )}

      {hasFavorites && hasItems && (
        <div className="graphiql-history-item-spacer" />
      )}

      {hasItems && (
        <ul className="graphiql-history-items">
          {items.map(item => (
            <HistoryItem item={item} key={item.index} />
          ))}
        </ul>
      )}
    </section>
  );
};

type QueryHistoryItemProps = {
  item: QueryStoreItem & { index?: number };
};

export const HistoryItem: FC<QueryHistoryItemProps> = props => {
  const { editLabel, toggleFavorite, deleteFromHistory, setActive } =
    useHistoryActions();
  const { headerEditor, queryEditor, variableEditor } = useGraphiQL(
    pick('headerEditor', 'queryEditor', 'variableEditor'),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const [isEditable, setIsEditable] = useState(false);
  const wasEditable = useRef(false);

  useEffect(() => {
    if (isEditable) {
      inputRef.current?.focus();
    } else if (wasEditable.current) {
      // The input unmounts on save/cancel; without this the browser drops
      // focus to <body> instead of keeping it on the row.
      editButtonRef.current?.focus();
    }
    wasEditable.current = isEditable;
  }, [isEditable]);

  const displayName =
    props.item.label ||
    props.item.operationName ||
    formatQuery(props.item.query);

  const handleSave = () => {
    setIsEditable(false);
    const { index, ...item } = props.item;
    editLabel({ ...item, label: inputRef.current?.value }, index);
  };

  const handleClose = () => {
    setIsEditable(false);
  };

  const handleEditLabel: MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation();
    setIsEditable(true);
  };

  const handleHistoryItemClick: MouseEventHandler<HTMLButtonElement> = () => {
    const { query, variables, headers } = props.item;
    queryEditor?.setValue(query ?? '');
    variableEditor?.setValue(variables ?? '');
    headerEditor?.setValue(headers ?? '');
    setActive(props.item);
  };

  const handleDeleteItemFromHistory: MouseEventHandler<
    HTMLButtonElement
  > = e => {
    e.stopPropagation();
    deleteFromHistory(props.item);
  };

  const handleToggleFavorite: MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation();
    toggleFavorite(props.item);
  };

  const variablesSnippet = props.item.variables
    ? formatVariables(props.item.variables)
    : null;

  return (
    <li className={cn('graphiql-history-item', isEditable && 'editable')}>
      {isEditable ? (
        <>
          <input
            type="text"
            defaultValue={props.item.label}
            ref={inputRef}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setIsEditable(false);
              } else if (e.key === 'Enter') {
                setIsEditable(false);
                editLabel({ ...props.item, label: e.currentTarget.value });
              }
            }}
            placeholder="Type a label"
          />
          <UnStyledButton type="button" ref={buttonRef} onClick={handleSave}>
            Save
          </UnStyledButton>
          <UnStyledButton
            type="button"
            ref={buttonRef}
            onClick={handleClose}
            aria-label="Cancel"
          >
            <CloseIcon aria-hidden="true" />
          </UnStyledButton>
        </>
      ) : (
        <>
          <div className="graphiql-history-item-inner">
            <div className="graphiql-history-item-row">
              {props.item.operation && (
                <MethodPill operation={props.item.operation} aria-hidden />
              )}
              <Tooltip label="Set active">
                <UnStyledButton
                  type="button"
                  className="graphiql-history-item-label"
                  onClick={handleHistoryItemClick}
                  aria-label="Set active"
                >
                  {displayName}
                </UnStyledButton>
              </Tooltip>
            </div>
            {variablesSnippet && (
              <div className="graphiql-history-item-meta">
                <span className="graphiql-history-item-variables">
                  {variablesSnippet}
                </span>
              </div>
            )}
          </div>
          <div className="graphiql-history-item-actions">
            <Tooltip label="Edit label">
              <UnStyledButton
                ref={editButtonRef}
                type="button"
                className="graphiql-history-item-action"
                onClick={handleEditLabel}
                aria-label="Edit label"
              >
                <PenIcon aria-hidden="true" />
              </UnStyledButton>
            </Tooltip>
            <Tooltip
              label={props.item.favorite ? 'Remove favorite' : 'Add favorite'}
            >
              <UnStyledButton
                type="button"
                className="graphiql-history-item-action"
                onClick={handleToggleFavorite}
                aria-label={
                  props.item.favorite ? 'Remove favorite' : 'Add favorite'
                }
              >
                {props.item.favorite ? (
                  <StarFilledIcon aria-hidden="true" />
                ) : (
                  <StarIcon aria-hidden="true" />
                )}
              </UnStyledButton>
            </Tooltip>
            <Tooltip label="Delete from history">
              <UnStyledButton
                type="button"
                className="graphiql-history-item-action"
                onClick={handleDeleteItemFromHistory}
                aria-label="Delete from history"
              >
                <TrashIcon aria-hidden="true" />
              </UnStyledButton>
            </Tooltip>
          </div>
        </>
      )}
    </li>
  );
};

export function formatQuery(query?: string) {
  return query
    ?.split('\n')
    .map(line => line.replace(/#(.*)/, ''))
    .join(' ')
    .replaceAll('{', ' { ')
    .replaceAll('}', ' } ')
    .replaceAll(/[\s]{2,}/g, ' ');
}

export function formatVariables(variables: string) {
  try {
    const parsed = JSON.parse(variables) as Record<string, unknown>;
    const entries = Object.entries(parsed);
    if (!entries.length) {
      return null;
    }
    return entries
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
  } catch {
    return variables.slice(0, 60);
  }
}
