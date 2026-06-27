'use no memo';

import type { FC } from 'react';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import type { GraphiQLPlugin } from '../../stores/plugin';
import { Tooltip } from '../tooltip';
import { SettingsIcon } from '../../icons';
import './index.css';

export interface ActivityRailProps {
  /**
   * Called when a plugin button is clicked, after the store has been updated.
   * Receives the plugin that is now visible, or `null` if the panel was closed.
   */
  onPluginToggle?: (nextPlugin: GraphiQLPlugin | null) => void;
  /** Called when the settings gear button is clicked. */
  onSettingsClick?: () => void;
}

export const ActivityRail: FC<ActivityRailProps> = ({
  onPluginToggle,
  onSettingsClick,
}) => {
  const plugins = useGraphiQL(state => state.plugins);
  const visiblePlugin = useGraphiQL(state => state.visiblePlugin);
  const { setVisiblePlugin } = useGraphiQLActions();

  return (
    <nav className="graphiql-activity-rail" aria-label="Plugins">
      <ul className="graphiql-activity-rail-list">
        {plugins.map(plugin => {
          const Icon = plugin.icon;
          const isActive = visiblePlugin?.title === plugin.title;
          const label = `${isActive ? 'Hide' : 'Show'} ${plugin.title}`;
          const nextPlugin = isActive ? null : plugin;
          return (
            <li key={plugin.title}>
              <Tooltip label={label}>
                <button
                  type="button"
                  className={`graphiql-activity-rail-item${isActive ? ' active' : ''}`}
                  aria-pressed={isActive}
                  aria-label={label}
                  onClick={() => {
                    setVisiblePlugin(nextPlugin);
                    onPluginToggle?.(nextPlugin);
                  }}
                >
                  <Icon aria-hidden="true" />
                </button>
              </Tooltip>
            </li>
          );
        })}
      </ul>
      <div className="graphiql-activity-rail-spacer" />
      {onSettingsClick && (
        <Tooltip label="Settings">
          <button
            type="button"
            className="graphiql-activity-rail-settings"
            aria-label="Settings"
            onClick={onSettingsClick}
          >
            <SettingsIcon aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </nav>
  );
};
