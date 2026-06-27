import type { Meta, StoryObj } from '@storybook/react-vite';
import { KeycapHint, MODIFIER } from './';

const meta: Meta<typeof KeycapHint> = {
  title: 'Primitives/KeycapHint',
  component: KeycapHint,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof KeycapHint>;

export const Single: Story = {
  render: () => <KeycapHint keys={['K']} ariaLabel="Focus shortcut: K" />,
};

export const ChordWithModifier: Story = {
  render: () => (
    <KeycapHint keys={[MODIFIER.Meta, 'K']} ariaLabel="Open command palette" />
  ),
};

export const RunShortcut: Story = {
  render: () => (
    <KeycapHint keys={[MODIFIER.Meta, MODIFIER.Enter]} ariaLabel="Run query" />
  ),
};
