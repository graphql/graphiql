import type { GraphQLField } from 'graphql';
import type { FC } from 'react';

type FieldRowProps = {
  field: GraphQLField<unknown, unknown>;
  path: string[];
  selected: boolean;
  hasChildren: boolean;
  expanded: boolean;
  onToggle: (path: string[]) => void;
  onExpand: (path: string[]) => void;
};

export const FieldRow: FC<FieldRowProps> = ({
  field,
  path,
  selected,
  hasChildren,
  expanded,
  onToggle,
  onExpand,
}) => {
  const fullPath = [...path, field.name];
  const indent = path.length * 12;

  return (
    <div
      className="graphiql-qb-field-row"
      style={{ paddingLeft: indent }}
      data-testid="field-row"
    >
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
  );
};
