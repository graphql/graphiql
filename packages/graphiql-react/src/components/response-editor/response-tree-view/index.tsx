'use no memo';

import { useState, type FC } from 'react';
import './index.css';

export type ResponseTreeViewProps = {
  /** The JSON value to render. Typically the parsed response body. */
  data: unknown;
  /**
   * Nodes at depth < this value start expanded; deeper nodes start collapsed.
   * @default 1
   */
  initiallyExpandedDepth?: number;
};

export const ResponseTreeView: FC<ResponseTreeViewProps> = ({
  data,
  initiallyExpandedDepth = 1,
}) => {
  // Render top-level keys of an object directly (no synthetic root wrapper).
  // This avoids the redundant `data > data > ...` nesting when the response
  // envelope itself has a `data` key.
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data as object);
    return (
      <div className="graphiql-response-tree">
        {entries.map(([k, v]) => (
          <TreeNode
            key={k}
            name={k}
            value={v}
            depth={0}
            initiallyExpandedDepth={initiallyExpandedDepth}
          />
        ))}
      </div>
    );
  }

  // Non-object body (scalar, null, array) — render as a single unnamed value.
  return (
    <div className="graphiql-response-tree">
      <RootValue value={data} initiallyExpandedDepth={initiallyExpandedDepth} />
    </div>
  );
};

type RootValueProps = {
  value: unknown;
  initiallyExpandedDepth: number;
};

// Renders a value that has no key label (used when the root body is not an object).
const RootValue: FC<RootValueProps> = ({ value, initiallyExpandedDepth }) => {
  const expandable = value !== null && typeof value === 'object';
  const [open, setOpen] = useState(initiallyExpandedDepth > 0);

  if (!expandable) {
    const valueClass = `graphiql-tree-value graphiql-tree-${scalarClass(value)}`;
    return (
      <div className="graphiql-tree-row" style={{ paddingLeft: 0 }}>
        <span className={valueClass}>{formatScalar(value)}</span>
      </div>
    );
  }

  const isArr = Array.isArray(value);
  const entries = isArr
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as object);
  const count = entries.length;
  const summary = isArr ? `Array [${count}]` : `Object {${count}}`;

  return (
    <div>
      <div className="graphiql-tree-row" style={{ paddingLeft: 0 }}>
        <button
          type="button"
          className="graphiql-tree-toggle"
          aria-label={open ? 'Collapse' : 'Expand'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? '▾' : '▸'}
        </button>
        <span className="graphiql-tree-summary">{summary}</span>
      </div>
      {open && (
        <div>
          {entries.map(([k, v]) => (
            <TreeNode
              key={k}
              name={k}
              value={v}
              depth={1}
              initiallyExpandedDepth={initiallyExpandedDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

type TreeNodeProps = {
  name: string;
  value: unknown;
  depth: number;
  initiallyExpandedDepth: number;
};

const TreeNode: FC<TreeNodeProps> = ({
  name,
  value,
  depth,
  initiallyExpandedDepth,
}) => {
  const expandable = value !== null && typeof value === 'object';
  const [open, setOpen] = useState(depth < initiallyExpandedDepth);

  if (!expandable) {
    const valueClass = `graphiql-tree-value graphiql-tree-${scalarClass(value)}`;
    return (
      <div className="graphiql-tree-row" style={{ paddingLeft: depth * 16 }}>
        <span className="graphiql-tree-key">{name}</span>
        <span className="graphiql-tree-colon">:</span>
        <span className={valueClass}>{formatScalar(value)}</span>
      </div>
    );
  }

  const isArr = Array.isArray(value);
  const entries = isArr
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as object);
  const count = entries.length;
  const summary = isArr ? `Array [${count}]` : `Object {${count}}`;

  return (
    <div>
      <div className="graphiql-tree-row" style={{ paddingLeft: depth * 16 }}>
        <button
          type="button"
          className="graphiql-tree-toggle"
          aria-label={open ? 'Collapse' : 'Expand'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? '▾' : '▸'}
        </button>
        <span className="graphiql-tree-key">{name}</span>
        <span className="graphiql-tree-colon">:</span>
        <span className="graphiql-tree-summary">{summary}</span>
      </div>
      {open && (
        <div>
          {entries.map(([k, v]) => (
            <TreeNode
              key={k}
              name={k}
              value={v}
              depth={depth + 1}
              initiallyExpandedDepth={initiallyExpandedDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function scalarClass(v: unknown): string {
  if (typeof v === 'string') {
    return 'string';
  }
  if (typeof v === 'number') {
    return 'number';
  }
  if (typeof v === 'boolean') {
    return 'bool';
  }
  return 'null';
}

function formatScalar(v: unknown): string {
  if (typeof v === 'string') {
    return JSON.stringify(v);
  }
  if (v === null) {
    return 'null';
  }
  return String(v);
}
