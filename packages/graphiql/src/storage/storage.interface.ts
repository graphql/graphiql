export interface Storage {
  /**
   * Sets value for key and calls callback on completion, along with an Error if there is any
   */
  saveItem(
    key: string,
    value: string,
    callback?: (error?: Error) => void,
  ): Promise<void> | void;

  saveManyItems(payload: { [key in 'string' | 'number']: any }[]): void;
  /**
   * Fetches key and passes the result to callback, along with an Error if there is any.
   */
  getItem(
    key: string,
    callback?: (error?: Error, result?: string) => void,
  ): Promise<string | undefined> | string | undefined;

  getAllItems(
    keys: string[],
    onError?: OnErrorType,
  ): Promise<(string | undefined)[]> | (string | undefined)[];
  /**
   * Erases all AsyncStorage for all clients, libraries, etc. You probably don't want to call this.
   * Use removeItem or multiRemove to clear only your own keys instead.
   */
  clear(callback?: (error?: Error) => void): Promise<void>;
  // uses the native removeItem that's provided by localStorage
  // accepts a key of string and returns void.
  removeItem(key: string): void;
  // encapsulates te native removeItem that's provided by localStorage by looping through the given keys and pass each to removeItem.
  removeManyItems(keys: string[]): void;
}
export type OnFinishType = () => any;

export type OnErrorType = (error?: Error) => any;
export interface BaseStorage {
  getItem(key: string): string | null;
  clear(): void;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
