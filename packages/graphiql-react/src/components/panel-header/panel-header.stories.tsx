import type { Meta, StoryObj } from '@storybook/react-vite';
import { MagnifyingGlassIcon, SettingsIcon } from '../../icons';
import { ToolbarButton } from '../toolbar-button';
import { Tooltip } from '../tooltip';
import { PanelHeader } from './';

const meta: Meta<typeof PanelHeader> = {
  title: 'Primitives/PanelHeader',
  component: PanelHeader,
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

type Story = StoryObj<typeof PanelHeader>;

export const TitleOnly: Story = {
  args: { title: 'Schema' },
};

export const WithSubtitle: Story = {
  args: { title: 'Schema', subtitle: 'Pokemon API' },
};

export const WithActions: Story = {
  args: {
    title: 'History',
    subtitle: 'Last 500 runs, searchable.',
    actions: (
      <>
        <ToolbarButton label="Search">
          <MagnifyingGlassIcon aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Settings">
          <SettingsIcon aria-hidden="true" />
        </ToolbarButton>
      </>
    ),
  },
};
