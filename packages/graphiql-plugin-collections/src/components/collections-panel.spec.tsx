import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollectionsPanel } from './collections-panel';
import { collectionsStore } from '../store';
import type { CollectionsStorage } from '../types';

const makeStorage = (): CollectionsStorage => ({
  async load() {
    return [];
  },
  async save() {},
});

beforeEach(() => {
  collectionsStore.setState({ collections: [], loaded: true });
});

describe('CollectionsPanel header gating', () => {
  it('defaults render both "+ New" and "↑↓" header buttons', () => {
    render(<CollectionsPanel storage={makeStorage()} />);
    expect(screen.getByLabelText('New collection')).toBeTruthy();
    expect(screen.getByLabelText('Import / Export')).toBeTruthy();
  });

  it('readOnly hides the "+ New" button but keeps "↑↓"', () => {
    render(<CollectionsPanel storage={makeStorage()} readOnly />);
    expect(screen.queryByLabelText('New collection')).toBeNull();
    expect(screen.getByLabelText('Import / Export')).toBeTruthy();
  });

  it('allowImportExport:false hides the "↑↓" button', () => {
    render(
      <CollectionsPanel storage={makeStorage()} allowImportExport={false} />,
    );
    expect(screen.queryByLabelText('Import / Export')).toBeNull();
    expect(screen.getByLabelText('New collection')).toBeTruthy();
  });
});
