import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Button' },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Primary: Story = {
  args: { variant: 'primary', children: 'Run' },
};

export const Success: Story = {
  args: { state: 'success', children: 'Copied!' },
};

export const Error: Story = {
  args: { state: 'error', children: 'Failed' },
};

export const Disabled: Story = {
  args: { disabled: true },
};
