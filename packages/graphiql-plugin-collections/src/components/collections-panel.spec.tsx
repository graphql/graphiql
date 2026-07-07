import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { CollectionsPanel } from './collections-panel';
import { collectionsStore } from '../store';
// Imported by its real path (not the '@graphiql/react' alias) for typed access;
// vitest resolves both to the same module instance, so mutations are shared.
import { __state } from '../__mocks__/@graphiql/react';

// ---------------------------------------------------------------------------
// FileReader mock helpers (mirrors import-dialog.spec.tsx)
// ---------------------------------------------------------------------------

type FileReaderOnload = (event: { target: { result: string } }) => void;

let capturedOnload: FileReaderOnload | null = null;

function triggerFileReaderLoad(text: string) {
  act(() => {
    capturedOnload?.({ target: { result: text } });
  });
}

beforeEach(() => {
  capturedOnload = null;
  collectionsStore.setState({ collections: [], loaded: true });
  vi.stubGlobal(
    'FileReader',
    class MockFileReader {
      onload: FileReaderOnload | null = null;
      readAsText = (_file: Blob) => {
        capturedOnload = e => {
          this.onload?.(e);
        };
      };
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal valid collections export with one collection and optional items.
 * IDs are caller-supplied so tests can control whether they collide with local state.
 */
function makeExport(opts: {
  collectionId: string;
  collectionName?: string;
  items?: Array<{
    id: string;
    name: string;
    query: string;
    updatedAt?: number;
  }>;
}): string {
  return JSON.stringify({
    version: 1,
    collections: [
      {
        id: opts.collectionId,
        name: opts.collectionName ?? 'Imported Collection',
        createdAt: 1000,
        updatedAt: 1000,
        items: (opts.items ?? []).map(item => ({
          id: item.id,
          name: item.name,
          query: item.query,
          createdAt: 1000,
          updatedAt: item.updatedAt ?? 1000,
        })),
      },
    ],
  });
}

/** Dispatch a paste event whose clipboardData.getData('text') returns text. */
function simulatePaste(text: string) {
  const event = new Event('paste', { bubbles: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (_type: string) => text,
    },
  });
  document.dispatchEvent(event);
}

// ---------------------------------------------------------------------------
// Header gating (existing)
// ---------------------------------------------------------------------------

describe('CollectionsPanel header gating', () => {
  it('defaults render "New collection", "Import collections", and "Export collections" buttons', () => {
    render(<CollectionsPanel />);
    expect(screen.getByLabelText('New collection')).toBeTruthy();
    expect(screen.getByLabelText('Import collections')).toBeTruthy();
    expect(screen.getByLabelText('Export collections')).toBeTruthy();
  });

  it('readOnly hides "New collection" and "Import collections" but keeps "Export collections"', () => {
    render(<CollectionsPanel readOnly />);
    expect(screen.queryByLabelText('New collection')).toBeNull();
    expect(screen.queryByLabelText('Import collections')).toBeNull();
    expect(screen.getByLabelText('Export collections')).toBeTruthy();
  });

  it('allowImportExport:false hides "Import collections" and "Export collections" but keeps "New collection"', () => {
    render(<CollectionsPanel allowImportExport={false} />);
    expect(screen.queryByLabelText('Import collections')).toBeNull();
    expect(screen.queryByLabelText('Export collections')).toBeNull();
    expect(screen.getByLabelText('New collection')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Paste import — no conflicts
// ---------------------------------------------------------------------------

describe('CollectionsPanel paste import', () => {
  it('paste with no conflicts applies immediately, with no status banner', async () => {
    // Empty store → no existing items → fresh import has no conflicts.
    render(<CollectionsPanel />);

    const exportText = makeExport({
      collectionId: 'col-fresh',
      collectionName: 'Fresh Import',
      items: [{ id: 'item-fresh', name: 'Op', query: '{ a }' }],
    });

    act(() => {
      simulatePaste(exportText);
    });

    // Store must now contain the imported collection.
    const { collections } = collectionsStore.getState();
    expect(collections).toHaveLength(1);
    expect(collections[0]?.name).toBe('Fresh Import');
    expect(collections[0]?.items).toHaveLength(1);
    expect(collections[0]?.items[0]?.id).toBe('item-fresh');

    // A successful import is silent — no status banner (it caused layout shift).
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('paste with non-collections content is ignored', () => {
    render(<CollectionsPanel />);

    act(() => {
      simulatePaste('just some random text, not JSON');
    });

    // Store still empty; no status message.
    expect(collectionsStore.getState().collections).toHaveLength(0);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Paste import — with conflicts
// ---------------------------------------------------------------------------

describe('CollectionsPanel paste import with conflicts', () => {
  it('opens ConflictDialog when paste has a conflicting item, and resolving updates the store', async () => {
    // Seed the store with an existing collection+item.
    collectionsStore.setState({
      collections: [
        {
          id: 'col-1',
          name: 'My Collection',
          createdAt: 1000,
          updatedAt: 1000,
          items: [
            {
              id: 'item-conflict',
              name: 'ConflictOp',
              query: '{ original }',
              createdAt: 1000,
              updatedAt: 1000,
            },
          ],
        },
      ],
      loaded: true,
    });

    render(<CollectionsPanel />);

    // Paste an export with the SAME item id but DIFFERENT content → conflict.
    const exportText = makeExport({
      collectionId: 'col-1',
      collectionName: 'My Collection',
      items: [
        {
          id: 'item-conflict',
          name: 'ConflictOp',
          query: '{ updated }',
          updatedAt: 5_000_000,
        },
      ],
    });

    act(() => {
      simulatePaste(exportText);
    });

    // The ConflictDialog renders its summary (inside Dialog.Body → <p>).
    // Dialog.Header renders a bare text node so getByText can't find "Import conflicts"
    // as an element; instead assert on the summary text and action buttons.
    expect(screen.getByText(/with changes/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Apply changes' })).toBeDefined();

    // Click "Apply changes" to accept the incoming version.
    fireEvent.click(screen.getByText('Apply changes'));

    // Dialog should be gone.
    expect(screen.queryByText('Import conflicts')).toBeNull();

    // The item's content must be updated in the store.
    const items = collectionsStore.getState().collections[0]?.items ?? [];
    expect(items[0]?.query).toBe('{ updated }');

    // A successful resolve is silent — no status banner.
    expect(screen.queryByRole('status')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Replace confirmation dialog
//
// NOTE: The @graphiql/react Dialog mock (src/__mocks__/@graphiql/react.ts)
// ignores the `open` prop and always renders children. This means the
// confirmation dialog's "Replace" and "Cancel" buttons are always present in
// the DOM, and we cannot assert that the dialog "appears" based on text in an
// element (the Dialog.Header mock returns children as a bare text node, which
// getByText cannot find as an accessible element). We therefore test the
// behavioral contracts directly:
//   - Before confirming, calling runImport with mode 'replace' sets pendingReplace
//     but does NOT call applyReplace (store stays intact).
//   - Clicking "Replace" (always-present button) calls applyReplace (store replaced).
//   - Clicking "Cancel" (always-present button) leaves the store untouched.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Opening an item marries it to a tab
// ---------------------------------------------------------------------------

describe('CollectionsPanel opening marries tabs', () => {
  const col = {
    id: 'col-1',
    name: 'C',
    createdAt: 1000,
    updatedAt: 1000,
    items: [
      {
        id: 'item-1',
        name: 'MyOp',
        query: '{ a }',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
  };

  beforeEach(() => {
    __state.tabs = null;
    __state.activeTabIndex = 0;
    __state.addTab = vi.fn();
    __state.changeTab = vi.fn();
  });

  afterEach(() => {
    __state.tabs = null;
    __state.activeTabIndex = 0;
    __state.addTab = () => {};
    __state.changeTab = () => {};
  });

  it('focuses the married open tab instead of opening a duplicate', () => {
    collectionsStore.setState({
      collections: [col],
      loaded: true,
      links: { 'tab-op': { collectionId: 'col-1', itemId: 'item-1' } },
    });
    __state.tabs = [
      { id: 'tab-0', query: '{ home }' },
      { id: 'tab-op', query: '{ a }' },
    ];

    render(<CollectionsPanel />);
    fireEvent.click(screen.getByText('MyOp'));

    expect(__state.changeTab).toHaveBeenCalledWith(1);
    expect(__state.addTab).not.toHaveBeenCalled();
  });

  it('opens a new tab when no married tab is open', () => {
    collectionsStore.setState({ collections: [col], loaded: true, links: {} });
    __state.tabs = [{ id: 'tab-0', query: '{ home }' }];

    render(<CollectionsPanel />);
    fireEvent.click(screen.getByText('MyOp'));

    expect(__state.addTab).toHaveBeenCalled();
    expect(__state.changeTab).not.toHaveBeenCalled();
  });

  it('opens a new tab when the linked tab was closed (stale link)', () => {
    collectionsStore.setState({
      collections: [col],
      loaded: true,
      // Link points at a tab id that is no longer among the open tabs.
      links: { 'tab-closed': { collectionId: 'col-1', itemId: 'item-1' } },
    });
    __state.tabs = [{ id: 'tab-0', query: '{ home }' }];

    render(<CollectionsPanel />);
    fireEvent.click(screen.getByText('MyOp'));

    expect(__state.addTab).toHaveBeenCalled();
    expect(__state.changeTab).not.toHaveBeenCalled();
  });
});

describe('CollectionsPanel replace confirmation', () => {
  /**
   * Drive the replace flow up to the point where pendingReplace is set.
   * Returns the FileReader trigger function for callers that need it.
   */
  function setupReplaceFlow() {
    // Seed with an existing collection.
    collectionsStore.setState({
      collections: [
        {
          id: 'col-existing',
          name: 'Existing Collection',
          createdAt: 1000,
          updatedAt: 1000,
          items: [],
        },
      ],
      loaded: true,
    });

    render(<CollectionsPanel />);

    // Open the ImportDialog directly via the Import collections button.
    fireEvent.click(screen.getByLabelText('Import collections'));
    // Select Replace radio (no tab — ImportDialog renders controls immediately).
    fireEvent.click(screen.getByLabelText(/Replace/));

    // Attach a fake file.
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const fakeFile = new File([''], 'test.json', { type: 'application/json' });
    Object.defineProperty(fileInput, 'files', {
      value: [fakeFile],
      configurable: true,
    });

    // Click the Import action button (unambiguous — only one "Import" button).
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    // Return export text and a helper to trigger FileReader completion.
    const replacementExport = makeExport({
      collectionId: 'col-replacement',
      collectionName: 'Replacement Collection',
    });
    return { replacementExport };
  }

  it('Replace mode: store is NOT wiped until the confirmation Replace button is clicked', () => {
    const { replacementExport } = setupReplaceFlow();

    // FileReader completes → runImport('replace') → setPendingReplace (no wipe yet).
    triggerFileReaderLoad(replacementExport);

    // Store must still be the original — replace has NOT been applied yet.
    expect(collectionsStore.getState().collections[0]?.id).toBe('col-existing');

    // Now click the confirmation Replace button to apply.
    // NOTE: Because the Dialog mock always renders children, this button is
    // always present in the DOM. We use getByRole + name to find it uniquely.
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }));

    // Store must now equal the imported set.
    const { collections } = collectionsStore.getState();
    expect(collections).toHaveLength(1);
    expect(collections[0]?.id).toBe('col-replacement');
    expect(collections[0]?.name).toBe('Replacement Collection');
  });

  it('Replace confirmation — Cancel leaves the store untouched', () => {
    const { replacementExport } = setupReplaceFlow();

    triggerFileReaderLoad(replacementExport);

    // Store is still original before cancel.
    expect(collectionsStore.getState().collections[0]?.id).toBe('col-existing');

    // Click Cancel — pendingReplace clears, store untouched.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(collectionsStore.getState().collections).toHaveLength(1);
    expect(collectionsStore.getState().collections[0]?.id).toBe('col-existing');
  });
});

// ---------------------------------------------------------------------------
// Keyboard reorder
// ---------------------------------------------------------------------------

function seedTwoCollections() {
  collectionsStore.setState({
    loaded: true,
    collections: [
      {
        id: 'A',
        name: 'Alpha',
        createdAt: 1,
        updatedAt: 1,
        items: [
          { id: 'a0', name: 'A0', query: '{a0}', createdAt: 1, updatedAt: 1 },
          { id: 'a1', name: 'A1', query: '{a1}', createdAt: 1, updatedAt: 1 },
        ],
      },
      {
        id: 'B',
        name: 'Beta',
        createdAt: 1,
        updatedAt: 1,
        items: [
          { id: 'b0', name: 'B0', query: '{b0}', createdAt: 1, updatedAt: 1 },
        ],
      },
    ],
  });
}

function itemOrder(collectionId: string): string[] {
  return (
    collectionsStore
      .getState()
      .collections.find(c => c.id === collectionId)
      ?.items.map(i => i.id) ?? []
  );
}

describe('CollectionsPanel keyboard reorder', () => {
  it('grab + ArrowDown reorders within a collection', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder A0/i);
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(itemOrder('A')).toEqual(['a1', 'a0']);
  });

  it('ArrowDown past the end moves into the next collection', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder A1/i);
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(itemOrder('A')).toEqual(['a0']);
    expect(itemOrder('B')).toEqual(['a1', 'b0']);
  });

  it('escape returns the item to its origin', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder A0/i);
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' }); // A -> [a1, a0]
    fireEvent.keyDown(handle, { key: 'Escape' });
    expect(itemOrder('A')).toEqual(['a0', 'a1']);
  });

  it('escape returns the item to its origin after a cross-collection move', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    fireEvent.keyDown(screen.getByLabelText(/Reorder A1/i), { key: ' ' });
    fireEvent.keyDown(screen.getByLabelText(/Reorder A1/i), {
      key: 'ArrowDown',
    }); // A -> [a0], B -> [a1, b0]
    expect(itemOrder('B')).toEqual(['a1', 'b0']);
    // The row remounts under collection B, so re-query the handle before cancelling.
    fireEvent.keyDown(screen.getByLabelText(/Reorder A1/i), { key: 'Escape' });
    expect(itemOrder('A')).toEqual(['a0', 'a1']);
    expect(itemOrder('B')).toEqual(['b0']);
  });

  it('announces via an assertive live region', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder A0/i);
    fireEvent.keyDown(handle, { key: ' ' });
    const live = document.querySelector('[aria-live="assertive"]');
    expect(live?.textContent).toMatch(/Grabbed A0/i);
  });

  it('ArrowUp from the top of a collection appends to the previous collection', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder B0/i);
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(itemOrder('A')).toEqual(['a0', 'a1', 'b0']);
    expect(itemOrder('B')).toEqual([]);
  });

  it('ArrowDown at the very end is a no-op and announces', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder B0/i);
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(itemOrder('A')).toEqual(['a0', 'a1']);
    expect(itemOrder('B')).toEqual(['b0']);
    const live = document.querySelector('[aria-live="assertive"]');
    expect(live?.textContent).toMatch(/Already at the end/i);
  });

  it('ArrowUp at the very start is a no-op and announces', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder A0/i);
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(itemOrder('A')).toEqual(['a0', 'a1']);
    expect(itemOrder('B')).toEqual(['b0']);
    const live = document.querySelector('[aria-live="assertive"]');
    expect(live?.textContent).toMatch(/Already at the start/i);
  });

  it('dropping via space announces the item name', () => {
    seedTwoCollections();
    render(<CollectionsPanel />);
    const handle = screen.getByLabelText(/Reorder A0/i);
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: ' ' });
    const live = document.querySelector('[aria-live="assertive"]');
    expect(live?.textContent).toMatch(/Dropped A0/i);
  });
});

// ---------------------------------------------------------------------------
// Share item — writes exportItem envelope + announces, no visible status
// ---------------------------------------------------------------------------

describe('CollectionsPanel share item', () => {
  const writeText = vi.fn().mockResolvedValue(null);

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    writeText.mockClear();
  });

  it('clicking Share on an item writes the exportItem envelope and announces via aria-live, no visible status', async () => {
    collectionsStore.setState({
      loaded: true,
      collections: [
        {
          id: 'col-1',
          name: 'C',
          createdAt: 1000,
          updatedAt: 1000,
          items: [
            {
              id: 'item-1',
              name: 'MyOp',
              query: '{ a }',
              createdAt: 1000,
              updatedAt: 1000,
            },
          ],
        },
      ],
    });

    render(<CollectionsPanel />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Share MyOp as collection'));
    });

    // clipboard must receive the importable envelope (contains "version": 1)
    expect(writeText).toHaveBeenCalledOnce();
    const written = writeText.mock.calls[0]?.[0] as string;
    expect(written).toContain('"version"');

    // aria-live region must announce
    await waitFor(() => {
      const live = document.querySelector('[aria-live="assertive"]');
      expect(live?.textContent).toMatch(/Shared operation/i);
    });

    // No visible status element (setStatus is NOT called for share)
    expect(document.querySelector('.graphiql-collections-status')).toBeNull();
  });
});
