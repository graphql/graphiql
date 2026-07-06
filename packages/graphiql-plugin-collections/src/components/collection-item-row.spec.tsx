import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
  const onCopy = vi.fn();
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
      onCopy={onCopy}
      onDelete={onDelete}
      onMove={onMove}
      onRenameItem={onRenameItem}
      {...overrides}
    />,
  );
  return {
    onOpen,
    onCopy,
    onDelete,
    onMove,
    onRenameItem,
    onGrabToggle,
    onGrabMove,
    onGrabCancel,
  };
}

describe('CollectionItemRow actions', () => {
  it('renders edit, copy, and delete buttons and no kebab or Open', () => {
    renderRow();
    expect(screen.getByLabelText('Edit MyOperation')).toBeTruthy();
    expect(screen.getByLabelText('Copy MyOperation')).toBeTruthy();
    expect(screen.getByLabelText('Delete MyOperation')).toBeTruthy();
    expect(screen.queryByText('···')).toBeNull();
    expect(screen.queryByText('Open')).toBeNull();
  });

  it('clicking copy calls onCopy with the item id, not onOpen', () => {
    const { onCopy, onOpen } = renderRow();
    fireEvent.click(screen.getByLabelText('Copy MyOperation'));
    expect(onCopy).toHaveBeenCalledOnce();
    expect(onCopy).toHaveBeenCalledWith('item-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking delete calls onDelete with collectionId and itemId, not onOpen', () => {
    const { onDelete, onOpen } = renderRow();
    fireEvent.click(screen.getByLabelText('Delete MyOperation'));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('col-1', 'item-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking the row still opens the item', () => {
    const { onOpen } = renderRow();
    fireEvent.click(screen.getByText('MyOperation'));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('readOnly hides edit and delete but keeps copy', () => {
    renderRow({ readOnly: true });
    expect(screen.queryByLabelText('Edit MyOperation')).toBeNull();
    expect(screen.queryByLabelText('Delete MyOperation')).toBeNull();
    expect(screen.getByLabelText('Copy MyOperation')).toBeTruthy();
  });
});

describe('CollectionItemRow inline edit', () => {
  it('pencil button enters edit mode and does not open the item', () => {
    const { onOpen } = renderRow();
    const pencil = screen.getByLabelText('Edit MyOperation');
    fireEvent.click(pencil);
    // Edit inputs appear.
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    // Opening must not have been triggered.
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('committing edit via Enter calls onRenameItem with name and description', () => {
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Edit MyOperation'));
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
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Edit MyOperation'));
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
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Edit MyOperation'));
    const [nameInput, descInput] = screen.getAllByRole('textbox');
    // Focus moves from the name input into the sibling description input.
    fireEvent.blur(nameInput!, { relatedTarget: descInput });
    // The edit form must stay open and nothing should be committed yet.
    expect(onRenameItem).not.toHaveBeenCalled();
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2);
  });

  it('Escape cancels edit without calling onRenameItem', () => {
    const { onRenameItem } = renderRow();
    fireEvent.click(screen.getByLabelText('Edit MyOperation'));
    const [nameInput] = screen.getAllByRole('textbox');
    fireEvent.keyDown(nameInput!, { key: 'Escape' });
    expect(onRenameItem).not.toHaveBeenCalled();
    // Edit mode exited — pencil is back.
    expect(screen.getByLabelText('Edit MyOperation')).toBeTruthy();
  });

  it('readOnly hides the pencil button', () => {
    renderRow({ readOnly: true });
    expect(screen.queryByLabelText('Edit MyOperation')).toBeNull();
  });
});

describe('CollectionItemRow description subtext', () => {
  it('renders description subtext when item has a description', () => {
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
        onCopy={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
        onRenameItem={vi.fn()}
      />,
    );
    expect(screen.getByText('Fetches the current user')).toBeTruthy();
  });

  it('does not render description element when item has no description', () => {
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
    const { onGrabToggle, onOpen } = renderRow();
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: ' ' });
    expect(onGrabToggle).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('arrow keys move only while grabbed', () => {
    const { onGrabMove } = renderRow({ isGrabbed: true });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(onGrabMove).toHaveBeenNthCalledWith(1, 'down');
    expect(onGrabMove).toHaveBeenNthCalledWith(2, 'up');
  });

  it('does not move via arrows when not grabbed', () => {
    const { onGrabMove } = renderRow({ isGrabbed: false });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onGrabMove).not.toHaveBeenCalled();
  });

  it('escape cancels while grabbed', () => {
    const { onGrabCancel } = renderRow({ isGrabbed: true });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    fireEvent.keyDown(handle, { key: 'Escape' });
    expect(onGrabCancel).toHaveBeenCalledOnce();
  });

  it('marks the handle pressed when grabbed', () => {
    renderRow({ isGrabbed: true });
    const handle = screen.getByLabelText(/Reorder MyOperation/i);
    expect(handle.getAttribute('aria-pressed')).toBe('true');
  });
});
