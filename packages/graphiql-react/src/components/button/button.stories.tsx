import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  render: () => <Button>Button</Button>,
};

export const Primary: Story = {
  render: () => <Button variant="primary">Run</Button>,
};

export const Success: Story = {
  render: () => <Button state="success">Copied!</Button>,
};

export const Error: Story = {
  render: () => <Button state="error">Failed</Button>,
};

export const Disabled: Story = {
  render: () => <Button disabled>Button</Button>,
};
