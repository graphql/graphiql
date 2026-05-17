'use no memo';

import type { FC } from 'react';
import { useGraphiQL } from '../provider';
import './index.css';

export type StatusBarProps = {
  encoding?: string;
};

export type StatusBarViewProps = StatusBarProps & {
  isConnected: boolean;
  typeCount: number;
  pluginCount: number;
};

export const StatusBarView: FC<StatusBarViewProps> = ({
  isConnected,
  typeCount,
  pluginCount,
  encoding = 'UTF-8',
}) => (
  <footer className="graphiql-status-bar" role="contentinfo">
    <span
      className={`graphiql-status-bar-conn${isConnected ? ' connected' : ' disconnected'}`}
    >
      <span className="graphiql-status-bar-conn-dot" aria-hidden="true" />
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
    {isConnected && (
      <span className="graphiql-status-bar-types">{typeCount} types</span>
    )}
    {pluginCount > 0 && (
      <span className="graphiql-status-bar-plugins">
        {pluginCount} {pluginCount === 1 ? 'plugin' : 'plugins'}
      </span>
    )}
    <span className="graphiql-status-bar-spacer" />
    <span>{encoding}</span>
    <span>GraphQL</span>
  </footer>
);

export const StatusBar: FC<StatusBarProps> = props => {
  const schema = useGraphiQL(state => state.schema);
  const plugins = useGraphiQL(state => state.plugins);
  const isConnected = schema != null;
  const typeCount = schema ? Object.keys(schema.getTypeMap()).length : 0;

  return (
    <StatusBarView
      {...props}
      isConnected={isConnected}
      typeCount={typeCount}
      pluginCount={plugins.length}
    />
  );
};
