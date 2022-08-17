/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  HistoryContextType,
  useHistoryContext,
  useSelectHistoryItem,
} from '@graphiql/react';
import { QueryStoreItem } from '@graphiql/toolkit';
import React, { useEffect, useRef, useState } from 'react';

export function QueryHistory() {
  const { hide, items } = useHistoryContext({
    nonNull: true,
  }) as HistoryContextType;

  return (
    <section aria-label="History">
      <div className="history-title-bar">
        <div className="history-title">History</div>
        <div className="doc-explorer-rhs">
          <button
            type="button"
            className="docExplorerHide"
            onClick={() => hide()}
            aria-label="Close History"
          >
            {'\u2715'}
          </button>
        </div>
      </div>
      <ul className="history-contents">
        {items
          .slice()
          .reverse()
          .map((item, i) => {
            return (
              <QueryHistoryItem
                key={`${i}:${item.label || item.query}`}
                item={item}
              />
            );
          })}
      </ul>
    </section>
  );
}

type QueryHistoryItemProps = {
  item: QueryStoreItem;
};

export function QueryHistoryItem(props: QueryHistoryItemProps) {
  const { editLabel, toggleFavorite } = useHistoryContext({ nonNull: true });
  const selectHistoryItem = useSelectHistoryItem();
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
        <button
          type="button"
          className="history-label"
          onClick={() => {
            selectHistoryItem(props.item);
          }}
        >
          {displayName}
        </button>
      )}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setIsEditable(true);
        }}
        aria-label="Edit label"
      >
        {'\u270e'}
      </button>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          toggleFavorite(props.item);
        }}
        aria-label={props.item.favorite ? 'Remove favorite' : 'Add favorite'}
      >
        {starIcon}
      </button>
    </li>
  );
}
