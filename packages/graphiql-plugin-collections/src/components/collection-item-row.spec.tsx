import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  act,
  waitFor,
} from '@testing-library/react';
import { CollectionItemRow } from './collection-item-row';
import type { CollectionItem } from '../types';

const item: CollectionItem = {
  id: 'item-1',
  name: 'MyOperation',
  query: '{ __typename }',
  createdAt: 1000,
  updatedAt: 1000,
};

function renderRow(
  overrides: Partial<Parameters<typeof CollectionItemRow>[0]> = {},
) {
  const onOpen = vi.fn();
  const onShare = vi.fn().mockResolvedValue(null);
  const onAnnounce = vi.fn();
  const onDelete = vi.fn();
  const onMove = vi.fn();
  const onRenameItem = vi.fn();
  const onGrabToggle = vi.fn();
  const onGrabMove = vi.fn();
  const onGrabCancel = vi.fn();
  render(
    <CollectionItemRow
      item={item}
      collectionId="col-1"
      index={0}
      isGrabbed={false}
      onGrabToggle={onGrabToggle}
      onGrabMove={onGrabMove}
      onGrabCancel={onGrabCancel}
      onOpen={onOpen}
      onShare={onShare}
      onAnnounce={onAnnounce}
      onDelete={onDelete}
      onMove={onMove}
      onRenameItem={onRenameItem}
      {...overrides}
    />,
  );
  return {
    onOpen,
    onShare,
    onAnnounce,
    onDelete,
    onMove,
    onRenameItem,
    onGrabToggle,
    onGrabMove,
    onGrabCancel,
  };
}

// Set up clipboard mock before tests
const writeText = vi.fn().mockResolvedValue(null);

afterEach(() => {
  writeText.mockClear();
  vi.useRealTimers();
});

describe('CollectionItemRow actions', () => {
  it('renders edit, copy, share, and delete buttons and no kebab or Open', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow();
    expect(screen.getByLabelText('Rename')).toBeTruthy();
    expect(screen.getByLabelText('Copy operation')).toBeTruthy();
    expect(screen.getByLabelText('Share as collection')).toBeTruthy();
    expect(screen.getByLabelText('Delete')).toBeTruthy();
    expect(screen.queryByText('···')).toBeNull();
    expect(screen.queryByText('Open')).toBeNull();
  });

  it('clicking copy writes item.query to clipboard and announces, not onOpen', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onOpen, onAnnounce } = renderRow();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Copy operation'));
    });
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith('{ __typename }');
    expect(onAnnounce).toHaveBeenCalledWith('Copied query to clipboard.');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking copy shows confirmed state then reverts after 1500ms', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Copy operation'));
    });
    expect(
      screen.getByLabelText('Copy operation').getAttribute('data-confirmed'),
    ).toBe('true');
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(
      screen.getByLabelText('Copy operation').getAttribute('data-confirmed'),
    ).toBeNull();
  });

  it('clicking share calls onShare with the item id and announces', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onShare, onAnnounce, onOpen } = renderRow();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Share as collection'));
    });
    expect(onShare).toHaveBeenCalledOnce();
    expect(onShare).toHaveBeenCalledWith('item-1');
    expect(onAnnounce).toHaveBeenCalledWith('Shared operation to clipboard.');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking share shows confirmed state then reverts after 1500ms', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Share as collection'));
    });
    expect(
      screen
        .getByLabelText('Share as collection')
        .getAttribute('data-confirmed'),
    ).toBe('true');
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(
      screen
        .getByLabelText('Share as collection')
        .getAttribute('data-confirmed'),
    ).toBeNull();
  });

  it('copy failure announces an error and does not enter the confirmed state', async () => {
    const rejectingWriteText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: rejectingWriteText },
      configurable: true,
    });
    const { onAnnounce } = renderRow();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Copy operation'));
    });
    await waitFor(() => {
      expect(onAnnounce).toHaveBeenCalledWith(
        expect.stringMatching(/Could not copy/i),
      );
    });
    expect(
      screen.getByLabelText('Copy operation').getAttribute('data-confirmed'),
    ).toBeNull();
  });

  it('share failure announces an error and does not enter the confirmed state', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const onShare = vi.fn().mockRejectedValue(new Error('denied'));
    const { onAnnounce } = renderRow({ onShare });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Share as collection'));
    });
    await waitFor(() => {
      expect(onAnnounce).toHaveBeenCalledWith(
        expect.stringMatching(/Could not share/i),
      );
    });
    expect(
      screen
        .getByLabelText('Share as collection')
        .getAttribute('data-confirmed'),
    ).toBeNull();
  });

  it('clicking delete calls onDelete with collectionId and itemId, not onOpen', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onDelete, onOpen } = renderRow();
    fireEvent.click(screen.getByLabelText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('col-1', 'item-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking the row still opens the item', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onOpen } = renderRow();
    fireEvent.click(screen.getByText('MyOperation'));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('readOnly hides edit and delete but keeps copy and share', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow({ readOnly: true });
    expect(screen.queryByLabelText('Rename')).toBeNull();
    expect(screen.queryByLabelText('Delete')).toBeNull();
    expect(screen.getByLabelText('Copy operation')).toBeTruthy();
    expect(screen.getByLabelText('Share as collection')).toBeTruthy();
  });
});

