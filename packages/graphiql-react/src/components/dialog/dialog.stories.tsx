import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Dialog } from './';

const meta: Meta = {
  title: 'Primitives/Dialog',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'var(--px-4) var(--px-4) var(--px-4) var(--px-16)',
  borderBottom: '1px solid oklch(var(--border-default))',
} as const;

const bodyStyle = {
  padding: 'var(--px-16)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--px-12)',
} as const;

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open settings</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <div style={{ minWidth: 360 }}>
            <div style={headerStyle}>
              <Dialog.Title style={{ margin: 0 }}>Settings</Dialog.Title>
              <Dialog.Close />
            </div>
            <div style={bodyStyle}>
              <Dialog.Description style={{ margin: 0 }}>
                Update your preferences.
              </Dialog.Description>
            </div>
          </div>
        </Dialog>
      </>
    );
  },
};

export const ConfirmAction: Story = {
  render: function ConfirmActionStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Discard changes</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <div style={{ minWidth: 360 }}>
            <div style={headerStyle}>
              <Dialog.Title style={{ margin: 0 }}>
                Discard changes?
              </Dialog.Title>
              <Dialog.Close />
            </div>
            <div style={bodyStyle}>
              <Dialog.Description style={{ margin: 0 }}>
                Your unsaved changes will be lost.
              </Dialog.Description>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--px-8)',
                  justifyContent: 'flex-end',
                }}
              >
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  Discard
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      </>
    );
  },
};
