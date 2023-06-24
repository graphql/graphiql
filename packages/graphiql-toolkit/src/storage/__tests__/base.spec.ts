import { StorageAPI } from '../base';

describe('StorageAPI', () => {
  let storage = new StorageAPI();

  beforeEach(() => {
    storage = new StorageAPI();
  });

  it('returns nothing if no value set', () => {
    const result = storage.get('key1');
    expect(result).toBeNull();
  });

  it('sets and gets a value correctly', () => {
    const result = storage.set('key2', 'value');
    expect(result).toEqual({
      error: null,
      isQuotaError: false,
    });

    const newResult = storage.get('key2');
    expect(newResult).toEqual('value');
  });

  it('sets and removes a value correctly', () => {
    let result = storage.set('key3', 'value');
    expect(result).toEqual({
      error: null,
      isQuotaError: false,
    });

    result = storage.set('key3', '');
    expect(result).toEqual({
      error: null,
      isQuotaError: false,
    });

    const getResult = storage.get('key3');
    expect(getResult).toBeNull();
  });

  it('sets and overrides a value correctly', () => {
    let result = storage.set('key4', 'value');
    expect(result).toEqual({
      error: null,
      isQuotaError: false,
    });

    result = storage.set('key4', 'value2');
    expect(result).toEqual({
      error: null,
      isQuotaError: false,
    });

    const getResult = storage.get('key4');
    expect(getResult).toEqual('value2');
  });

  it('cleans up `null` value', () => {
    storage.set('key5', 'null');
    const result = storage.get('key5');
    expect(result).toBeNull();
  });

  it('cleans up `undefined` value', () => {
    storage.set('key6', 'undefined');
    const result = storage.get('key6');
    expect(result).toBeNull();
  });

  it('returns any error while setting a value', () => {
    // @ts-ignore
    const throwingStorage = new StorageAPI({
      setItem() {
        throw new DOMException('Terrible Error');
      },
      length: 1,
    });
    const result = throwingStorage.set('key', 'value');

    expect(result.error.message).toEqual('Terrible Error');
    expect(result.isQuotaError).toBe(false);
  });

  it('returns isQuotaError to true if isQuotaError is thrown', () => {
    // @ts-ignore
    const throwingStorage = new StorageAPI({
      setItem() {
        throw new DOMException('Terrible Error', 'QuotaExceededError');
      },
      length: 1,
    });
    const result = throwingStorage.set('key', 'value');

    expect(result.error.message).toEqual('Terrible Error');
    expect(result.isQuotaError).toBe(true);
  });
});
