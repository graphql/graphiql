import type { Meta, StoryObj } from '@storybook/react-vite';
import { MethodPill } from './';

const meta: Meta<typeof MethodPill> = {
  title: 'Primitives/MethodPill',
  component: MethodPill,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof MethodPill>;

export const Query: Story = {
  render: () => <MethodPill operation="query" />,
};

export const Mutation: Story = {
  render: () => <MethodPill operation="mutation" />,
};

export const Subscription: Story = {
  render: () => <MethodPill operation="subscription" />,
};

export const Invalid: Story = {
  render: () => <MethodPill operation="invalid" />,
};
