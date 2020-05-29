import { CustomStorage } from './index';
describe('storage test suite', () => {
  const storage = new CustomStorage(localStorage);
  beforeEach(() => {
    storage.clear();
  });
  it('should return null when getting a key that does not exist', () => {
    expect(storage.getItem('hello')).toBe(null);
  });
  it('should save item to storage', () => {
    storage.saveItem('hello', 'value');
    expect(storage.getItem('hello')).toBe('value');
  });
  it('should save multiple items', () => {
    storage.saveManyItems([
      {
        key1: 'hello',
        key2: 'there',
      },
    ]);
    expect(storage.getItem('key1')).toBe('hello');
    expect(storage.getItem('key2')).toBe('there');
  });
  it('should remove one item', () => {
    storage.saveItem('hello', 'value');
    storage.removeItem('hello');
    expect(storage.getItem('hello')).toBe(null);
  });
  it('should remove multiple items', () => {
    storage.saveManyItems([
      {
        key1: 'hello',
        key2: 'there',
      },
    ]);
    storage.removeManyItems(['key1', 'key2']);
    expect(storage.getItem('key1')).toBe(null);
    expect(storage.getItem('key2')).toBe(null);
  });
  it('should get multiple items', () => {
    storage.saveManyItems([
      {
        key1: 'hello',
        key2: 'there',
      },
    ]);
    expect(storage.getAllItems(['key1', 'key2'])).toEqual(['hello', 'there']);
  });
});
