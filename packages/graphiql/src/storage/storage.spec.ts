import { CustomStorage } from './index';
describe('storage test suite', () => {
  const storage = CustomStorage.getInstance(localStorage);
  beforeEach(() => {
    storage.clear();
    storage.limit(0);
  });
  it('should fetch limited size of items when limit is set', async () => {
    await storage.saveItem('item', [1, 2, 3, 4, 5, 6]);
    expect(await storage.limit(2).getItem('item')).toEqual([1, 2]);
  });
  it('should push a value to an existing key at the storage that has a value of array', async () => {
    await storage.saveItem('item', [1, 2, 3]);
    await storage.push('item', 1);
    expect(await storage.getItem('item')).toEqual([1, 2, 3, 1]);
  });
  it('should fetch the last item by key from the local storage when its an array', async () => {
    await storage.saveItem('item', [1, 2, 3, 4, 5, 6]);
    expect(await storage.fetchLastItem('item')).toBe(6);
  });
  it('should delete from local storage when finding a matching criteria at the storage that has a value of array', async () => {
    await storage.saveItem('item', [1, 2, 3, 4, 5, 6]);
    await storage.deleteFromItem('item', 1);
    expect(await storage.getItem('item')).toMatchObject([2, 3, 4, 5, 6]);
  });
  it('should find at local storage the given key which has a value of array and edit its value', async () => {
    await storage.saveItem('item', [{ key: 'a' }, { key1: 'b' }]);
    await storage.edit('item', { key: 'key1', payload: 'c' });
    expect(await storage.getItem('item')).toEqual([
      { key: 'a' },
      { key1: 'c' },
    ]);
  });
  it('should check if local storage item contains a specific value', async () => {
    await storage.saveItem('item', [{ key: 'a' }, { key1: 'b' }]);
    expect(
      await storage.contains('item', (value, key) => {
        if (value.hasOwnProperty('key')) {
          return value.key === 'a';
        }
        return false;
      }),
    ).toBeTruthy();
  });
  it('should find at local storage the given key which has a value of object and edit its value', async () => {
    await storage.saveItem('item', {
      key: 'a',
      key1: {
        nested: 'object',
      },
    });
    await storage.edit('item', { key: 'key1', payload: 'c' });
    expect(await storage.getItem('item')).toEqual({ key: 'a', key1: 'c' });
  });
  it('should delete from local storage when finding a matching criteria at the storage that has a value of object', async () => {
    const object = {
      key: 'a',
      key1: 'b',
    };
    await storage.saveItem('item', object);
    await storage.deleteFromItem('item', 'key1');
    expect(await storage.getItem('item')).toEqual({ key: 'a' });
  });
  it('should push a value to an existing key at the storage that has a value of object', async () => {
    const object = {
      key: 'a',
      key1: 'b',
    };
    await storage.saveItem('item', object);
    await storage.push('item', {
      key2: {
        another: 'one',
      },
    });
    expect(await storage.getItem('item')).toEqual({
      ...object,
      key2: {
        another: 'one',
      },
    });
  });

  it('should return null when getting a key that does not exist', async () => {
    expect(await storage.getItem('hello')).toBe(null);
  });
  it('should save item to storage', async () => {
    await storage.saveItem('hello', 'value');
    expect(await storage.getItem('hello')).toBe('value');
  });
  it('should save multiple items', async () => {
    await storage.saveManyItems([
      {
        key1: 'hello',
        key2: 'there',
      },
    ]);
    expect(await storage.getItem('key1')).toBe('hello');
    expect(await storage.getItem('key2')).toBe('there');
  });
  it('should remove one item', async () => {
    await storage.saveItem('hello', 'value');
    await storage.removeItem('hello');
    expect(await storage.getItem('hello')).toBe(null);
  });
  it('should remove multiple items', async () => {
    await storage.saveManyItems([
      {
        key1: 'hello',
        key2: 'there',
      },
    ]);
    await storage.removeManyItems(['key1', 'key2']);
    expect(await storage.getItem('key1')).toBe(null);
    expect(await storage.getItem('key2')).toBe(null);
  });
  it('should get multiple items', async () => {
    await storage.saveManyItems([
      {
        key1: 'hello',
        key2: 'there',
      },
    ]);
    expect(await storage.getAllItems(['key1', 'key2'])).toEqual([
      'hello',
      'there',
    ]);
  });
});
