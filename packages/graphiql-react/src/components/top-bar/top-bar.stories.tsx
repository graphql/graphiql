import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphiQLProvider } from '../provider';
import { TopBar } from './';

const postOnlyTransport = {
  url: 'https://api.example.com/graphql',
  method: 'POST' as const,
  supportedMethods: ['POST' as const],
  send: async () => ({
    ok: true,
    body: { data: {} },
    timing: { totalMs: 0 },
    size: {},
  }),
};

const switchableTransport: {
  url: string;
  method: 'GET' | 'POST';
  supportedMethods: ('GET' | 'POST')[];
  setMethod(method: 'GET' | 'POST'): void;
  send: () => Promise<{
    ok: boolean;
    body: { data: Record<string, never> };
    timing: { totalMs: number };
    size: Record<string, never>;
  }>;
} = {
  url: 'https://api.example.com/graphql',
  method: 'POST',
  supportedMethods: ['GET', 'POST'],
  setMethod(method: 'GET' | 'POST') {
    switchableTransport.method = method;
  },
  send: async () => ({
    ok: true,
    body: { data: {} },
    timing: { totalMs: 0 },
    size: {},
  }),
};

const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TopBar>;

/** POST-only transport: static method label, no switcher. */
export const Default: Story = {
  args: { version: 'v6.0.0-alpha.1' },
  decorators: [
    Story => (
      <GraphiQLProvider transport={postOnlyTransport}>
        <Story />
      </GraphiQLProvider>
    ),
  ],
};

/** GET/POST-capable transport: segmented switcher visible. */
export const WithMethodSwitcher: Story = {
  args: { version: 'v6.0.0-alpha.1' },
  decorators: [
    Story => (
      <GraphiQLProvider transport={switchableTransport}>
        <Story />
      </GraphiQLProvider>
    ),
  ],
};

/** No version pill. */
export const NoVersion: Story = {
  args: {},
  decorators: [
    Story => (
      <GraphiQLProvider transport={postOnlyTransport}>
        <Story />
      </GraphiQLProvider>
    ),
  ],
};
