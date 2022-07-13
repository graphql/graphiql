import { QueryStoreItem } from '@graphiql/toolkit';
import { Fragment, useEffect, useRef, useState } from 'react';

import { useEditorContext } from '../editor';
import { PenIcon, StarFilledIcon, StarIcon } from '../icons';
import { UnStyledButton } from '../ui';
import { useHistoryContext } from './context';

import './style.css';

export function History() {
  const { items } = useHistoryContext({ nonNull: true });
  const reversedItems = items.slice().reverse();
  return (
    <section aria-label="History" className="graphiql-history">
      <div className="graphiql-history-header">History</div>
      <ul className="graphiql-history-items">
        {reversedItems.map((item, i) => {
          return (
            <Fragment key={`${i}:${item.label || item.query}`}>
              <HistoryItem item={item} />
              {/**
               * The (reversed) items are ordered in a way that all favourites
               * come first, so if the next item is not a favourite anymore we
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
  const { editLabel, toggleFavorite } = useHistoryContext({
    nonNull: true,
    caller: HistoryItem,
  });
  const { headerEditor, queryEditor, variableEditor } = useEditorContext({
    nonNull: true,
    caller: HistoryItem,
  });
  const editField = useRef<HTMLInputElement>(null);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (isEditable && editField.current) {
      editField.current.focus();
    }
  }, [isEditable]);

  const displayName =
    props.item.label ||
    props.item.operationName ||
    formatQuery(props.item.query);

  return (
    <li className={'graphiql-history-item' + (isEditable ? ' editable' : '')}>
      {isEditable ? (
        <input
          type="text"
          defaultValue={props.item.label}
          ref={editField}
          onBlur={e => {
            e.stopPropagation();
            setIsEditable(false);
            editLabel({ ...props.item, label: e.target.value });
          }}
          onKeyDown={e => {
            if (e.keyCode === 13) {
              e.stopPropagation();
              setIsEditable(false);
              editLabel({ ...props.item, label: e.currentTarget.value });
            }
          }}
          placeholder="Type a label"
        />
      ) : (
        <>
          <UnStyledButton
            className="graphiql-history-item-label"
            onClick={() => {
              queryEditor?.setValue(props.item.query ?? '');
              variableEditor?.setValue(props.item.variables ?? '');
              headerEditor?.setValue(props.item.headers ?? '');
            }}>
            {displayName}
          </UnStyledButton>
          <UnStyledButton
            className="graphiql-history-item-action"
            title="Edit label"
            onClick={e => {
              e.stopPropagation();
              setIsEditable(true);
            }}>
            <PenIcon />
          </UnStyledButton>
          <UnStyledButton
            className="graphiql-history-item-action"
            onClick={e => {
              e.stopPropagation();
              toggleFavorite(props.item);
            }}
            title={props.item.favorite ? 'Remove favorite' : 'Add favorite'}>
            {props.item.favorite ? <StarFilledIcon /> : <StarIcon />}
          </UnStyledButton>
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
    .replace(/{/g, ' { ')
    .replace(/}/g, ' } ')
    .replace(/[\s]{2,}/g, ' ');
}
