/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import QueryStore, { QueryStoreItem } from './QueryStore';
import StorageAPI from './StorageAPI';
import { parse } from 'graphql';
import {
  HandleEditLabelFn,
  HandleToggleFavoriteFn,
} from '../components/HistoryQuery';

const MAX_QUERY_SIZE = 100000;

export default class HistoryStore {
  queries: Array<QueryStoreItem>;
  history: QueryStore;
  favorite: QueryStore;

  constructor(private storage: StorageAPI, private maxHistoryLength: number) {
    this.history = new QueryStore(
      'queries',
      this.storage,
      this.maxHistoryLength,
    );
    // favorites are not automatically deleted, so there's no need for a max length
    this.favorite = new QueryStore('favorites', this.storage, null);
    this.queries = this.fetchAllQueries();
  }

  shouldSaveQuery = (
    query?: string,
    variables?: string,
    headers?: string,
    lastQuerySaved?: QueryStoreItem,
  ) => {
    if (!query) {
      return false;
    }

    try {
      parse(query);
    } catch (e) {
      return false;
    }

    // Don't try to save giant queries
    if (query.length > MAX_QUERY_SIZE) {
      return false;
    }
    if (!lastQuerySaved) {
      return true;
    }
    if (JSON.stringify(query) === JSON.stringify(lastQuerySaved.query)) {
      if (
        JSON.stringify(variables) === JSON.stringify(lastQuerySaved.variables)
      ) {
        if (
          JSON.stringify(headers) === JSON.stringify(lastQuerySaved.headers)
        ) {
          return false;
        }
        if (headers && !lastQuerySaved.headers) {
          return false;
        }
      }
      if (variables && !lastQuerySaved.variables) {
        return false;
      }
    }
    return true;
  };

  fetchAllQueries = () => {
    const historyQueries = this.history.fetchAll();
    const favoriteQueries = this.favorite.fetchAll();
    return historyQueries.concat(favoriteQueries);
  };

  // Public API
  updateHistory = (
    query?: string,
    variables?: string,
    headers?: string,
    operationName?: string,
  ) => {
    if (
      this.shouldSaveQuery(
        query,
        variables,
        headers,
        this.history.fetchRecent(),
      )
    ) {
      this.history.push({
        query,
        variables,
        headers,
        operationName,
      });
      const historyQueries = this.history.items;
      const favoriteQueries = this.favorite.items;
      this.queries = historyQueries.concat(favoriteQueries);
    }
  };

  // Public API
  toggleFavorite: HandleToggleFavoriteFn = (
    query,
    variables,
    headers,
    operationName,
    label,
    favorite,
  ) => {
    const item: QueryStoreItem = {
      query,
      variables,
      headers,
      operationName,
      label,
    };
    if (!this.favorite.contains(item)) {
      item.favorite = true;
      this.favorite.push(item);
    } else if (favorite) {
      item.favorite = false;
      this.favorite.delete(item);
    }
    this.queries = [...this.history.items, ...this.favorite.items];
  };

  // Public API
  editLabel: HandleEditLabelFn = (
    query,
    variables,
    headers,
    operationName,
    label,
    favorite,
  ) => {
    const item = {
      query,
      variables,
      headers,
      operationName,
      label,
    };
    if (favorite) {
      this.favorite.edit({ ...item, favorite });
    } else {
      this.history.edit(item);
    }
    this.queries = [...this.history.items, ...this.favorite.items];
  };
}
