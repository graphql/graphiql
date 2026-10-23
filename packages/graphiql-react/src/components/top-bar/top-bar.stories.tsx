import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphiQLProvider } from '../provider';
import { TopBar } from './';
import { Tooltip } from '../tooltip';

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

const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: { version: 'v6.0.0-alpha.1' },
  decorators: [
    Story => (
      <Tooltip.Provider>
        <GraphiQLProvider transport={postOnlyTransport}>
          <Story />
        </GraphiQLProvider>
      </Tooltip.Provider>
    ),
  ],
};

/** No version pill. */
export const NoVersion: Story = {
  args: {},
  decorators: [
    Story => (
      <Tooltip.Provider>
        <GraphiQLProvider transport={postOnlyTransport}>
          <Story />
        </GraphiQLProvider>
      </Tooltip.Provider>
    ),
  ],
};

/** Custom branding in place of the default hexagon icon + "GraphiQL" wordmark. */
export const CustomBrand: Story = {
  args: {
    version: 'v6.0.0-alpha.1',
    brand: <span style={{ fontWeight: 600 }}>My Company GraphQL Explorer</span>,
  },
  decorators: [
    Story => (
      <Tooltip.Provider>
        <GraphiQLProvider transport={postOnlyTransport}>
          <Story />
        </GraphiQLProvider>
      </Tooltip.Provider>
    ),
  ],
};
