import { renderHook } from '@testing-library/react';
import { useKeyMap } from '../hooks';
import { CodeMirrorEditor, KeyMap } from '../types';

describe('hooks', () => {
  describe('useKeyMap', () => {
    it('works correctly', () => {
      type KeyMap = Record<string, typeof jest.fn>;
      let keys: KeyMap = {};
      const editor: Pick<CodeMirrorEditor, 'addKeyMap' | 'removeKeyMap'> = {
        addKeyMap: jest.fn(keyMap => {
          keys = { ...keys, ...(keyMap as KeyMap) };
        }),
        removeKeyMap: jest.fn((key: string) => {
          delete keys[key];
        }),
      };
      const callback = jest.fn();
      const { unmount } = renderHook(() =>
        useKeyMap(
          editor as unknown as CodeMirrorEditor,
          ['foo', 'bar'],
          callback,
        ),
      );
      expect(Object.keys(keys).length).toBe(2);
      unmount();
      expect(Object.keys(keys).length).toBe(0);
    });
  });
});
