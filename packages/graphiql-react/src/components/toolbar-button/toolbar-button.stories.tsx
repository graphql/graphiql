import type { Meta, StoryObj } from '@storybook/react-vite';
import * as T from '@radix-ui/react-tooltip';
import { ToolbarButton } from './';

const meta: Meta<typeof ToolbarButton> = {
  title: 'Primitives/ToolbarButton',
  component: ToolbarButton,
  tags: ['autodocs'],
  args: {
    label: 'Prettify query',
    children: '✦',
  },
  decorators: [
    Story => (
      <T.Provider>
        <Story />
      </T.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ToolbarButton>;

export const Default: Story = {};
