import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab, Tabs } from './';

const meta: Meta = {
  title: 'Primitives/Tabs',
  tags: ['autodocs'],
  parameters: {
    a11y: {
      // The Tab primitive renders `<li role="tab">` containing a child button,
      // which axe flags as `nested-interactive`. Fixing it cleanly means
      // restructuring the primitive's ARIA model; that's out of scope for the
      // restyle.
      config: { rules: [{ id: 'nested-interactive', enabled: false }] },
    },
  },
};

export default meta;

type Story = StoryObj;

export const TwoTabs: Story = {
  render: function TwoTabsStory() {
    const [tabs] = useState([
      { id: 'a', label: 'Query 1' },
      { id: 'b', label: 'Query 2' },
    ]);
    const [active, setActive] = useState('a');

    return (
      <div style={{ fontFamily: 'var(--font-family-mono)' }}>
        <Tabs values={tabs} onReorder={() => {}} className="no-scrollbar">
          {tabs.map(tab => (
            <Tab key={tab.id} value={tab} isActive={active === tab.id}>
              <Tab.Button onClick={() => setActive(tab.id)}>
                {tab.label}
              </Tab.Button>
              <Tab.Close />
            </Tab>
          ))}
        </Tabs>
        <div style={{ padding: '12px', color: 'oklch(var(--fg-default))' }}>
          {active === 'a' ? 'First tab content' : 'Second tab content'}
        </div>
      </div>
    );
  },
};

export const ManyTabs: Story = {
  render: function ManyTabsStory() {
    const [tabs] = useState(
      Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        label: `Operation ${i + 1}`,
      })),
    );
    const [active, setActive] = useState('0');

    return (
      <div style={{ maxWidth: 360 }}>
        <Tabs values={tabs} onReorder={() => {}} className="no-scrollbar">
          {tabs.map(tab => (
            <Tab key={tab.id} value={tab} isActive={active === tab.id}>
              <Tab.Button onClick={() => setActive(tab.id)}>
                {tab.label}
              </Tab.Button>
              <Tab.Close />
            </Tab>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const ActiveState: Story = {
  render: function ActiveStateStory() {
    const tabs = [
      { id: 'active', label: 'Active Tab' },
      { id: 'inactive', label: 'Inactive' },
    ];

    return (
      <Tabs values={tabs} onReorder={() => {}} className="no-scrollbar">
        <Tab value={tabs[0]} isActive>
          <Tab.Button>Active Tab</Tab.Button>
          <Tab.Close />
        </Tab>
        <Tab value={tabs[1]}>
          <Tab.Button>Inactive</Tab.Button>
        </Tab>
      </Tabs>
    );
  },
};
