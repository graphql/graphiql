import { parse } from 'graphql';

import { StorageAPI } from './base';
import { QueryStore, QueryStoreItem } from './query';

const MAX_QUERY_SIZE = 100000;

export class HistoryStore {
  queries: Array<QueryStoreItem>;
  history: QueryStore;
  favorite: QueryStore;

  constructor(
    private storage: StorageAPI,
    private maxHistoryLength: number,
  ) {
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

  updateHistory = ({
    query,
    variables,
    headers,
    operationName,
  }: QueryStoreItem) => {
    if (
      !this.shouldSaveQuery(
        query,
        variables,
        headers,
        this.history.fetchRecent(),
      )
    ) {
      return;
    }
    this.history.push({
      query,
      variables,
      headers,
      operationName,
    });
    const historyQueries = this.history.items;
    const favoriteQueries = this.favorite.items;
    this.queries = historyQueries.concat(favoriteQueries);
  };

  toggleFavorite({
    query,
    variables,
    headers,
    operationName,
    label,
    favorite,
  }: QueryStoreItem) {
    const item: QueryStoreItem = {
      query,
      variables,
      headers,
      operationName,
      label,
    };
    if (favorite) {
      item.favorite = false;
      this.favorite.delete(item);
      this.history.push(item);
    } else {
      item.favorite = true;
      this.favorite.push(item);
      this.history.delete(item);
    }
    this.queries = [...this.history.items, ...this.favorite.items];
  }

  editLabel(
    {
      query,
      variables,
      headers,
      operationName,
      label,
      favorite,
    }: QueryStoreItem,
    index?: number,
  ) {
    const item = {
      query,
      variables,
      headers,
      operationName,
      label,
    };
    if (favorite) {
      this.favorite.edit({ ...item, favorite }, index);
    } else {
      this.history.edit(item, index);
    }
    this.queries = [...this.history.items, ...this.favorite.items];
  }

  deleteHistory = (
    { query, variables, headers, operationName, favorite }: QueryStoreItem,
    clearFavorites = false,
  ) => {
    function deleteFromStore(store: QueryStore) {
      const found = store.items.find(
        x =>
          x.query === query &&
          x.variables === variables &&
          x.headers === headers &&
          x.operationName === operationName,
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
}
