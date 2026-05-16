'use no memo';

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphiQLProvider, useGraphiQLActions } from '../provider';
import { useEffect } from 'react';
import { SidePanel } from './';

// jsdom does not implement window.matchMedia; stub it for GraphiQLProvider's theme slice.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
});

const mockFetcher = () => ({ data: null });

const MOCK_PLUGIN = {
  title: 'Test Plugin',
  icon: () => null,
  content: () => <div>Plugin content</div>,
};

function ActivatePlugin({ title }: { title: string }) {
  const { setVisiblePlugin } = useGraphiQLActions();
  useEffect(() => {
    setVisiblePlugin(title);
  }, [setVisiblePlugin, title]);
  return null;
}

describe('SidePanel', () => {
  it('renders nothing when no plugin is active', () => {
    const { container } = render(
      <GraphiQLProvider fetcher={mockFetcher} plugins={[MOCK_PLUGIN]}>
        <SidePanel />
      </GraphiQLProvider>,
    );
    expect(container.querySelector('.graphiql-side-panel')).toBeNull();
  });

  it('renders plugin content when a plugin is active', () => {
    render(
      <GraphiQLProvider fetcher={mockFetcher} plugins={[MOCK_PLUGIN]}>
        <ActivatePlugin title="Test Plugin" />
        <SidePanel />
      </GraphiQLProvider>,
    );
    expect(screen.getByText('Plugin content')).toBeInTheDocument();
  });

  it('renders as an aside element with aria-label matching the plugin title', () => {
    const { container } = render(
      <GraphiQLProvider fetcher={mockFetcher} plugins={[MOCK_PLUGIN]}>
        <ActivatePlugin title="Test Plugin" />
        <SidePanel />
      </GraphiQLProvider>,
    );
    const aside = container.querySelector('aside.graphiql-side-panel');
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute('aria-label', 'Test Plugin');
  });

  it('does not render .graphiql-side-panel when plugin is cleared', () => {
    function ActivateThenClear() {
      const { setVisiblePlugin } = useGraphiQLActions();
      // First render: activate
      useEffect(() => {
        setVisiblePlugin('Test Plugin');
        // Then immediately clear
        setVisiblePlugin(null);
      }, [setVisiblePlugin]);
      return null;
    }
    const { container } = render(
      <GraphiQLProvider fetcher={mockFetcher} plugins={[MOCK_PLUGIN]}>
        <ActivateThenClear />
        <SidePanel />
      </GraphiQLProvider>,
    );
    expect(container.querySelector('.graphiql-side-panel')).toBeNull();
  });
});
