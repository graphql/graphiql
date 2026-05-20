import {
  parse,
  type DocumentNode,
  type OperationDefinitionNode,
} from 'graphql';

import { StorageAPI } from './base';
import { QueryStore, QueryStoreItem } from './query';

const MAX_QUERY_SIZE = 100000;

export class HistoryStore {
  queries: QueryStoreItem[];
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

  private parseForHistory(
    query: string | undefined,
    variables: string | undefined,
    headers: string | undefined,
    lastQuerySaved: QueryStoreItem | undefined,
  ): DocumentNode | null {
    if (!query || query.length > MAX_QUERY_SIZE) {
      return null;
    }
    let document: DocumentNode;
    try {
      document = parse(query);
    } catch {
      return null;
    }
    if (lastQuerySaved) {
      if (JSON.stringify(query) === JSON.stringify(lastQuerySaved.query)) {
        if (
          JSON.stringify(variables) === JSON.stringify(lastQuerySaved.variables)
        ) {
          if (
            JSON.stringify(headers) === JSON.stringify(lastQuerySaved.headers)
          ) {
            return null;
          }
          if (headers && !lastQuerySaved.headers) {
            return null;
          }
        }
        if (variables && !lastQuerySaved.variables) {
          return null;
        }
      }
    }
    return document;
  }

  updateHistory = ({
    query,
    variables,
    headers,
    operationName,
  }: QueryStoreItem) => {
    const document = this.parseForHistory(
      query,
      variables,
      headers,
      this.history.fetchRecent(),
    );
    if (!document) {
      return;
    }
    const operation = document.definitions.find(
      (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
    )?.operation;
    this.history.push({
      query,
      variables,
      headers,
      operationName,
      operation,
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
    operation,
    label,
    favorite,
  }: QueryStoreItem) {
    const item: QueryStoreItem = {
      query,
      variables,
      headers,
      operationName,
      operation,
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
      operation,
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
      operation,
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
