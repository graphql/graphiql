import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { GraphiQLProvider, useGraphiQLActions } from './provider';
import { OperationDiffEditor } from './operation-diff-editor';

const mockFetcher = () => ({ data: null });

const SAMPLE_QUERY = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}`;

function SeedOverlay({ label }: { label: string }) {
  const { setDiffOverlay } = useGraphiQLActions();
  useEffect(() => {
    setDiffOverlay({
      modifiedQuery: SAMPLE_QUERY,
      label,
      // eslint-disable-next-line no-console
      onApply: () => console.log('Apply clicked'),
    });
    return () => setDiffOverlay(null);
  }, [setDiffOverlay, label]);
  return null;
}

const meta: Meta<typeof OperationDiffEditor> = {
  title: 'Components/OperationDiffEditor',
  component: OperationDiffEditor,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <GraphiQLProvider fetcher={mockFetcher}>
        <div style={{ height: 400 }}>
          <Story />
        </div>
      </GraphiQLProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof OperationDiffEditor>;

/**
 * Header strip rendered with a primed overlay. The Monaco diff itself does not
 * mount in Storybook (Monaco is initialized at runtime in the main app), so
 * this story is for visual review of the label and the Apply/Cancel buttons.
 */
export const HeaderStrip: Story = {
  render: () => (
    <>
      <SeedOverlay label="GetUser" />
      <OperationDiffEditor />
    </>
  ),
};

export const LongLabel: Story = {
  render: () => (
    <>
      <SeedOverlay label="GetUserWithAReallyLongOperationNameThatMightWrap" />
      <OperationDiffEditor />
    </>
  ),
};
