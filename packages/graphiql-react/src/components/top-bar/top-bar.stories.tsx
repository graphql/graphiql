import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphiQLProvider } from '../provider';
import { TopBar } from './';

const noOpTransport = {
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
  decorators: [
    Story => (
      <GraphiQLProvider transport={noOpTransport}>
        <Story />
      </GraphiQLProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: {
    endpointUrl: 'https://api.example.com/graphql',
    version: 'v6.0.0-alpha.1',
  },
};

export const NoVersion: Story = {
  args: {
    endpointUrl: '/graphql',
  },
};

export const Minimal: Story = {
  args: {},
};
