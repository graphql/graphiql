import { isJson, isObjectHasValues, isString } from './helper';
import {
  Storage,
  BaseStorage,
  OnFinishType,
  OnErrorType,
} from './storage.interface';

export class CustomStorage implements Storage {
  private static storage: BaseStorage;
  private static instance: CustomStorage;
  private maxSize: number = 0;
  private constructor(storage: BaseStorage) {
    CustomStorage.storage = storage;
  }
  static getInstance(storage?: BaseStorage): CustomStorage {
    if (!storage && !CustomStorage.instance) {
      throw new Error('storage is not defined yet.');
    }
    if (!CustomStorage.instance) {
      CustomStorage.instance = new CustomStorage(storage as BaseStorage);
    }
    return CustomStorage.instance;
  }
  static setStorage(storage: BaseStorage): CustomStorage {
    CustomStorage.storage = storage;
    return CustomStorage.getInstance();
  }
  async getAll() {
    const namespaces = await this.getItem('namespaces');
    return this.getAllItems(namespaces);
  }
  async clear(onFinish?: OnFinishType, onError?: OnErrorType): Promise<void> {
    try {
      await CustomStorage.storage.clear();
      if (onFinish) {
        return onFinish();
      }
    } catch (error) {
      if (onError) {
        return onError(error);
      }
    }
  }
  async getItem(key: string, onError?: OnErrorType): Promise<any> {
    if (isString(key)) {
      try {
        const res = await CustomStorage.storage.getItem(key);
        if (isJson(res)) {
          const parsed = JSON.parse(res as string);
          if (Array.isArray(parsed) && this.maxSize) {
            return parsed.slice(0, this.maxSize);
          }
          return parsed;
        }
        return res;
      } catch (error) {
        if (onError) {
          return onError(error);
        }
      }
    }
  }

  async getAllItems(
    keys: string[],
    onError?: OnErrorType,
  ): Promise<(string | undefined)[]> {
    const data: (string | undefined)[] = [];
    await Promise.all(
      keys.map(async key => {
        data.push(await this.getItem(key));
      }),
    );
    return data;
  }
  async removeItem(key: string) {
    return CustomStorage.storage.removeItem(key);
  }
  async removeManyItems(keys: string[]) {
    keys.map(async key => await this.removeItem(key));
  }
  async saveManyItems(payload: { [key: string]: any }[]) {
    return Promise.all(
      payload.map(value => {
        Object.keys(value).map(async key => {
          await this.saveItem(key, value[key]);
        });
      }),
    );
  }
  limit(limit: number) {
    this.maxSize = limit;
    return this;
  }
  async edit(
    storageKey: string,
    { key, payload }: { key: string; payload: any },
  ) {
    const item = await this.getItem(storageKey);
    if (Array.isArray(item)) {
      // array of objects.
      item.forEach(v => {
        if (v.hasOwnProperty(key)) {
          v[key] = payload;
        }
      });
    }
    if (item instanceof Object && item.hasOwnProperty(key)) {
      item[key] = payload;
    }
    this.saveItem(storageKey, item);
  }
  async contains(
    storageKey: string,
    callback: (value: any, key: string) => boolean,
  ) {
    const item = await this.getItem(storageKey);
    let array = item;
    if (!Array.isArray(item)) {
      array = [];
      Object.keys(item).forEach(value => array.push({ [value]: item[value] }));
    }
    return array.some((value: any, key: string) => callback(value, key));
  }
  async fetchLastItem(key: string) {
    const item = await this.getItem(key);
    if (Array.isArray(item)) {
      return item[item.length - 1];
    }
  }
  async deleteFromItem(keyStorage: string, payload: any) {
    let item = await this.getItem(keyStorage);
    if (!item) {
      return;
    }
    if (Array.isArray(item)) {
      item = item.filter(
        value => JSON.stringify(value) !== JSON.stringify(payload),
      );
    }
    if (
      item instanceof Object &&
      !(item instanceof Array) &&
      item.hasOwnProperty(payload)
    ) {
      const { [payload]: value, ...rest } = item;
      item = rest;
    }
    this.saveItem(keyStorage, item);
  }
  async push(
    key: string,
    value: any,
    onFinish?: OnFinishType,
    onError?: OnErrorType,
  ) {
    const item = await this.getItem(key);
    if (!item) {
      return;
    }
    if (Array.isArray(item)) {
      const hasItem = item.some(v => v === value);
      if (!hasItem) {
        value = JSON.stringify([...item, value]);
      }
    }
    if (item instanceof Object && !(item instanceof Array)) {
      value = JSON.stringify({ ...item, ...value });
    }
    try {
      await this.saveItem(key, value);
      if (onFinish) {
        return onFinish();
      }
    } catch (error) {
      if (onError) {
        return onError(error);
      }
    }
  }
  async saveItem(
    key: string,
    value: any,
    onFinish?: OnFinishType,
    onError?: OnErrorType,
  ) {
    if (isString(key)) {
      try {
        value = isString(value) ? value : JSON.stringify(value);
        await CustomStorage.storage.setItem(key, value);
        if (onFinish) {
          return onFinish();
        }
      } catch (error) {
        if (onError) {
          return onError(error);
        }
      }
    }
  }
}
const storage = CustomStorage.getInstance(localStorage);
export default storage;
