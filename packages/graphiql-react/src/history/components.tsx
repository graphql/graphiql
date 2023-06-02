import { QueryStoreItem } from '@graphiql/toolkit';
import {
  Fragment,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { clsx } from 'clsx';

import { useEditorContext } from '../editor';
import { CloseIcon, PenIcon, StarFilledIcon, StarIcon, TrashIcon } from '../icons';
import { Button, Tooltip, UnStyledButton } from '../ui';
import { useHistoryContext } from './context';

import './style.css';

export function History() {
  const { items, deleteFromHistory } = useHistoryContext({ nonNull: true });
  const reversedItems = items.slice().reverse();

  const [clearStatus, setClearStatus] = useState<'success' | 'error' | null>(
    null,
  );
  useEffect(() => {
    if (clearStatus) {
      // reset button after a couple seconds
      setTimeout(() => {
        setClearStatus(null);
      }, 2000);
    }
  }, [clearStatus]);

  const handleClearStatus = useCallback(() => {
    try {
      for (const item of items) {
        deleteFromHistory(item, true);
      }
      setClearStatus('success');
    } catch {
      setClearStatus('error');
    }
  }, [deleteFromHistory, items])

  return (
    <section aria-label="History" className="graphiql-history">
      <div className="graphiql-history-header">
        History
        {(clearStatus || items.length > 0) && (
          <Button
            type="button"
            state={clearStatus || undefined}
            disabled={!items.length}
            onClick={handleClearStatus}
          >
            {
              {
                success: 'Cleared',
                error: 'Failed to Clear'
              }[clearStatus!] || 'Clear'
            }
          </Button>
        )}
      </div>
      <ul className="graphiql-history-items">
        {reversedItems.map((item, i) => {
          return (
            <Fragment key={`${i}:${item.label || item.query}`}>
              <HistoryItem item={item} />
              {/**
               * The (reversed) items are ordered in a way that all favorites
               * come first, so if the next item is not a favorite anymore we
               * place a spacer between them to separate these groups.
               */}
              {item.favorite &&
              reversedItems[i + 1] &&
              !reversedItems[i + 1].favorite ? (
                <div className="graphiql-history-item-spacer" />
              ) : null}
            </Fragment>
          );
        })}
      </ul>
    </section>
  );
}

type QueryHistoryItemProps = {
  item: QueryStoreItem;
};

export function HistoryItem(props: QueryHistoryItemProps) {
  const { editLabel, toggleFavorite, deleteFromHistory, setActive } =
    useHistoryContext({
      nonNull: true,
      caller: HistoryItem,
    });
  const { headerEditor, queryEditor, variableEditor } = useEditorContext({
    nonNull: true,
    caller: HistoryItem,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (isEditable) {
      inputRef.current?.focus();
    }
  }, [isEditable]);

  const displayName =
    props.item.label ||
    props.item.operationName ||
    formatQuery(props.item.query);

  const handleSave = useCallback(() => {
    setIsEditable(false);
    editLabel({ ...props.item, label: inputRef.current?.value });
  }, [editLabel, props.item]);

  const handleClose = useCallback(() => {
    setIsEditable(false);
  }, []);

  const handleEditLabel: MouseEventHandler<HTMLButtonElement> = useCallback(
    e => {
      e.stopPropagation();
      setIsEditable(true);
    },
    [],
  );

  const handleHistoryItemClick: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      const { query, variables, headers } = props.item;
      queryEditor?.setValue(query ?? '');
      variableEditor?.setValue(variables ?? '');
      headerEditor?.setValue(headers ?? '');
      setActive(props.item);
    }, 
    [headerEditor, props.item, queryEditor, setActive, variableEditor]
  );
  
  const handleDeleteItemFromHistory: MouseEventHandler<HTMLButtonElement> = 
    useCallback(
      e => {
        e.stopPropagation();
        deleteFromHistory(props.item);
      }, 
      [props.item, deleteFromHistory]
    );

  const handleToggleFavorite: MouseEventHandler<HTMLButtonElement> =
    useCallback(
      e => {
        e.stopPropagation();
        toggleFavorite(props.item);
      },
      [props.item, toggleFavorite],
    );

  return (
    <li className={clsx('graphiql-history-item', isEditable && 'editable')}>
      {isEditable ? (
        <>
          <input
            type="text"
            defaultValue={props.item.label}
            ref={inputRef}
            onKeyDown={e => {
              if (e.key === 'Esc') {
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
          <UnStyledButton type="button" ref={buttonRef} onClick={handleClose}>
            <CloseIcon />
          </UnStyledButton>
        </>
      ) : (
        <>
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
          <Tooltip label="Edit label">
            <UnStyledButton
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
        </>
      )}
    </li>
  );
}

export function formatQuery(query?: string) {
  return query
    ?.split('\n')
    .map(line => line.replace(/#(.*)/, ''))
    .join(' ')
    .replaceAll('{', ' { ')
    .replaceAll('}', ' } ')
    .replaceAll(/[\s]{2,}/g, ' ');
}
