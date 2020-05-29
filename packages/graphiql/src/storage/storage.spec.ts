import { CustomStorage } from './index';
describe('storage test suite', () => {
  const storage = new CustomStorage(localStorage);
  beforeEach(() => {
    storage.clear();
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
