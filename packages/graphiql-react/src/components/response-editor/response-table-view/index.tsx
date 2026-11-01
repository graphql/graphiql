'use no memo';

import type { FC } from 'react';
import './index.css';

export type ResponseTableViewProps = { data: unknown };

type ListMatch = {
  path: string;
  rows: Record<string, unknown>[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isListOfObjects(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null
  );
}

/**
 * Walk the response top-down and return every list-of-objects found at the
 * shallowest level that contains one. Sibling lists (including aliased fields
 * like `a: friends`) are all returned so each renders as its own table.
 */
function findListGroup(data: unknown, path: string[] = []): ListMatch[] | null {
  if (!isObject(data)) {
    return null;
  }
  const entries = Object.entries(data);
  const lists = entries.filter(([, value]) => isListOfObjects(value));
  if (lists.length > 0) {
    return lists.map(([key, value]) => ({
      path: [...path, key].join('.'),
      rows: value as Record<string, unknown>[],
    }));
  }
  for (const [key, value] of entries) {
    const nested = findListGroup(value, [...path, key]);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (Array.isArray(value)) {
    return `Array [${value.length}]`;
  }
  if (typeof value === 'object') {
    return `Object {${Object.keys(value).length}}`;
  }
  return String(value);
}

const ResponseTable: FC<ListMatch> = ({ path, rows }) => {
  const cols = Array.from(new Set(rows.flatMap(row => Object.keys(row ?? {}))));

  return (
    <table className="graphiql-response-table">
      <caption className="graphiql-response-table-caption">{path}</caption>
      <thead>
        <tr>
          {cols.map(col => (
            <th key={col} scope="col">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={i}>
            {cols.map(col => (
              <td key={col}>
                {formatCell((row as Record<string, unknown>)[col])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const ResponseTableView: FC<ResponseTableViewProps> = ({ data }) => {
  const root = isObject(data) && 'data' in data ? data.data : data;
  const matches = findListGroup(root);

  if (!matches) {
    return (
      <div className="graphiql-response-table-empty" role="status">
        Table view requires a list response.
      </div>
    );
  }

  return (
    <div className="graphiql-response-table-wrapper">
      {matches.map(match => (
        <ResponseTable key={match.path} path={match.path} rows={match.rows} />
      ))}
    </div>
  );
};
