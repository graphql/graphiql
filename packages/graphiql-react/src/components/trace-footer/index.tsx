import type { FC } from 'react';
import type { ResolverTrace } from '@graphiql/toolkit';
import './index.css';

export type TraceFooterProps = {
  /** Per-resolver traces from the transport response. */
  traces: ResolverTrace[];
  /** Total request duration in milliseconds; used to scale the timeline bars. */
  totalMs: number;
};

export const TraceFooter: FC<TraceFooterProps> = ({ traces, totalMs }) => (
  <footer className="graphiql-trace-footer">
    <div className="graphiql-trace-footer-header">
      <span className="graphiql-trace-footer-eyebrow">TRACE</span>
      <span className="graphiql-trace-footer-summary">
        {traces.length} resolver{traces.length === 1 ? '' : 's'} &middot;{' '}
        {Math.round(totalMs)}ms
      </span>
    </div>
    <ul
      className="graphiql-trace-footer-list"
      aria-label="Resolver trace"
      tabIndex={0}
    >
      {traces.map((t, i) => (
        <li
          key={i}
          className="graphiql-trace-row"
          title={`${t.parentType}.${t.fieldName}: ${Math.round(t.durationMs)}ms`}
        >
          <span
            className="graphiql-trace-name"
            style={{ paddingLeft: t.path.length * 8 }}
          >
            {t.fieldName}
          </span>
          <span className="graphiql-trace-bar-track" aria-hidden="true">
            <span
              className="graphiql-trace-bar"
              style={{
                left: `${(t.startOffsetMs / totalMs) * 100}%`,
                width: `${Math.max((t.durationMs / totalMs) * 100, 1)}%`,
              }}
            />
          </span>
          <span className="graphiql-trace-ms">
            {Math.round(t.durationMs)}ms
          </span>
        </li>
      ))}
    </ul>
  </footer>
);
