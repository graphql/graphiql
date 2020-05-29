import { isJson, isObjectHasValues, isString } from './helper';
import {
  Storage,
  BaseStorage,
  OnFinishType,
  OnErrorType,
} from './storage.interface';
export class CustomStorage implements Storage {
  private storage: BaseStorage;
  constructor(storage: BaseStorage) {
    this.storage = storage;
  }
  setStorage(storage: BaseStorage): CustomStorage {
    this.storage = storage;
    return this;
  }
  async clear(onFinish?: OnFinishType, onError?: OnErrorType): Promise<void> {
    try {
      await this.storage.clear();
      if (onFinish) {
        return onFinish();
      }
    } catch (error) {
      if (onError) {
        return onError(error);
      }
    }
  }
  async getItem(
    key: string,
    onError?: OnErrorType,
  ): Promise<string | undefined> {
    if (isString(key)) {
      try {
        const res = await this.storage.getItem(key);
        return isJson(res) ? JSON.parse(res as string) : res;
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
    return this.storage.removeItem(key);
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
  async saveItem(
    key: string,
    value: any,
    onFinish?: OnFinishType,
    onError?: OnErrorType,
  ) {
    if (isString(key) && isString(value)) {
      try {
        value = isString(value) ? value : JSON.stringify(value);
        await this.storage.setItem(key, value);
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

export default new CustomStorage(localStorage);
