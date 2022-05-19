/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { HistoryContext } from '@graphiql/react';
import { QueryStoreItem } from '@graphiql/toolkit';
import React, { useContext, useEffect, useRef, useState } from 'react';

type QueryHistoryProps = {
  onSelect(item: QueryStoreItem): void;
};

export function QueryHistory(props: QueryHistoryProps) {
  const historyContext = useContext(HistoryContext);
  if (!historyContext) {
    throw new Error(
      'Tried to render the `QueryHistory` component without the necessary context. Make sure that the `HistoryContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

  return (
    <section aria-label="History">
      <div className="history-title-bar">
        <div className="history-title">History</div>
        <div className="doc-explorer-rhs">
          <button
            className="docExplorerHide"
            onClick={() => historyContext.hide()}
            aria-label="Close History">
            {'\u2715'}
          </button>
        </div>
      </div>
      <ul className="history-contents">
        {historyContext.items
          .slice()
          .reverse()
          .map((item, i) => {
            return (
              <QueryHistoryItem
                key={`${i}:${item.label || item.query}`}
                onSelect={props.onSelect}
                item={item}
              />
            );
          })}
      </ul>
    </section>
  );
}

type QueryHistoryItemProps = {
  onSelect(item: QueryStoreItem): void;
  item: QueryStoreItem;
};

export function QueryHistoryItem(props: QueryHistoryItemProps) {
  const historyContext = useContext(HistoryContext);
  if (!historyContext) {
    throw new Error(
      'Tried to render the `QueryHistoryItem` component without the necessary context. Make sure that the `HistoryContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

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
    props.item.query
      ?.split('\n')
      .filter(line => line.indexOf('#') !== 0)
      .join('');
  const starIcon = props.item.favorite ? '\u2605' : '\u2606';
  return (
    <li className={isEditable ? 'editable' : undefined}>
      {isEditable ? (
        <input
          type="text"
          defaultValue={props.item.label}
          ref={editField}
          onBlur={e => {
            e.stopPropagation();
            setIsEditable(false);
            historyContext.editLabel({ ...props.item, label: e.target.value });
          }}
          onKeyDown={e => {
            if (e.keyCode === 13) {
              e.stopPropagation();
              setIsEditable(false);
              historyContext.editLabel({
                ...props.item,
                label: e.currentTarget.value,
              });
            }
          }}
          placeholder="Type a label"
        />
      ) : (
        <button
          className="history-label"
          onClick={() => props.onSelect(props.item)}>
          {displayName}
        </button>
      )}
      <button
        onClick={e => {
          e.stopPropagation();
          setIsEditable(true);
        }}
        aria-label="Edit label">
        {'\u270e'}
      </button>
      <button
        className={props.item.favorite ? 'favorited' : undefined}
        onClick={e => {
          e.stopPropagation();
          historyContext.toggleFavorite(props.item);
        }}
        aria-label={props.item.favorite ? 'Remove favorite' : 'Add favorite'}>
        {starIcon}
      </button>
    </li>
  );
}
