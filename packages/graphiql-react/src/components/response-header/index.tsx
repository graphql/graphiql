'use no memo';

import type { FC } from 'react';
import { SegmentedControl } from '../segmented-control';
import { ToolbarButton } from '../toolbar-button';
import { CopyIcon } from '../../icons';
import type { ResponseView } from '../../stores';
import './index.css';

export type ResponseHeaderProps = {
  /** HTTP-equivalent status code from the last response. */
  status?: number;
  /** Elapsed time for the last request in milliseconds. */
  timeMs?: number;
  /** Approximate response body size in bytes. */
  sizeBytes?: number;
  /** Currently active response view. */
  view: ResponseView;
  /** Called when the user selects a different view. */
  onViewChange: (view: ResponseView) => void;
  /** Called when the user clicks the copy button. Omit to hide the button. */
  onCopy?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const VIEW_OPTIONS: { value: ResponseView; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'tree', label: 'Tree' },
  { value: 'table', label: 'Table' },
];

export const ResponseHeader: FC<ResponseHeaderProps> = ({
  status,
  timeMs,
  sizeBytes,
  view,
  onViewChange,
  onCopy,
}) => {
  const isError = status !== undefined && (status === 0 || status >= 400);

  return (
    <header className="graphiql-response-header">
      {status !== undefined && (
        <span
          className={`graphiql-response-status${isError ? ' graphiql-response-status--error' : ' graphiql-response-status--ok'}`}
        >
          <span className="graphiql-response-status-dot" aria-hidden="true" />
          <span className="graphiql-response-status-code">
            {status === 0 ? 'Error' : status}
          </span>
        </span>
      )}
      {timeMs !== undefined && (
        <span className="graphiql-response-meta">{timeMs}ms</span>
      )}
      {sizeBytes !== undefined && (
        <span className="graphiql-response-meta">{formatBytes(sizeBytes)}</span>
      )}
      <span className="graphiql-response-header-spacer" />
      <SegmentedControl
        value={view}
        onChange={onViewChange}
        ariaLabel="Response view"
        options={VIEW_OPTIONS}
      />
      {onCopy && (
        <ToolbarButton label="Copy response" onClick={onCopy}>
          <CopyIcon aria-hidden="true" />
        </ToolbarButton>
      )}
    </header>
  );
};
