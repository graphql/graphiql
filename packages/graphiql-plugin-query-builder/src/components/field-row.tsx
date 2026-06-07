import type { GraphQLField } from 'graphql';
import type { FC } from 'react';
import { ArgInput } from './arg-input';

type FieldRowProps = {
  field: GraphQLField<unknown, unknown>;
  path: string[];
  selected: boolean;
  hasChildren: boolean;
  expanded: boolean;
  argValues?: Record<string, string>;
  onToggle: (path: string[]) => void;
  onExpand: (path: string[]) => void;
  onSetArg?: (path: string[], argName: string, value: string) => void;
};

export const FieldRow: FC<FieldRowProps> = ({
  field,
  path,
  selected,
  hasChildren,
  expanded,
  argValues = {},
  onToggle,
  onExpand,
  onSetArg,
}) => {
  const fullPath = [...path, field.name];
  const indent = path.length * 12;
  const hasArgs = field.args.length > 0;

  return (
    <div
      className="graphiql-qb-field-row"
      style={{ paddingLeft: indent }}
      data-testid="field-row"
    >
      <div className="graphiql-qb-field-header">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(fullPath)}
          aria-label={`Toggle ${field.name}`}
          className="graphiql-qb-field-checkbox"
        />
        {hasChildren ? (
          <button
            type="button"
            className="graphiql-qb-expand-btn"
            onClick={() => onExpand(fullPath)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${field.name}`}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="graphiql-qb-expand-placeholder" aria-hidden="true" />
        )}
        <span className="graphiql-qb-field-name">{field.name}</span>
        <span className="graphiql-qb-field-type">{String(field.type)}</span>
      </div>
      {selected && hasArgs && (
        <div className="graphiql-qb-field-args">
          {field.args.map(arg => (
            <div key={arg.name} className="graphiql-qb-arg-row">
              <span className="graphiql-qb-arg-name">{arg.name}:</span>
              <ArgInput
                arg={arg}
                value={argValues[arg.name] ?? ''}
                onChange={v => onSetArg?.(fullPath, arg.name, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
