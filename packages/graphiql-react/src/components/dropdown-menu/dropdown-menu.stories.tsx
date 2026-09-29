import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropdownMenu } from './';

const meta: Meta = {
  title: 'Primitives/DropdownMenu',
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Button>Open menu</DropdownMenu.Button>
      <DropdownMenu.Content>
        <DropdownMenu.Item>Item 1</DropdownMenu.Item>
        <DropdownMenu.Item>Item 2</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item disabled>Disabled</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const WithManyItems: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Button>Open menu</DropdownMenu.Button>
      <DropdownMenu.Content>
        <DropdownMenu.Item>Schema</DropdownMenu.Item>
        <DropdownMenu.Item>Explorer</DropdownMenu.Item>
        <DropdownMenu.Item>History</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Settings</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Unavailable</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};
