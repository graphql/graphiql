import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { SaveDialog } from './save-dialog';
import { collectionsStore } from '../store';
import type { Collection } from '../types';

beforeEach(() => {
  collectionsStore.getState().actions.closeSaveDialog();
  collectionsStore.setState({ collections: [], loaded: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function requestDialog(name = 'MyOperation') {
  collectionsStore.getState().actions.openSaveDialog({
    name,
    query: '{ __typename }',
    variables: '',
    headers: '',
  });
}

function openDialog(name = 'MyOperation') {
  requestDialog(name);
  return render(<SaveDialog />);
}

function collection(id: string): Collection {
  return { id, name: id, items: [], createdAt: 0, updatedAt: 0 };
}

describe('SaveDialog description field', () => {
  it('renders a description input', () => {
    openDialog();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeTruthy();
  });

  it('includes description in the saved item when provided', async () => {
    openDialog('DescOp');
    const descInput = screen.getByPlaceholderText('Description (optional)');
    fireEvent.change(descInput, { target: { value: 'Fetches the user' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(
        collectionsStore.getState().collections[0]?.items[0]?.description,
      ).toBe('Fetches the user'),
    );
  });

  it('saves item without description when the description field is empty', async () => {
    openDialog('NoDescOp');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(collectionsStore.getState().collections).toHaveLength(1),
    );
    expect(
      collectionsStore.getState().collections[0]?.items[0]?.description,
    ).toBeUndefined();
  });

  it('resets description field when dialog reopens', () => {
    openDialog('ResetOp');
    const descInput = screen.getByPlaceholderText('Description (optional)');
    fireEvent.change(descInput, { target: { value: 'Old description' } });
    act(() => {
      collectionsStore.getState().actions.closeSaveDialog();
    });
    act(() => {
      collectionsStore.getState().actions.openSaveDialog({
        name: 'ResetOp2',
        query: '{ a }',
        variables: '',
        headers: '',
      });
    });
    const descInputAfter = screen.getByPlaceholderText(
      'Description (optional)',
    );
    expect((descInputAfter as HTMLInputElement).value).toBe('');
  });
});

describe('SaveDialog request lifecycle', () => {
  it('creates a fresh form from the current collections when opened', () => {
    render(<SaveDialog />);
    expect(
      screen.queryByRole('textbox', { name: 'Operation name' }),
    ).toBeNull();
    act(() => {
      collectionsStore.setState({ collections: [collection('first')] });
      requestDialog('FreshOperation');
    });

    expect(screen.getByRole('textbox', { name: 'Operation name' })).toHaveValue(
      'FreshOperation',
    );
    expect(screen.getByRole('combobox', { name: 'Collection' })).toHaveValue(
      'first',
    );
    expect(
      screen.queryByRole('textbox', { name: 'Collection name' }),
    ).toBeNull();
  });

  it('preserves edits and the selection when the collection list changes', () => {
    collectionsStore.setState({
      collections: [collection('first'), collection('second')],
    });
    const { rerender } = openDialog();
    fireEvent.change(screen.getByRole('textbox', { name: 'Operation name' }), {
      target: { value: 'Edited operation' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Edited description' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Collection' }), {
      target: { value: 'second' },
    });
    act(() => {
      collectionsStore.setState({
        collections: [
          collection('added'),
          ...collectionsStore.getState().collections,
        ],
      });
    });
    rerender(<SaveDialog />);

    expect(screen.getByRole('textbox', { name: 'Operation name' })).toHaveValue(
      'Edited operation',
    );
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'Edited description',
    );
    expect(screen.getByRole('combobox', { name: 'Collection' })).toHaveValue(
      'second',
    );
  });

  it('resets all fields for another request with the same operation name', () => {
    openDialog('SameOperation');
    fireEvent.change(screen.getByRole('textbox', { name: 'Operation name' }), {
      target: { value: 'Edited operation' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Edited description' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Collection name' }), {
      target: { value: 'Edited collection' },
    });
    act(() => requestDialog('SameOperation'));

    expect(screen.getByRole('textbox', { name: 'Operation name' })).toHaveValue(
      'SameOperation',
    );
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      '',
    );
    expect(
      screen.getByRole('textbox', { name: 'Collection name' }),
    ).toHaveValue('New Collection');
  });

  it('resets a same-name request when closing and reopening are batched', () => {
    openDialog('SameOperation');
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Previous request' },
    });
    act(() => {
      collectionsStore.getState().actions.closeSaveDialog();
      collectionsStore.setState({ collections: [collection('new default')] });
      requestDialog('SameOperation');
    });

    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      '',
    );
    expect(screen.getByRole('combobox', { name: 'Collection' })).toHaveValue(
      'new default',
    );
  });

  it('uses the new operation name when an open dialog is replaced', () => {
    openDialog('FirstOperation');
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'First request' },
    });
    act(() => requestDialog('SecondOperation'));

    expect(screen.getByRole('textbox', { name: 'Operation name' })).toHaveValue(
      'SecondOperation',
    );
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      '',
    );
  });

  it('shows saving until an asynchronous save settles and retains edits on rejection', async () => {
    let rejectSave!: (error: Error) => void;
    const pendingSave = new Promise<void>((_resolve, reject) => {
      rejectSave = reject;
    });
    vi.spyOn(
      collectionsStore.getState().actions,
      'commitSaveDialog',
    ).mockReturnValue(pendingSave);
    openDialog('PendingOperation');
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Keep my description' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeTruthy();

    await act(async () => {
      rejectSave(new Error('Storage rejected the save'));
      await pendingSave.catch(() => {});
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'Keep my description',
    );
  });
});
