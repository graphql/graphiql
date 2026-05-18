'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../constants', async () => {
  const actual =
    await vi.importActual<typeof import('../../constants')>('../../constants');
  return { ...actual, isMacOs: true };
});

import { KeycapHint, MODIFIER } from './';

describe('KeycapHint (macOS)', () => {
  it('renders MODIFIER.Meta as "⌘"', () => {
    render(
      <KeycapHint
        keys={[MODIFIER.Meta, 'K']}
        ariaLabel="Open command palette"
      />,
    );
    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('renders other modifiers as their Mac glyphs', () => {
    render(
      <KeycapHint
        keys={[MODIFIER.Ctrl, MODIFIER.Alt, MODIFIER.Shift, MODIFIER.Enter]}
        ariaLabel="All modifiers"
      />,
    );
    expect(screen.getByText('⌃')).toBeInTheDocument();
    expect(screen.getByText('⌥')).toBeInTheDocument();
    expect(screen.getByText('⇧')).toBeInTheDocument();
    expect(screen.getByText('⏎')).toBeInTheDocument();
  });
});
