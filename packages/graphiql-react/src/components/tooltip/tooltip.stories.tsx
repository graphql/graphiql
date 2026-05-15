import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './';

const meta: Meta = {
  title: 'Primitives/Tooltip',
  decorators: [
    Story => (
      <Tooltip.Provider>
        <Story />
      </Tooltip.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tooltip label="Tooltip text">
      <button style={{ padding: '6px 12px' }}>Hover me</button>
    </Tooltip>
  ),
};

export const TopPlacement: Story = {
  render: () => (
    <Tooltip label="Appears above" side="top">
      <button style={{ padding: '6px 12px' }}>Hover me</button>
    </Tooltip>
  ),
};
