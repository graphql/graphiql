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

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open settings</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <div style={{ minWidth: 360 }}>
            <Dialog.Header>Settings</Dialog.Header>
            <Dialog.Body>
              <Dialog.Description style={{ margin: 0 }}>
                Update your preferences.
              </Dialog.Description>
            </Dialog.Body>
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
            <Dialog.Header>Discard changes?</Dialog.Header>
            <Dialog.Body>
              <Dialog.Description style={{ margin: 0 }}>
                Your unsaved changes will be lost.
              </Dialog.Description>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Discard
              </Button>
            </Dialog.Footer>
          </div>
        </Dialog>
      </>
    );
  },
};
