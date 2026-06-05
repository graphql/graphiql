import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { GraphiQLProvider, useGraphiQLActions } from '../provider';
import { DocsIcon, HistoryIcon } from '../../icons';
import { SidePanel } from './';

const mockTransport = {
  send: async () => ({
    ok: true,
    body: { data: null },
    timing: { totalMs: 0 },
    size: {},
  }),
};

const DOCS_PLUGIN = {
  title: 'Documentation Explorer',
  icon: DocsIcon,
  content: () => (
    <div style={{ padding: 16 }}>
      <p style={{ margin: 0, color: 'oklch(var(--fg-muted))' }}>
        Documentation content
      </p>
    </div>
  ),
};

const HISTORY_PLUGIN = {
  title: 'History',
  icon: HistoryIcon,
  content: () => (
    <div style={{ padding: 16 }}>
      <p style={{ margin: 0, color: 'oklch(var(--fg-muted))' }}>
        History content
      </p>
    </div>
  ),
};

function ActivatePlugin({ title }: { title: string }) {
  const { setVisiblePlugin } = useGraphiQLActions();
  useEffect(() => {
    setVisiblePlugin(title);
  }, [setVisiblePlugin, title]);
  return null;
}

const meta: Meta<typeof SidePanel> = {
  title: 'Components/SidePanel',
  component: SidePanel,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <GraphiQLProvider
        transport={mockTransport}
        plugins={[DOCS_PLUGIN, HISTORY_PLUGIN]}
      >
        <Story />
      </GraphiQLProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SidePanel>;

export const Hidden: Story = {
  name: 'No active plugin (hidden)',
};

export const DocsPanel: Story = {
  name: 'Documentation Explorer active',
  decorators: [
    Story => (
      <>
        <ActivatePlugin title="Documentation Explorer" />
        <Story />
      </>
    ),
  ],
};

export const HistoryPanel: Story = {
  name: 'History active',
  decorators: [
    Story => (
      <>
        <ActivatePlugin title="History" />
        <Story />
      </>
    ),
  ],
};
