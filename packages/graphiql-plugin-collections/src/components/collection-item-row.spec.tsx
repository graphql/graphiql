import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollectionItemRow } from './collection-item-row';
import type { Collection, CollectionItem } from '../types';

const item: CollectionItem = {
  id: 'item-1',
  name: 'MyOperation',
  query: '{ __typename }',
  createdAt: 1000,
  updatedAt: 1000,
};

const allCollections: Collection[] = [
  {
    id: 'col-1',
    name: 'Col One',
    createdAt: 1000,
    updatedAt: 1000,
    items: [item],
  },
];

function renderRow(
  overrides: Partial<Parameters<typeof CollectionItemRow>[0]> = {},
) {
  const onOpen = vi.fn();
  const onCopy = vi.fn();
  const onDelete = vi.fn();
  const onMove = vi.fn();
  const onRenameItem = vi.fn();
  render(
    <CollectionItemRow
      item={item}
      collectionId="col-1"
      index={0}
      totalItems={1}
      allCollections={allCollections}
      onOpen={onOpen}
      onCopy={onCopy}
      onDelete={onDelete}
      onMove={onMove}
      onRenameItem={onRenameItem}
      {...overrides}
    />,
  );
  return { onOpen, onCopy, onDelete, onMove, onRenameItem };
}

describe('CollectionItemRow', () => {
  it('clicking "Copy operation" calls onCopy with the item id, not onOpen', () => {
    const { onCopy, onOpen } = renderRow();
    fireEvent.click(screen.getByText('Copy operation'));
    expect(onCopy).toHaveBeenCalledOnce();
    expect(onCopy).toHaveBeenCalledWith('item-1');
    // Menu clicks must not fall through to the row's open handler.
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clicking "Delete" calls onDelete with collectionId and itemId, not onOpen', () => {
    const { onDelete, onOpen } = renderRow();
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('col-1', 'item-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('readOnly hides Delete and Move affordances and disables drag', () => {
    const twoItems: Collection[] = [
      {
        id: 'col-1',
        name: 'Col One',
        createdAt: 1000,
        updatedAt: 1000,
        items: [item, { ...item, id: 'item-2', name: 'Second' }],
      },
      {
        id: 'col-2',
        name: 'Col Two',
        createdAt: 1000,
        updatedAt: 1000,
        items: [],
      },
    ];
    const { container } = render(
      <CollectionItemRow
        item={item}
        collectionId="col-1"
        index={0}
        totalItems={2}
        allCollections={twoItems}
        readOnly
        onOpen={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
        onRenameItem={vi.fn()}
      />,
    );
    expect(screen.queryByText('Delete')).toBeNull();
    expect(screen.queryByText('Move down')).toBeNull();
    expect(screen.queryByText(/^Move to:/)).toBeNull();
    // Still openable / copyable.
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Copy operation')).toBeTruthy();
    const row = container.querySelector('.graphiql-collection-item-row');
    expect(row?.getAttribute('draggable')).toBe('false');
  });

  it('allowCopy:false hides "Copy operation"', () => {
    renderRow({ allowCopy: false });
    expect(screen.queryByText('Copy operation')).toBeNull();
    expect(screen.getByText('Open')).toBeTruthy();
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
        totalItems={1}
        allCollections={allCollections}
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
