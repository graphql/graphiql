import type { Meta, StoryObj } from '@storybook/react';
import { KeycapHint } from './';

const meta: Meta<typeof KeycapHint> = {
  title: 'Primitives/KeycapHint',
  component: KeycapHint,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof KeycapHint>;

export const Single: Story = {
  args: { keys: ['K'], ariaLabel: 'Focus shortcut: K' },
};
export const ChordWithModifier: Story = {
  args: { keys: ['⌘', 'K'], ariaLabel: 'Open command palette' },
};
export const RunShortcut: Story = {
  args: { keys: ['⌘', '⏎'], ariaLabel: 'Run query' },
};
