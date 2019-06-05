/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { parse } from 'graphql';
import * as React from 'react';
import QueryStore from '../utility/QueryStore';
import HistoryQuery from './HistoryQuery';

const shouldSaveQuery = (
  nextProps: QueryHistoryProps,
  current: QueryHistoryProps,
  lastQuerySaved,
) => {
  if (nextProps.queryID === current.queryID) {
    return false;
  }
  try {
    parse(nextProps.query);
  } catch (e) {
    return false;
  }
  if (!lastQuerySaved) {
    return true;
  }
  if (
    JSON.stringify(nextProps.query) === JSON.stringify(lastQuerySaved.query)
  ) {
    if (
      JSON.stringify(nextProps.variables) ===
      JSON.stringify(lastQuerySaved.variables)
    ) {
      return false;
    }
    if (!nextProps.variables && !lastQuerySaved.variables) {
      return false;
    }
  }
  return true;
};

const MAX_HISTORY_LENGTH = 20;

type QueryHistoryProps = {
  query?: string;
  variables?: string;
  operationName?: string;
  queryID?: number;
  onSelectQuery?: (...args: any[]) => any;
  storage?: object;
};

type QueryHistoryState = {
  queries: any;
};

export class QueryHistory extends React.Component<
  QueryHistoryProps,
  QueryHistoryState
> {
  historyStore: QueryStore
  favoriteStore: QueryStore
  constructor(props) {
    super(props);
    this.historyStore = new QueryStore('queries', props.storage);
    this.favoriteStore = new QueryStore('favorites', props.storage);
    const historyQueries = this.historyStore.fetchAll();
    const favoriteQueries = this.favoriteStore.fetchAll();
    const queries = historyQueries.concat(favoriteQueries);
    this.state = { queries };
  }
  componentWillReceiveProps(nextProps) {
    if (
      shouldSaveQuery(nextProps, this.props, this.historyStore.fetchRecent())
    ) {
      const item = {
        query: nextProps.query,
        variables: nextProps.variables,
        operationName: nextProps.operationName,
      };
      this.historyStore.push(item);
      if (this.historyStore.length > MAX_HISTORY_LENGTH) {
        this.historyStore.shift();
      }
      const historyQueries = this.historyStore.items;
      const favoriteQueries = this.favoriteStore.items;
      const queries = historyQueries.concat(favoriteQueries);
      this.setState({
        queries,
      });
    }
  }
  render() {
    const queries = this.state.queries.slice().reverse();
    const queryNodes = queries.map((query, i) => {
      return (
        <HistoryQuery
          handleEditLabel={this.editLabel}
          handleToggleFavorite={this.toggleFavorite}
          key={i}
          onSelect={this.props.onSelectQuery}
          {...query}
        />
      );
    });
    return (
      <div>
        <div className="history-title-bar">
          <div className="history-title">{'History'}</div>
          <div className="doc-explorer-rhs">{this.props.children}</div>
        </div>
        <div className="history-contents">{queryNodes}</div>
      </div>
    );
  }
  toggleFavorite = (query, variables, operationName, label, favorite) => {
    const item = {
      query,
      variables,
      operationName,
      label,
    };
    if (!this.favoriteStore.contains(item)) {
      item.favorite = true;
      this.favoriteStore.push(item);
    } else if (favorite) {
      item.favorite = false;
      this.favoriteStore.delete(item);
    }
    this.setState({
      queries: [...this.historyStore.items, ...this.favoriteStore.items],
    });
  };
  editLabel = (query, variables, operationName, label, favorite) => {
    const item = {
      query,
      variables,
      operationName,
      label,
    };
    if (favorite) {
      this.favoriteStore.edit({ ...item, favorite });
    } else {
      this.historyStore.edit(item);
    }
    this.setState({
      queries: [...this.historyStore.items, ...this.favoriteStore.items],
    });
  };
}
