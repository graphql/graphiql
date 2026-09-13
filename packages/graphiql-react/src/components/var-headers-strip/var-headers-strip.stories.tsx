import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from '../tooltip';
import { VarHeadersStrip } from './';
import { GraphiQLProvider } from '../provider';

const noOpTransport = {
  url: 'https://example.com/graphql',
  method: 'POST' as const,
  supportedMethods: ['POST' as const],
  send: async () => ({
    ok: true,
    body: { data: {} },
    timing: { totalMs: 0 },
    size: {},
  }),
};

const meta: Meta<typeof VarHeadersStrip> = {
  title: 'GraphiQL/VarHeadersStrip',
  component: VarHeadersStrip,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <GraphiQLProvider transport={noOpTransport}>
        <Tooltip.Provider>
          <div
            style={{ height: 300, display: 'flex', flexDirection: 'column' }}
          >
            <Story />
          </div>
        </Tooltip.Provider>
      </GraphiQLProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof VarHeadersStrip>;

export const VariablesTab: Story = {
  name: 'Variables tab',
};

export const HeadersTab: Story = {
  name: 'Headers tab',
  args: { defaultTab: 'headers' },
};
