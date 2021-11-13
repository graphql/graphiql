/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { QueryStoreItem } from '../utility/QueryStore';
import HistoryQuery, {
  HandleEditLabelFn,
  HandleSelectQueryFn,
  HandleToggleFavoriteFn,
} from './HistoryQuery';
import StorageAPI from '../utility/StorageAPI';
import HistoryStore from '../utility/HistoryStore';

type QueryHistoryProps = {
  query?: string;
  variables?: string;
  headers?: string;
  operationName?: string;
  queryID?: number;
  onSelectQuery: HandleSelectQueryFn;
  storage: StorageAPI;
  maxHistoryLength: number;
};

type QueryHistoryState = {
  queries: Array<QueryStoreItem>;
};

export class QueryHistory extends React.Component<
  QueryHistoryProps,
  QueryHistoryState
> {
  historyStore: HistoryStore;

  constructor(props: QueryHistoryProps) {
    super(props);
    this.historyStore = new HistoryStore(
      this.props.storage,
      this.props.maxHistoryLength,
    );
    const queries = this.historyStore.queries;
    this.state = { queries };
  }

  onUpdateHistory = (
    query?: string,
    variables?: string,
    headers?: string,
    operationName?: string,
  ) => {
    this.historyStore.updateHistory(query, variables, headers, operationName);
    this.setState({ queries: this.historyStore.queries });
  };

  onHandleEditLabel: HandleEditLabelFn = (
    query,
    variables,
    headers,
    operationName,
    label,
    favorite,
  ) => {
    this.historyStore.editLabel(
      query,
      variables,
      headers,
      operationName,
      label,
      favorite,
    );
    this.setState({ queries: this.historyStore.queries });
  };

  onToggleFavorite: HandleToggleFavoriteFn = (
    query,
    variables,
    headers,
    operationName,
    label,
    favorite,
  ) => {
    this.historyStore.toggleFavorite(
      query,
      variables,
      headers,
      operationName,
      label,
      favorite,
    );
    this.setState({ queries: this.historyStore.queries });
  };

  render() {
    const queries = this.state.queries.slice().reverse();
    const queryNodes = queries.map((query, i) => {
      return (
        <HistoryQuery
          handleEditLabel={this.onHandleEditLabel}
          handleToggleFavorite={this.onToggleFavorite}
          key={`${i}:${query.label || query.query}`}
          onSelect={this.props.onSelectQuery}
          {...query}
        />
      );
    });
    return (
      <section aria-label="History">
        <div className="history-title-bar">
          <div className="history-title">{'History'}</div>
          <div className="doc-explorer-rhs">{this.props.children}</div>
        </div>
        <ul className="history-contents">{queryNodes}</ul>
      </section>
    );
  }
}
