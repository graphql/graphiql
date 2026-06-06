'use no memo';

import type { FC } from 'react';
import './index.css';

export type ResponseTableViewProps = { data: unknown };

type ListMatch = {
  key: string;
  rows: Record<string, unknown>[];
};

function findFirstList(data: unknown): ListMatch | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  for (const [key, value] of Object.entries(data as object)) {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === 'object' &&
      value[0] !== null
    ) {
      return { key, rows: value as Record<string, unknown>[] };
    }
    const nested = findFirstList(value);
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

export const ResponseTableView: FC<ResponseTableViewProps> = ({ data }) => {
  const match = findFirstList(data);

  if (!match) {
    return (
      <div className="graphiql-response-table-empty" role="status">
        Table view requires a list response.
      </div>
    );
  }

  const { key, rows } = match;
  const cols = Array.from(new Set(rows.flatMap(row => Object.keys(row ?? {}))));

  return (
    <div className="graphiql-response-table-wrapper">
      <table className="graphiql-response-table">
        <caption className="graphiql-response-table-caption">{key}</caption>
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
    </div>
  );
};
