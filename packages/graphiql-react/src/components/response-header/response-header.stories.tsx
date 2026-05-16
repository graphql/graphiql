import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tooltip } from '../tooltip';
import { ResponseHeader } from './';
import type { ResponseView } from '../../stores';

const meta: Meta<typeof ResponseHeader> = {
  title: 'Primitives/ResponseHeader',
  component: ResponseHeader,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Tooltip.Provider>
        <Story />
      </Tooltip.Provider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ResponseHeader>;

export const Empty: Story = {
  render() {
    const [view, setView] = useState<ResponseView>('json');
    return <ResponseHeader view={view} onViewChange={setView} />;
  },
};

export const WithMetadata: Story = {
  render() {
    const [view, setView] = useState<ResponseView>('json');
    return (
      <ResponseHeader
        status={200}
        timeMs={143}
        sizeBytes={2812}
        view={view}
        onViewChange={setView}
        onCopy={() => {}}
      />
    );
  },
};

export const ErrorStatus: Story = {
  render() {
    const [view, setView] = useState<ResponseView>('json');
    return (
      <ResponseHeader
        status={0}
        timeMs={12}
        sizeBytes={89}
        view={view}
        onViewChange={setView}
      />
    );
  },
};

export const TreeView: Story = {
  render() {
    const [view, setView] = useState<ResponseView>('tree');
    return (
      <ResponseHeader
        status={200}
        timeMs={56}
        sizeBytes={1024}
        view={view}
        onViewChange={setView}
        onCopy={() => {}}
      />
    );
  },
};
