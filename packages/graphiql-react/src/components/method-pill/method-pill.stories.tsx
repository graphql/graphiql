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

// The pills read their colors from --accent-green/-yellow/-purple, which
// resolve differently per theme, so the default (dark) stories above don't
// exercise light-theme contrast. These pin the light theme explicitly so the
// a11y check covers both.
export const QueryLight: Story = {
  render: () => <MethodPill operation="query" />,
  globals: { theme: 'light' },
};

export const MutationLight: Story = {
  render: () => <MethodPill operation="mutation" />,
  globals: { theme: 'light' },
};

export const SubscriptionLight: Story = {
  render: () => <MethodPill operation="subscription" />,
  globals: { theme: 'light' },
};
