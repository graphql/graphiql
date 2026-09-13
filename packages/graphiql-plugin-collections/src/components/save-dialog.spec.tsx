import { describe, it, expect, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SaveDialog } from './save-dialog';
import { collectionsStore } from '../store';

beforeEach(() => {
  collectionsStore.setState({ collections: [], loaded: true });
});

function openDialog(name = 'MyOperation') {
  collectionsStore.getState().actions.openSaveDialog({
    name,
    query: '{ __typename }',
    variables: '',
    headers: '',
  });
  render(<SaveDialog />);
}

describe('SaveDialog description field', () => {
  it('renders a description input', () => {
    openDialog();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeTruthy();
  });

  it('includes description in the saved item when provided', () => {
    openDialog('DescOp');
    const descInput = screen.getByPlaceholderText('Description (optional)');
    fireEvent.change(descInput, { target: { value: 'Fetches the user' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const { collections } = collectionsStore.getState();
    expect(collections[0]?.items[0]?.description).toBe('Fetches the user');
  });

  it('saves item without description when the description field is empty', () => {
    openDialog('NoDescOp');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const { collections } = collectionsStore.getState();
    expect(collections[0]?.items[0]?.description).toBeUndefined();
  });

  it('resets description field when dialog reopens', () => {
    openDialog('ResetOp');
    const descInput = screen.getByPlaceholderText('Description (optional)');
    fireEvent.change(descInput, { target: { value: 'Old description' } });
    // Close then reopen in separate acts so the effect fires.
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
    // The input value should be reset to empty.
    const descInputAfter = screen.getByPlaceholderText(
      'Description (optional)',
    );
    expect((descInputAfter as HTMLInputElement).value).toBe('');
  });
});
