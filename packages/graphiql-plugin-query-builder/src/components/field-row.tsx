import type { GraphQLField } from 'graphql';
import type { FC } from 'react';
import type { ArgValue } from '../lib/document-mutator';
import { ArgInput } from './arg-input';

type FieldRowProps = {
  field: GraphQLField<unknown, unknown>;
  path: string[];
  selected: boolean;
  hasChildren: boolean;
  expanded: boolean;
  argValues?: Record<string, ArgValue>;
  /**
   * Map of arg name → variable name for args that have been promoted to
   * variables. When an arg name is present here, its input shows as a variable
   * badge instead of the literal input control.
   */
  argVariables?: Record<string, string>;
  onToggle: (path: string[]) => void;
  onExpand: (path: string[]) => void;
  onSetArg?: (path: string[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (path: string[], argName: string, suggestedName: string) => void;
  onDemoteArg?: (path: string[], varName: string) => void;
};

export const FieldRow: FC<FieldRowProps> = ({
  field,
  path,
  selected,
  hasChildren,
  expanded,
  argValues = {},
  argVariables = {},
  onToggle,
  onExpand,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
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
          {field.args.map(arg => {
            const varName = argVariables[arg.name];
            const isVariable = varName !== undefined;
            return (
              <div key={arg.name} className="graphiql-qb-arg-row">
                <span className="graphiql-qb-arg-name">{arg.name}:</span>
                <ArgInput
                  arg={arg}
                  value={argValues[arg.name] ?? ''}
                  onChange={v => onSetArg?.(fullPath, arg.name, v)}
                  isVariable={isVariable}
                  variableName={varName}
                  onPromote={
                    onPromoteArg
                      ? (argName, suggested) => onPromoteArg(fullPath, argName, suggested)
                      : undefined
                  }
                  onDemote={
                    onDemoteArg
                      ? (vName) => onDemoteArg(fullPath, vName)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
