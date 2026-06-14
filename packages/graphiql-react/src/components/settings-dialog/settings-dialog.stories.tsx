import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { GraphiQLProvider } from '../provider';
import { SettingsDialog } from './index';

const noOpTransport = {
  send: async () => ({
    ok: true,
    body: { data: {} },
    timing: { totalMs: 0 },
    size: {},
  }),
};

const meta: Meta<typeof SettingsDialog> = {
  title: 'Components/SettingsDialog',
  component: SettingsDialog,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <GraphiQLProvider transport={noOpTransport}>
        <Story />
      </GraphiQLProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SettingsDialog>;

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Settings</Button>
        <SettingsDialog open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export const AlwaysOpen: Story = {
  render: function AlwaysOpenStory() {
    return <SettingsDialog open onOpenChange={() => {}} />;
  },
};

export const WithPersistHeaders: Story = {
  name: 'With persist-headers control',
  render: function WithPersistHeadersStory() {
    return (
      <SettingsDialog open onOpenChange={() => {}} showPersistHeadersSettings />
    );
  },
};
