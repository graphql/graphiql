'use no memo';

import type { FC } from 'react';
import { useGraphiQL } from '../provider';
import './index.css';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Idle',
  connecting: 'Connecting',
  connected: 'Connected',
  error: 'Connection error',
};

export type StatusBarViewProps = {
  connectionStatus: ConnectionStatus;
  typeCount: number;
};

export const StatusBarView: FC<StatusBarViewProps> = ({
  connectionStatus,
  typeCount,
}) => (
  <footer className="graphiql-status-bar" role="contentinfo">
    <span
      className={`graphiql-status-bar-conn graphiql-status-bar-conn-${connectionStatus}`}
      title={CONNECTION_LABEL[connectionStatus]}
    >
      <span className="graphiql-status-bar-conn-dot" aria-hidden="true" />
      {CONNECTION_LABEL[connectionStatus]}
    </span>
    {connectionStatus !== 'idle' && (
      <span className="graphiql-status-bar-types">{typeCount} types</span>
    )}
  </footer>
);

export const StatusBar: FC = () => {
  const schema = useGraphiQL(state => state.schema);
  const fetchError = useGraphiQL(state => state.fetchError);
  const isIntrospecting = useGraphiQL(state => state.isIntrospecting);
  const isFetching = useGraphiQL(state => state.isFetching);
  const lastResponse = useGraphiQL(state => state.lastResponse);

  const typeCount = schema ? Object.keys(schema.getTypeMap()).length : 0;

  const connectionStatus: ConnectionStatus = (() => {
    if (fetchError || lastResponse?.ok === false) {
      return 'error';
    }
    if (isIntrospecting || isFetching) {
      return 'connecting';
    }
    if (schema != null) {
      return 'connected';
    }
    return 'idle';
  })();

  return (
    <StatusBarView connectionStatus={connectionStatus} typeCount={typeCount} />
  );
};
