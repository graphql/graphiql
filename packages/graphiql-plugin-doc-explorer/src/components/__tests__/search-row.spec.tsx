import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SearchRow } from '../search-row';

const getSearchResults = vi.hoisted(() =>
  vi.fn(() => ({ within: [], types: [], fields: [] })),
);

vi.mock('../../context', () => ({
  useDocExplorer: () => [{ name: 'Root' }],
  useDocExplorerActions: () => ({ push: vi.fn() }),
}));

vi.mock('../search', () => ({
  useSearchResults: () => getSearchResults,
}));

beforeEach(() => {
  vi.useFakeTimers();
  getSearchResults.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

it('cancels the pending search when unmounted', () => {
  const { unmount } = render(<SearchRow />);
  expect(getSearchResults).toHaveBeenCalledOnce();

  unmount();
  act(() => vi.advanceTimersByTime(200));

  expect(getSearchResults).toHaveBeenCalledOnce();
});
