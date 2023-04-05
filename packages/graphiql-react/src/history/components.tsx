import { QueryStoreItem } from '@graphiql/toolkit';
import { Fragment, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

import { useEditorContext } from '../editor';
import {
  CloseIcon,
  PenIcon,
  StarFilledIcon,
  StarIcon,
  TrashIcon,
} from '../icons';
import { Button, Tooltip, UnStyledButton } from '../ui';
import { useHistoryContext } from './context';

import './style.css';

export function History() {
  const { items, deleteFromHistory } = useHistoryContext({ nonNull: true });
  const reversedItems = items.slice().reverse();

  const [clearHistoryStatus, setClearHistoryStatus] = useState<
    'success' | 'error' | null
  >(null);
  useEffect(() => {
    if (!clearHistoryStatus) {
      return;
    }
    // reset button after a couple seconds
    setTimeout(() => {
      setClearHistoryStatus(null);
    }, 2000);
  }, [clearHistoryStatus]);

  return (
    <section aria-label="History" className="graphiql-history">
      <div className="graphiql-history-header">
        History
        {Boolean(items.length) && (
          <Button
            type="button"
            state={clearHistoryStatus || undefined}
            disabled={!items.length}
            onClick={() => {
              try {
                items.forEach(item => {
                  deleteFromHistory(item, true);
                });
                setClearHistoryStatus('success');
              } catch {
                setClearHistoryStatus('error');
              }
            }}
          >
            {clearHistoryStatus === 'success'
              ? 'Cleared'
              : clearHistoryStatus === 'error'
              ? 'Failed to clear'
              : 'Clear'}
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
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditable]);

  const displayName =
    props.item.label ||
    props.item.operationName ||
    formatQuery(props.item.query);

  return (
    <li className={clsx('graphiql-history-item', isEditable && 'editable')}>
      {isEditable ? (
        <>
          <input
            type="text"
            defaultValue={props.item.label}
            ref={inputRef}
            onKeyDown={e => {
              if (e.keyCode === 27) {
                // Escape
                setIsEditable(false);
              } else if (e.keyCode === 13) {
                // Enter
                setIsEditable(false);
                editLabel({ ...props.item, label: e.currentTarget.value });
              }
            }}
            placeholder="Type a label"
          />
          <UnStyledButton
            type="button"
            ref={buttonRef}
            onClick={() => {
              setIsEditable(false);
              editLabel({ ...props.item, label: inputRef.current?.value });
            }}
          >
            Save
          </UnStyledButton>
          <UnStyledButton
            type="button"
            ref={buttonRef}
            onClick={() => {
              setIsEditable(false);
            }}
          >
            <CloseIcon />
          </UnStyledButton>
        </>
      ) : (
        <>
          <UnStyledButton
            type="button"
            className="graphiql-history-item-label"
            onClick={() => {
              queryEditor?.setValue(props.item.query ?? '');
              variableEditor?.setValue(props.item.variables ?? '');
              headerEditor?.setValue(props.item.headers ?? '');
              setActive(props.item);
            }}
          >
            {displayName}
          </UnStyledButton>
          <Tooltip label="Edit label">
            <UnStyledButton
              type="button"
              className="graphiql-history-item-action"
              onClick={e => {
                e.stopPropagation();
                setIsEditable(true);
              }}
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
              onClick={e => {
                e.stopPropagation();
                toggleFavorite(props.item);
              }}
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
              onClick={e => {
                e.stopPropagation();
                deleteFromHistory(props.item);
              }}
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
