import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConflictDialog } from './conflict-dialog';
import type { ImportAnalysis, ImportResolution } from '../types';

const baseItem = {
  query: '{ __typename }',
  createdAt: 1000,
  updatedAt: 1000,
};

const sampleAnalysis: ImportAnalysis = {
  ok: true,
  newCollections: [],
  newItems: [
    {
      item: { id: 'n1', name: 'NewOp', ...baseItem },
      targetCollectionId: 'c1',
    },
  ],
  changedItems: [
    {
      incoming: {
        id: 'x1',
        name: 'ChangedOp',
        ...baseItem,
        updatedAt: 4_600_000,
      },
      current: { id: 'x1', name: 'ChangedOp', ...baseItem, updatedAt: 1000 },
      currentCollectionId: 'c1',
    },
    {
      incoming: { id: 'x2', name: 'AnotherOp', ...baseItem, updatedAt: 1000 },
      current: {
        id: 'x2',
        name: 'AnotherOp',
        ...baseItem,
        updatedAt: 7_200_000,
      },
      currentCollectionId: 'c1',
    },
  ],
  unchangedCount: 3,
  _incoming: [
    {
      id: 'c1',
      name: 'My Collection',
      createdAt: 1000,
      updatedAt: 1000,
      items: [],
    },
  ],
};

function renderDialog(onResolve = vi.fn(), onClose = vi.fn()) {
  return {
    onResolve,
    onClose,
    ...render(
      <ConflictDialog
        analysis={sampleAnalysis}
        sourceLabel="My Collection"
        open
        onClose={onClose}
        onResolve={onResolve}
      />,
    ),
  };
}

describe('ConflictDialog', () => {
  it('renders the summary counts', () => {
    renderDialog();
    // 1 new, 2 with changes, 3 unchanged
    expect(screen.getByText(/1 new/)).toBeDefined();
    expect(screen.getByText(/2 with changes/)).toBeDefined();
    expect(screen.getByText(/3 unchanged/)).toBeDefined();
    expect(screen.getByText(/My Collection/)).toBeDefined();
  });

  it('clicking "Apply changes" calls onResolve with applyChanges: true', () => {
    const { onResolve } = renderDialog();
    fireEvent.click(screen.getByText('Apply changes'));
    expect(onResolve).toHaveBeenCalledOnce();
    expect(onResolve).toHaveBeenCalledWith<[ImportResolution]>({
      mode: 'merge',
      applyChanges: true,
    });
  });

  it('clicking "Keep my versions" calls onResolve with applyChanges: false', () => {
    const { onResolve } = renderDialog();
    fireEvent.click(screen.getByText('Keep my versions'));
    expect(onResolve).toHaveBeenCalledOnce();
    expect(onResolve).toHaveBeenCalledWith<[ImportResolution]>({
      mode: 'merge',
      applyChanges: false,
    });
  });

  describe('Review each…', () => {
    it('reveals the per-row list when clicked', () => {
      renderDialog();
      expect(screen.queryByText('ChangedOp')).toBeNull();
      fireEvent.click(screen.getByText('Review each…'));
      expect(screen.getByText('ChangedOp')).toBeDefined();
      expect(screen.getByText('AnotherOp')).toBeDefined();
    });

    it('all checkboxes default to unchecked', () => {
      renderDialog();
      fireEvent.click(screen.getByText('Review each…'));
      const checkboxes = screen.getAllByRole<HTMLInputElement>('checkbox');
      expect(checkboxes).toHaveLength(2);
      checkboxes.forEach(cb => expect(cb.checked).toBe(false));
    });

    it('confirming with nothing checked calls onResolve with empty Set', () => {
      const { onResolve } = renderDialog();
      fireEvent.click(screen.getByText('Review each…'));
      fireEvent.click(screen.getByText('Confirm selection'));
      expect(onResolve).toHaveBeenCalledOnce();
      const [call] = onResolve.mock.calls;
      const arg = call![0] as Extract<
        ImportResolution,
        { changedItemIds: Set<string> }
      >;
      expect(arg.mode).toBe('merge');
      expect(arg.changedItemIds.size).toBe(0);
    });

    it('confirming with a subset checked calls onResolve with that Set', () => {
      const { onResolve } = renderDialog();
      fireEvent.click(screen.getByText('Review each…'));
      // Check only the first checkbox (ChangedOp = id x1)
      const checkboxes = screen.getAllByRole<HTMLInputElement>('checkbox');
      fireEvent.click(checkboxes[0]!);
      fireEvent.click(screen.getByText('Confirm selection'));
      expect(onResolve).toHaveBeenCalledOnce();
      const [call] = onResolve.mock.calls;
      const arg = call![0] as Extract<
        ImportResolution,
        { changedItemIds: Set<string> }
      >;
      expect(arg.mode).toBe('merge');
      expect(arg.changedItemIds).toEqual(new Set(['x1']));
    });

    it('confirming with all checked calls onResolve with full Set', () => {
      const { onResolve } = renderDialog();
      fireEvent.click(screen.getByText('Review each…'));
      const checkboxes = screen.getAllByRole<HTMLInputElement>('checkbox');
      checkboxes.forEach(cb => fireEvent.click(cb));
      fireEvent.click(screen.getByText('Confirm selection'));
      const [call] = onResolve.mock.calls;
      const arg = call![0] as Extract<
        ImportResolution,
        { changedItemIds: Set<string> }
      >;
      expect(arg.changedItemIds).toEqual(new Set(['x1', 'x2']));
    });
  });
});
