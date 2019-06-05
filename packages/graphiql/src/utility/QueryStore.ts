<<<<<<< HEAD:packages/graphiql/src/utility/QueryStore.js
/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

 export default class QueryStore {
  constructor(key, storage) {
=======
import StorageAPI from './StorageAPI';

type GraphQLQueryItem = {
  query: string;
  variables: any;
  operationName: string;
};

export default class QueryStore {
  items: GraphQLQueryItem[];
  storage: StorageAPI;
  key: string

  constructor(key: string, storage: StorageAPI) {
>>>>>>> c8c4756... begin graphiql typescript conversion:packages/graphiql/src/utility/QueryStore.ts
    this.key = key;
    this.storage = storage;
    this.items = this.fetchAll();
  }

  get length() {
    return this.items.length;
  }

  contains(item: GraphQLQueryItem) {
    return this.items.some(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.operationName === item.operationName,
    );
  }

  edit(item: GraphQLQueryItem) {
    const itemIndex = this.items.findIndex(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.operationName === item.operationName,
    );
    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1, item);
      this.save();
    }
  }

  delete(item: GraphQLQueryItem) {
    const itemIndex = this.items.findIndex(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.operationName === item.operationName,
    );
    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
      this.save();
    }
  }

  fetchRecent() {
    return this.items[this.items.length - 1];
  }

  fetchAll() {
    const raw = this.storage.get(this.key);
    if (raw) {
      return JSON.parse(raw)[this.key];
    }
    return [];
  }

  push(item: GraphQLQueryItem) {
    this.items.push(item);
    this.save();
  }

  shift() {
    this.items.shift();
    this.save();
  }

  save() {
    this.storage.set(this.key, JSON.stringify({ [this.key]: this.items }));
  }
}
