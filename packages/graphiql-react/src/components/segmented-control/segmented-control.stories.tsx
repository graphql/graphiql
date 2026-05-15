import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SegmentedControl } from './';

const meta: Meta = {
  title: 'Primitives/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
};
export default meta;

export const ResponseView: StoryObj = {
  render() {
    const [v, setV] = useState('json');
    return (
      <SegmentedControl
        value={v}
        onChange={setV}
        ariaLabel="Response view"
        options={[
          { value: 'json', label: 'JSON' },
          { value: 'tree', label: 'Tree' },
          { value: 'table', label: 'Table' },
        ]}
      />
    );
  },
};

export const Density: StoryObj = {
  render() {
    const [v, setV] = useState('comfortable');
    return (
      <SegmentedControl
        value={v}
        onChange={setV}
        ariaLabel="Density"
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'spacious', label: 'Spacious' },
        ]}
      />
    );
  },
};

export const WithDisabledOption: StoryObj = {
  render() {
    const [v, setV] = useState('list');
    return (
      <SegmentedControl
        value={v}
        onChange={setV}
        ariaLabel="View mode"
        options={[
          { value: 'list', label: 'List' },
          { value: 'grid', label: 'Grid' },
          { value: 'map', label: 'Map', disabled: true },
        ]}
      />
    );
  },
};
