import { parse } from 'graphql';

import { StorageAPI } from './base';
import { QueryStore, QueryStoreItem } from './query';

const MAX_QUERY_SIZE = 100000;

export class HistoryStore {
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

    this.queries = [...this.history.fetchAll(), ...this.favorite.fetchAll()];
  }

  private shouldSaveQuery(
    query?: string,
    variables?: string,
    headers?: string,
    lastQuerySaved?: QueryStoreItem,
  ) {
    if (!query) {
      return false;
    }

    try {
      parse(query);
    } catch {
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
  }

  updateHistory = (
    query?: string,
    variables?: string,
    headers?: string,
    operationName?: string,
    _id?: string,
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
        ...(_id && { _id }),
      });
      const historyQueries = this.history.items;
      const favoriteQueries = this.favorite.items;
      this.queries = historyQueries.concat(favoriteQueries);
    }
  };

  deleteHistory = (item: QueryStoreItem, clearFavorites = false) => {
    const { query, variables, headers, operationName, favorite, _id } = item;

    function deleteFromStore(store: QueryStore) {
      const found = store.items.find(
        x =>
          x.query === query &&
          x.variables === variables &&
          x.headers === headers &&
          x.operationName === operationName &&
          x._id === _id,
      );
      if (found) {
        store.delete(found);
      }
    }

    if (favorite || clearFavorites) {
      deleteFromStore(this.favorite);
    }
    if (!favorite || clearFavorites) {
      deleteFromStore(this.history);
    }

    this.queries = [...this.history.items, ...this.favorite.items];
  };

  toggleFavorite(
    query?: string,
    variables?: string,
    headers?: string,
    operationName?: string,
    label?: string,
    favorite?: boolean,
    _active?: boolean,
    _id?: string,
  ) {
    const item: QueryStoreItem = {
      query,
      variables,
      headers,
      operationName,
      label,
      _active,
      _id,
    };
    if (!this.favorite.contains(item)) {
      item.favorite = true;
      this.favorite.push(item);
    } else if (favorite) {
      item.favorite = false;
      this.favorite.delete(item);
      if (!this.history.contains(item)) {
        // in case was deleted from history then add it back -
        // editing labels doesn't adjust item in both favorites & history
        // so figured deleting shouldn't either maybe
        this.history.push(item);
      }
    }
    this.queries = [...this.history.items, ...this.favorite.items];
  }

  editLabel(
    query?: string,
    variables?: string,
    headers?: string,
    operationName?: string,
    label?: string,
    favorite?: boolean,
    _active?: boolean,
    _id?: string,
  ) {
    const item = {
      query,
      variables,
      headers,
      operationName,
      label,
      _active,
      _id,
    };
    if (favorite) {
      this.favorite.edit({ ...item, favorite });
    } else {
      this.history.edit(item);
    }
    this.queries = [...this.history.items, ...this.favorite.items];
  }

  setActive(item: QueryStoreItem) {
    const current = this.queries.find(x => x._active);
    if (current) {
      current._active = false;
    }
    item._active = true;
    this.queries = [...this.history.items, ...this.favorite.items];
  }
}
