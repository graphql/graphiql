import { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { CollectionRow } from './collection-row';
import type { Collection } from '../types';

const collection: Collection = {
  id: 'col-1',
  name: 'My Collection',
  createdAt: 1000,
  updatedAt: 1000,
  items: [],
};

const writeText = vi.fn().mockResolvedValue(null);

afterEach(() => {
  writeText.mockClear();
  vi.useRealTimers();
});

function renderRow(
  overrides: Partial<Parameters<typeof CollectionRow>[0]> = {},
) {
  const onRename = vi.fn();
  const onDelete = vi.fn();
  const onShareCollection = vi.fn().mockResolvedValue(null);
  const onAnnounce = vi.fn();
  function Harness() {
    const [expanded, setExpanded] = useState(overrides.expanded ?? true);
    return (
      <CollectionRow
        collection={collection}
        expanded={expanded}
        onToggleExpand={() => setExpanded(e => !e)}
        readOnly={false}
        onRename={onRename}
        onDelete={onDelete}
        onShareCollection={onShareCollection}
        onOpenItem={vi.fn()}
        onShare={vi.fn().mockResolvedValue(null)}
        onAnnounce={onAnnounce}
        onDeleteItem={vi.fn()}
        onMoveItem={vi.fn()}
        onAddItem={vi.fn() as never}
        onRenameItem={vi.fn()}
        grabbed={null}
        onGrabToggle={vi.fn()}
        onGrabMove={vi.fn()}
        onGrabCancel={vi.fn()}
        {...overrides}
      />
    );
  }
  render(<Harness />);
  return { onRename, onDelete, onShareCollection, onAnnounce };
}

describe('CollectionRow gating', () => {
  it('renders rename, share, and delete buttons and no kebab', () => {
    renderRow();
    expect(screen.getByLabelText('Rename My Collection')).toBeTruthy();
    expect(screen.getByLabelText('Share My Collection')).toBeTruthy();
    expect(screen.getByLabelText('Delete My Collection')).toBeTruthy();
    expect(screen.queryByText('···')).toBeNull();
  });

  it('readOnly hides rename and delete but keeps share', () => {
    renderRow({ readOnly: true });
    expect(screen.queryByLabelText('Rename My Collection')).toBeNull();
    expect(screen.queryByLabelText('Delete My Collection')).toBeNull();
    expect(screen.getByLabelText('Share My Collection')).toBeTruthy();
  });
});

describe('CollectionRow header actions', () => {
  it('clicking share calls onShareCollection with the collection id and announces', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onShareCollection, onAnnounce } = renderRow();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Share My Collection'));
    });
    expect(onShareCollection).toHaveBeenCalledOnce();
    expect(onShareCollection).toHaveBeenCalledWith('col-1');
    expect(onAnnounce).toHaveBeenCalledWith('Shared collection to clipboard.');
  });

  it('clicking share shows confirmed state then reverts after 1500ms', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Share My Collection'));
    });
    expect(
      screen
        .getByLabelText('Share My Collection')
        .getAttribute('data-confirmed'),
    ).toBe('true');
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(
      screen
        .getByLabelText('Share My Collection')
        .getAttribute('data-confirmed'),
    ).toBeNull();
  });

  it('clicking delete calls onDelete with the collection id', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onDelete } = renderRow();
    fireEvent.click(screen.getByLabelText('Delete My Collection'));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('col-1');
  });

  it('clicking rename opens the input and committing calls onRename with the new name', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { onRename } = renderRow();
    fireEvent.click(screen.getByLabelText('Rename My Collection'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Renamed Collection' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRename).toHaveBeenCalledOnce();
    expect(onRename).toHaveBeenCalledWith('col-1', 'Renamed Collection');
  });

  it('clicking a header action does not toggle expanded state', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Share My Collection'));
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('CollectionRow expand/collapse', () => {
  it('toggle button is a real button with aria-expanded', () => {
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking the toggle button flips aria-expanded', () => {
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('committing a rename via blur does NOT change expanded state', () => {
    const onRename = vi.fn();
    renderRow({ onRename });
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    // Record the initial expanded state (true).
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    // Open rename via the rename button.
    fireEvent.click(screen.getByLabelText('Rename My Collection'));

    // The input should now be visible; the toggle button is replaced.
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Commit the rename via blur.
    fireEvent.blur(input);

    // After rename the toggle button comes back — expanded must still be true.
    const toggleAfter = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggleAfter.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('CollectionRow pencil rename button', () => {
  it('pencil button enters rename mode', () => {
    const onRename = vi.fn();
    renderRow({ onRename });
    const pencil = screen.getByLabelText('Rename My Collection');
    fireEvent.click(pencil);
    // Rename input should now be visible.
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('My Collection');
  });

  it('pencil button does NOT toggle expanded state', () => {
    renderRow();
    const toggle = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const pencil = screen.getByLabelText('Rename My Collection');
    fireEvent.click(pencil);
    // Commit rename to exit rename mode, then check expanded state.
    fireEvent.blur(screen.getByRole('textbox'));
    const toggleAfter = screen.getByRole('button', {
      name: /Toggle My Collection/i,
    });
    expect(toggleAfter.getAttribute('aria-expanded')).toBe('true');
  });

  it('readOnly hides the pencil button', () => {
    renderRow({ readOnly: true });
    expect(screen.queryByLabelText('Rename My Collection')).toBeNull();
  });
});