describe('CollectionItemRow inline edit', () => {
  it('pencil button enters edit mode and does not open the item', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onOpen } = renderRow();
    const pencil = screen.getByLabelText('Rename');
    fireEvent.click(pencil);
    // Edit inputs appear.
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    // Opening must not have been triggered.
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('committing edit via Enter calls onRenameItem with name and description', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Rename'));
    const [nameInput] = screen.getAllByRole('textbox');
    fireEvent.change(nameInput!, { target: { value: 'UpdatedOp' } });
    // Find description input — it's the second textbox.
    const descInput = screen.getAllByRole('textbox')[1];
    fireEvent.change(descInput!, { target: { value: 'My description' } });
    fireEvent.keyDown(nameInput!, { key: 'Enter' });
    expect(onRenameItem).toHaveBeenCalledOnce();
    expect(onRenameItem).toHaveBeenCalledWith('col-1', 'item-1', {
      name: 'UpdatedOp',
      description: 'My description',
    });
  });

  it('committing edit via blur calls onRenameItem', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Rename'));
    const [nameInput] = screen.getAllByRole('textbox');
    fireEvent.change(nameInput!, { target: { value: 'BlurOp' } });
    fireEvent.blur(nameInput!);
    expect(onRenameItem).toHaveBeenCalledOnce();
    expect(onRenameItem).toHaveBeenCalledWith('col-1', 'item-1', {
      name: 'BlurOp',
      description: '',
    });
  });

  it('moving focus from name to description does not commit or exit edit mode', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Rename'));
    const [nameInput, descInput] = screen.getAllByRole('textbox');
    // Focus moves from the name input into the sibling description input.
    fireEvent.blur(nameInput!, { relatedTarget: descInput });
    // The edit form must stay open and nothing should be committed yet.
    expect(onRenameItem).not.toHaveBeenCalled();
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2);
  });

  it('Escape cancels edit without calling onRenameItem', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Rename'));
    const [nameInput] = screen.getAllByRole('textbox');
    fireEvent.keyDown(nameInput!, { key: 'Escape' });
    expect(onRenameItem).not.toHaveBeenCalled();
    // Edit mode exited — pencil is back.
    expect(screen.getByLabelText('Rename')).toBeTruthy();
  });

  it('readOnly hides the pencil button', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow({ readOnly: true });
    expect(screen.queryByLabelText('Rename')).toBeNull();
  });
});

describe('CollectionItemRow description subtext', () => {
  it('renders description subtext when item has a description', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const itemWithDesc: CollectionItem = {
      ...item,
      description: 'Fetches the current user',
    };
    render(
      <CollectionItemRow
        item={itemWithDesc}
        collectionId="col-1"
        index={0}
        isGrabbed={false}
        onGrabToggle={vi.fn()}
        onGrabMove={vi.fn()}
        onGrabCancel={vi.fn()}
        onOpen={vi.fn()}
        onShare={vi.fn().mockResolvedValue(null)}
        onAnnounce={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
        onRenameItem={vi.fn()}
      />,
    );
    expect(screen.getByText('Fetches the current user')).toBeTruthy();
  });

  it('does not render description element when item has no description', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow();
    // No description element present.
    const desc = document.querySelector(
      '.graphiql-collection-item-description',
    );
    expect(desc).toBeNull();
  });
});

describe('CollectionItemRow keyboard grab', () => {
  it('space on the drag handle toggles grab, not row open', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onGrabToggle, onOpen } = renderRow();
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: ' ' });
    expect(onGrabToggle).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('arrow keys move only while grabbed', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onGrabMove } = renderRow({ isGrabbed: true });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(onGrabMove).toHaveBeenNthCalledWith(1, 'down');
    expect(onGrabMove).toHaveBeenNthCalledWith(2, 'up');
  });

  it('does not move via arrows when not grabbed', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onGrabMove } = renderRow({ isGrabbed: false });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onGrabMove).not.toHaveBeenCalled();
  });

  it('escape cancels while grabbed', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onGrabCancel } = renderRow({ isGrabbed: true });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: 'Escape' });
    expect(onGrabCancel).toHaveBeenCalledOnce();
  });

  it('marks the handle pressed when grabbed', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow({ isGrabbed: true });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    expect(handle.getAttribute('aria-pressed')).toBe('true');
  });
});
