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
        onFinish();
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  }
  getItem(key: string, onError?: OnErrorType): string | undefined {
    if (isString(key)) {
      try {
        const res = this.storage.getItem(key);
        return isJson(res) ? JSON.parse(res as string) : res;
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    }
  }

  getAllItems(keys: string[], onError?: OnErrorType): (string | undefined)[] {
    const data: (string | undefined)[] = [];
    keys.forEach(key => {
      data.push(this.getItem(key));
    });
    return data;
  }
  removeItem(key: string) {
    return this.storage.removeItem(key);
  }
  removeManyItems(keys: string[]) {
    keys.forEach(key => this.removeItem(key));
  }
  saveManyItems(payload: { [key: string]: any }[]) {
    payload.forEach(value => {
      Object.keys(value).map(key => {
        this.saveItem(key, value[key]);
      });
    });
  }
  saveItem(
    key: string,
    value: any,
    onFinish?: OnFinishType,
    onError?: OnErrorType,
  ) {
    if (isString(key) && isString(value)) {
      try {
        value = isString(value) ? value : JSON.stringify(value);
        this.storage.setItem(key, value);
        if (onFinish) {
          onFinish();
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    }
  }
}

export default new CustomStorage(localStorage);
