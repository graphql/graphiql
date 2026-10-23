import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  DocsIcon,
  HistoryIcon,
  StarIcon,
  MagnifyingGlassIcon,
  SettingsIcon,
} from '../../icons';
import { Tooltip } from '../tooltip';
import './index.css';

type Plugin = { title: string; icon: React.ComponentType };

const SAMPLE_PLUGINS: Plugin[] = [
  { title: 'Documentation Explorer', icon: DocsIcon },
  { title: 'History', icon: HistoryIcon },
  { title: 'Favorites', icon: StarIcon },
  { title: 'Search', icon: MagnifyingGlassIcon },
];

function ActivityRailDemo({
  initialActive,
  showSettings = true,
}: {
  initialActive?: string;
  showSettings?: boolean;
}) {
  const [active, setActive] = useState<string | null>(initialActive ?? null);

  function toggle(title: string) {
    setActive(prev => (prev === title ? null : title));
  }

  return (
    <Tooltip.Provider>
      <div style={{ display: 'flex', height: 400 }}>
        <nav className="graphiql-activity-rail" aria-label="Plugins">
          <ul className="graphiql-activity-rail-list">
            {SAMPLE_PLUGINS.map(plugin => {
              const Icon = plugin.icon;
              const isActive = active === plugin.title;
              const label = `${isActive ? 'Hide' : 'Show'} ${plugin.title}`;
              return (
                <li key={plugin.title}>
                  <Tooltip label={label}>
                    <button
                      type="button"
                      className={`graphiql-activity-rail-item${isActive ? ' active' : ''}`}
                      aria-pressed={isActive}
                      aria-label={label}
                      onClick={() => toggle(plugin.title)}
                    >
                      <Icon aria-hidden="true" />
                    </button>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
          <div className="graphiql-activity-rail-spacer" />
          {showSettings && (
            <Tooltip label="Settings">
              <button
                type="button"
                className="graphiql-activity-rail-settings"
                aria-label="Settings"
              >
                <SettingsIcon aria-hidden="true" />
              </button>
            </Tooltip>
          )}
        </nav>
        {active && (
          <div
            style={{
              padding: 16,
              borderRight: '1px solid oklch(var(--border-default))',
            }}
          >
            <strong>{active}</strong> panel
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
}

const meta: Meta = {
  title: 'Components/ActivityRail',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Default: StoryObj = {
  render: () => <ActivityRailDemo />,
};

export const WithActivePlugin: StoryObj = {
  render: () => <ActivityRailDemo initialActive="Documentation Explorer" />,
};

export const NoPluginsNoSettings: StoryObj = {
  render: () => (
    <Tooltip.Provider>
      <div style={{ display: 'flex', height: 400 }}>
        <nav className="graphiql-activity-rail" aria-label="Plugins">
          <ul className="graphiql-activity-rail-list" />
          <div className="graphiql-activity-rail-spacer" />
        </nav>
      </div>
    </Tooltip.Provider>
  ),
};
